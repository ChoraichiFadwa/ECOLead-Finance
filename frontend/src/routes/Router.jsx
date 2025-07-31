import { Routes, Route, useNavigate } from 'react-router-dom';
import Home from '../pages/Home';
import TeacherDashboard from '../pages/Dashboards/TeacherDashboard';
import StudentDashboard from '../pages/Dashboards/StudentDashboard';
import Login from '../pages/Login';
import ProtectedRoute from '../components/ProtectedRoute';

function Router () {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route path="/" element={<Home onGetStarted={() => navigate("/login")} />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard/student"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/teacher"
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
  }

export default Router;
