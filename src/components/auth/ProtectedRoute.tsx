import { Navigate, Outlet } from "react-router-dom";

/**
 * A protected route wrapper that:
 * ✅ Checks if the user is logged in (authToken in localStorage)
 * ✅ Matches allowed roles (supports underscore/hyphen variations)
 * ✅ Redirects unauthorized users to /login
 */
interface ProtectedRouteProps {
  allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem("authToken");
  const storedRole = localStorage.getItem("userRole");

  if (!token || !storedRole) {
    console.warn("🔒 No token or role found. Redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  // Normalize role (handles backend sending "executive_admin")
  const normalizedRole = storedRole.replace(/_/g, "-").toLowerCase();

  // Normalize all allowed roles for flexible comparison
  const normalizedAllowedRoles = allowedRoles.map((r) =>
    r.replace(/_/g, "-").toLowerCase()
  );

  if (!normalizedAllowedRoles.includes(normalizedRole)) {
    console.warn(
      `🚫 Unauthorized: ${normalizedRole} not in [${normalizedAllowedRoles.join(
        ", "
      )}]`
    );
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
