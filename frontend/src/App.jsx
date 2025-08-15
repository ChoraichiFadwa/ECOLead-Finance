import { Routes, Route, Navigate } from "react-router-dom"
import { useRole } from "./contexts/RoleContext"
import Layout from "./components/Layout"
import RoleSelection from "./pages/RoleSelection"
import StudentDashboard from "./pages/StudentDashboard"
import TeacherDashboard from "./pages/TeacherDashboard"
import ConceptLibrary from "./pages/ConceptLibrary";
import MissionPage from "./pages/MissionPage"
import LoadingSpinner from "./components/LoadingSpinner"
import ConceptMissions from "./pages/ConceptMissions"
import DomainLibrary from "./pages/DomainLibrary"
import ProfileSelection from "./pages/ProfileSelection"
import LearningFlow from "./pages/LearningFlow"
import SpecializedPath from "./pages/SpecializedPath"

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
      <Route
      path="/concepts"
      element={
        role === "student" ? (
      <Layout>
        <ConceptLibrary />
      </Layout>
      ) : (
        <Navigate to="/" />
      )
    }
    />
    <Route
    path="/concept/:conceptId"
    element={
      role === "student" ? (
        <Layout>
          <ConceptMissions />
          </Layout>
          ) : (
            <Navigate to="/dashboard" />
            )
          }
          />
     <Route
        path="/domains"
        element={
          role === "student" ? (
            <Layout>
              <DomainLibrary />
            </Layout>
          ) : (
            <Navigate to="/dashboard" />
          )
        }
      />

      <Route
        path="/profile-selection"
        element={
          role === "student" ? (
            <Layout>
              <ProfileSelection />
            </Layout>
          ) : (
            <Navigate to="/dashboard" />
          )
        }
      />

      <Route
        path="/learning-flow"
        element={
          role === "student" ? (
            <Layout>
              <LearningFlow />
            </Layout>
          ) : (
            <Navigate to="/dashboard" />
          )
        }
      />

      <Route
        path="/specialized-path"
        element={
          role === "student" ? (
            <Layout>
              <SpecializedPath />
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
