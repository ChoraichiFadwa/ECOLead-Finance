import { Routes, Route, useNavigate } from "react-router-dom"
import Home from "../pages/Home"
import TeacherDashboard from "../pages/Dashboards/TeacherDashboard"
import StudentDashboard from "../pages/Dashboards/StudentDashboard"
import Login from "../pages/Login"
import ProtectedRoute from "../components/ProtectedRoute"
import DomainLibrary from "../pages/DomainLibrary"
import ProfileSelection from "../pages/ProfileSelection"
import LearningFlow from "../pages/LearningFlow"
import ConceptLibrary from "../pages/ConceptLibrary"
import ConceptMissions from "../pages/ConceptMissions"
import MissionPage from "../pages/MissionPage"
import SpecializedPath from "../pages/SpecializedPath" // Added SpecializedPath import

function Router() {
  const navigate = useNavigate()
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
        path="/dashboard"
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
      <Route
        path="/domains"
        element={
          <ProtectedRoute allowedRole="student">
            <DomainLibrary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile-selection"
        element={
          <ProtectedRoute allowedRole="student">
            <ProfileSelection />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learning-flow"
        element={
          <ProtectedRoute allowedRole="student">
            <LearningFlow />
          </ProtectedRoute>
        }
      />
      <Route
        path="/specialized-path"
        element={
          <ProtectedRoute allowedRole="student">
            <SpecializedPath />
          </ProtectedRoute>
        }
      />
      <Route
        path="/concepts"
        element={
          <ProtectedRoute allowedRole="student">
            <ConceptLibrary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/concept/:conceptName"
        element={
          <ProtectedRoute allowedRole="student">
            <ConceptMissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mission/:missionId"
        element={
          <ProtectedRoute allowedRole="student">
            <MissionPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default Router
