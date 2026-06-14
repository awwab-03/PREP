import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageSpinner } from "@/components/ui/spinner";

/** Gate routes behind authentication. Redirects to /login if not signed in. */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner label="Loading your workspace..." />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
}
