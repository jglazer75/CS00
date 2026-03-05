import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth';
import { z } from 'zod';

const PatchSchema = z.object({
  metadata: z.record(z.string(), z.unknown()),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server unavailable' }, { status: 500 });
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = user.email ? isAdminEmail(user.email, 'server') : false;
  if (!isAdmin) {
    const { data: module } = await supabase
      .from('modules')
      .select('owner_user_id')
      .eq('id', moduleId)
      .maybeSingle();

    if (!module || module.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
  }

  // Merge metadata (read existing first, then merge)
  const { data: existing } = await supabase
    .from('modules')
    .select('metadata')
    .eq('id', moduleId)
    .maybeSingle();

  const mergedMetadata = { ...(existing?.metadata ?? {}), ...parsed.data.metadata };

  const { error: updateError } = await supabase
    .from('modules')
    .update({ metadata: mergedMetadata })
    .eq('id', moduleId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, metadata: mergedMetadata });
}
