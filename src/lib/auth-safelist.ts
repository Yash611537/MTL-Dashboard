/** Comma-separated emails in NEXT_PUBLIC_AUTH_SAFELIST_EMAILS (case-insensitive). */

function rawSafelistString(): string {
  const v = process.env.NEXT_PUBLIC_AUTH_SAFELIST_EMAILS ?? "";
  return v
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

export function getAuthSafelist(): Set<string> {
  const raw = rawSafelistString();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** True when at least one allowlist email is configured (build-time env). */
export function isAllowlistConfigured(): boolean {
  return getAuthSafelist().size > 0;
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = getAuthSafelist();
  if (list.size === 0) return false;
  return list.has(email.trim().toLowerCase());
}

/** Primary email for allowlist checks (Google usually sets user.email). */
export function getUserAllowlistEmail(user: {
  email: string | null;
  providerData: { email?: string | null }[];
}): string | null {
  const direct = user.email?.trim();
  if (direct) return direct;
  const fromProvider = user.providerData.find((p) => p.email)?.email;
  return fromProvider?.trim() ?? null;
}
