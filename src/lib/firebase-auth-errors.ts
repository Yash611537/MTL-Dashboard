/** Map Firebase Auth errors to actionable messages for the dashboard. */

export function formatFirebaseAuthError(e: unknown): string {
  if (e && typeof e === "object" && "code" in e) {
    const code = String((e as { code: string }).code);
    const fallback =
      "message" in e && typeof (e as { message: string }).message === "string"
        ? (e as { message: string }).message
        : code;

    const host =
      typeof window !== "undefined" ? window.location.host : "this site";

    switch (code) {
      case "auth/unauthorized-domain":
        return `This origin (${host}) is not an authorized domain. In Firebase Console → Authentication → Settings → Authorized domains, click “Add domain” and add: ${host}. If you use 127.0.0.1, add “127.0.0.1” (not only localhost). For Vercel previews, add your *.vercel.app host.`;
      case "auth/operation-not-allowed":
        return "Google sign-in is disabled. In Firebase Console → Authentication → Sign-in method, enable Google.";
      case "auth/popup-blocked":
      case "auth/popup-closed-by-user":
        return "Sign-in was cancelled.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      default:
        return fallback;
    }
  }
  if (e instanceof Error) return e.message;
  return "Sign-in failed.";
}
