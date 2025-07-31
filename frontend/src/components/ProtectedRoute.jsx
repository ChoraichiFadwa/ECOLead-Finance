import { Navigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';

export default function ProtectedRoute({ allowedRole, children }) {
  const { role } = useRole();

  if (!role || role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
