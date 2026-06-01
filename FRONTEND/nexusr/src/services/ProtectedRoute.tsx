import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
  requiredPermission?: string;
}

export default function ProtectedRoute({ requiredPermission }: ProtectedRouteProps) {
  const { token, hasPermission, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white font-black tracking-tight text-xl">
        🔄 Verificando credenciales...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/home" replace />; 
  }
  return <Outlet />;
}