import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth';
import { z } from 'zod';

const PatchSchema = z.object({
  metadata: z.record(z.string(), z.unknown()).optional(),
  description: z.string().optional(),
  is_public: z.boolean().optional(),
  allow_unauthenticated: z.boolean().optional(),
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

  const updatePayload: Record<string, unknown> = {};

  if (parsed.data.metadata !== undefined) {
    // Merge metadata (read existing first, then merge)
    const { data: existing } = await supabase
      .from('modules')
      .select('metadata')
      .eq('id', moduleId)
      .maybeSingle();

    updatePayload.metadata = { ...(existing?.metadata ?? {}), ...parsed.data.metadata };
  }

  if (parsed.data.description !== undefined) {
    updatePayload.description = parsed.data.description;
  }

  if (parsed.data.is_public !== undefined) {
    updatePayload.is_public = parsed.data.is_public;
  }

  if (parsed.data.allow_unauthenticated !== undefined) {
    updatePayload.allow_unauthenticated = parsed.data.allow_unauthenticated;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ success: true });
  }

  const { error: updateError } = await supabase
    .from('modules')
    .update(updatePayload)
    .eq('id', moduleId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, ...updatePayload });
}
