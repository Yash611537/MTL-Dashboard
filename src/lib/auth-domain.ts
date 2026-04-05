/** Only these Google accounts may use the dashboard. */
export const ALLOWED_EMAIL_DOMAIN = "@mytronlabs.com";

export function isAllowedMytronEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  return email.trim().toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN.toLowerCase());
}
