import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth';
import { z } from 'zod';

const RequestSchema = z.object({
  moduleId: z.string().min(1),
  by: z.enum(['numTeams', 'studentsPerTeam']),
  value: z.number().int().positive(),
  assignRolesRandomly: z.boolean().default(false),
});

export async function POST(req: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server unavailable' }, { status: 500 });
  }

  // Authenticate caller
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user?.email || !isAdminEmail(user.email, 'server')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
  }

  const { moduleId, by, value, assignRolesRandomly } = parsed.data;

  // Fetch module roles (for random assignment)
  let moduleRoles: string[] = [];
  if (assignRolesRandomly) {
    // Module roles are stored in module.yaml / module record; look up via modules table if available
    // Fall back to empty if not found
    const { data: moduleData } = await supabase
      .from('modules')
      .select('metadata')
      .eq('id', moduleId)
      .maybeSingle();
    const roles = (moduleData?.metadata as Record<string, unknown>)?.roles;
    if (Array.isArray(roles)) {
      moduleRoles = roles.filter((r) => r !== 'Instructor') as string[];
    }
  }

  // Fetch users enrolled in this module (enrollment-scoped pool)
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('module_enrollments')
    .select('user_id')
    .eq('module_id', moduleId);

  if (enrollmentsError) {
    return NextResponse.json({ error: enrollmentsError.message }, { status: 500 });
  }

  // Exclude module instructors from the student pool
  const { data: moduleInstructors } = await supabase
    .from('module_instructors')
    .select('user_id')
    .eq('module_id', moduleId);
  const instructorSet = new Set((moduleInstructors ?? []).map((r) => r.user_id));

  const studentIds: string[] = (enrollments ?? [])
    .map((e) => e.user_id)
    .filter((id) => !instructorSet.has(id));

  // Shuffle
  for (let i = studentIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [studentIds[i], studentIds[j]] = [studentIds[j], studentIds[i]];
  }

  // Split into teams
  let teamSize: number;
  let numTeams: number;
  if (by === 'numTeams') {
    numTeams = value;
    teamSize = Math.ceil(studentIds.length / numTeams);
  } else {
    teamSize = value;
    numTeams = Math.ceil(studentIds.length / teamSize);
  }

  const teamGroups: string[][] = [];
  for (let i = 0; i < numTeams; i++) {
    const slice = studentIds.slice(i * teamSize, (i + 1) * teamSize);
    if (slice.length > 0) teamGroups.push(slice);
  }

  // Remove prior team memberships for this module (one team per user per module)
  const { data: existingTeams } = await supabase
    .from('teams')
    .select('id')
    .eq('module_id', moduleId);

  if (existingTeams && existingTeams.length > 0) {
    const existingTeamIds = existingTeams.map((t) => t.id);
    await supabase.from('team_members').delete().in('team_id', existingTeamIds);
    await supabase.from('teams').delete().eq('module_id', moduleId);
  }

  // Create teams and members
  const createdTeams = [];
  for (let i = 0; i < teamGroups.length; i++) {
    const members = teamGroups[i];
    const role = assignRolesRandomly && moduleRoles.length > 0
      ? moduleRoles[i % moduleRoles.length]
      : null;

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        module_id: moduleId,
        name: `Team ${i + 1}`,
        role,
        created_by: user.id,
      })
      .select()
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: teamError?.message ?? 'Failed to create team' }, { status: 500 });
    }

    const memberRows = members.map((userId) => ({ team_id: team.id, user_id: userId }));
    const { error: membersError } = await supabase.from('team_members').insert(memberRows);
    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    // Auto-enroll team members in the module
    const enrollmentRows = members.map((userId) => ({
      module_id: moduleId,
      user_id: userId,
      enrolled_by: user.id,
    }));
    await supabase
      .from('module_enrollments')
      .upsert(enrollmentRows, { onConflict: 'module_id, user_id' });

    createdTeams.push({ ...team, memberCount: members.length });
  }

  return NextResponse.json({ teams: createdTeams });
}
