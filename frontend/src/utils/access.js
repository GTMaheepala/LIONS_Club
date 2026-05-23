/**
 * @param {{ role?: string, hasFullAccess?: boolean } | null | undefined} user
 * @param {string} [fallbackApproved]
 */
export function getPostAuthRedirect(user, fallbackApproved = "/dashboard") {
  if (!user) return "/login";
  if (user.role === "admin") return "/admin";
  if (!user.hasFullAccess) return "/waiting";
  return fallbackApproved;
}
