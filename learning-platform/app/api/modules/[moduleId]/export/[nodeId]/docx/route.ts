import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseUserClient } from '@/lib/supabase/serverUser';
import { isAdminEmail } from '@/lib/auth';
import { markdownToDocxBuffer } from '@/lib/docx/markdownToDocx';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ moduleId: string; nodeId: string }> }
) {
  const { moduleId, nodeId } = await params;

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server unavailable' }, { status: 500 });
  }

  // Auth: get the requesting user (if any)
  const userClient = await getSupabaseUserClient();
  const { data: { user } } = await userClient.auth.getUser();

  // Check module access
  const { data: module } = await supabase
    .from('modules')
    .select('is_public, allow_unauthenticated, title')
    .eq('id', moduleId)
    .maybeSingle();

  if (!module) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 });
  }

  if (!module.is_public && !module.allow_unauthenticated) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.email ? isAdminEmail(user.email, 'server') : false;
    if (!isAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_instructor')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.is_instructor) {
        const { data: enrollment } = await supabase
          .from('module_enrollments')
          .select('id')
          .eq('module_id', moduleId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!enrollment) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }
  }

  // Fetch node to get content_source and title
  const { data: node } = await supabase
    .from('module_nodes')
    .select('node_id, title, content_source')
    .eq('module_id', moduleId)
    .eq('node_id', nodeId)
    .maybeSingle();

  if (!node) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const contentDir = path.join(process.cwd(), 'content');
  const moduleDirectory = path.join(contentDir, moduleId);
  const contentSource = (node.content_source as string | null) || `${nodeId}.md`;
  const fullPath = path.isAbsolute(contentSource)
    ? contentSource
    : path.join(moduleDirectory, contentSource);

  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: 'Content file not found' }, { status: 404 });
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { content } = matter(fileContents);

  const title = (node.title as string) || nodeId;
  const buffer = await markdownToDocxBuffer(content, title);

  const safeFilename = `${nodeId}.docx`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Content-Length': String(buffer.length),
    },
  });
}
