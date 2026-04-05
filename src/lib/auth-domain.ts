/** Only these Google accounts may use the dashboard (when no allowlist is set). */
export const ALLOWED_EMAIL_DOMAIN = "@mytronlabs.com";

export function isAllowedMytronEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  return email.trim().toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN.toLowerCase());
}

/**
 * Comma-, semicolon-, or newline-separated list from NEXT_PUBLIC_ALLOWED_LOGIN_EMAILS.
 * Empty / unset → any address on {@link ALLOWED_EMAIL_DOMAIN} may sign in.
 */
export function getLoginAllowlist(): string[] {
  const raw = process.env.NEXT_PUBLIC_ALLOWED_LOGIN_EMAILS;
  if (raw == null || !String(raw).trim()) return [];
  return String(raw)
    .split(/[,;\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function loginUsesEmailAllowlist(): boolean {
  return getLoginAllowlist().length > 0;
}

/** True if this Google account may use the app (domain + optional allowlist). */
export function isLoginAllowed(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  if (!isAllowedMytronEmail(normalized)) return false;
  const list = getLoginAllowlist();
  if (list.length === 0) return true;
  return list.includes(normalized);
}
