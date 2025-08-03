import { Routes, Route, Navigate } from "react-router-dom"
import { useRole } from "./contexts/RoleContext"
import Layout from "./components/Layout"
import RoleSelection from "./pages/RoleSelection"
import StudentDashboard from "./pages/StudentDashboard"
import TeacherDashboard from "./pages/TeacherDashboard"
import MissionPage from "./pages/MissionPage"
import LoadingSpinner from "./components/LoadingSpinner"

function App() {
  const { role, loading } = useRole()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      <Route path="/" element={!role ? <RoleSelection /> : <Navigate to="/dashboard" />} />
      <Route
        path="/dashboard"
        element={
          role ? (
            <Layout>{role === "student" ? <StudentDashboard /> : <TeacherDashboard />}</Layout>
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/mission/:missionId"
        element={
          role === "student" ? (
            <Layout>
              <MissionPage />
            </Layout>
          ) : (
            <Navigate to="/dashboard" />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
