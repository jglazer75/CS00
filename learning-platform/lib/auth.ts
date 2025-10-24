export function getAdminEmails(source: 'public' | 'server' = 'public'): string[] {
  const raw = source === 'server' ? process.env.ADMIN_EMAILS : process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

export function isAdminEmail(email: string | null | undefined, source: 'public' | 'server' = 'public'): boolean {
  if (!email) {
    return false;
  }
  const normalized = email.trim().toLowerCase();
  return getAdminEmails(source).includes(normalized);
}
