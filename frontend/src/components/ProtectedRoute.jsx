import { Navigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';

export default function ProtectedRoute({ allowedRole, children }) {
  const { role, loading } = useRole();

  if (loading) return null; // we wait that the role loads from local storage so we can assign it 

  if (!role || role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
