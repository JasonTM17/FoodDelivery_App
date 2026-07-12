/**
 * B-WEB-01 residual: tokens live in localStorage (XSS-readable), not HttpOnly cookies.
 * clearAdminSession must wipe every session key on logout / unauthorized.
 */
export function clearAdminSession(): void {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_refresh_token');
  localStorage.removeItem('admin_user');
}
