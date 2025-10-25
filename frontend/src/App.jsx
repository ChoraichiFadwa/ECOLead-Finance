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
import ChooseProfile from "./pages/ChooseProfile"
import LearningDesignPage from "./pages/LearningDesignPage"
import StudentsPage from "./pages/StudentsPage"
import StudentStatusPage from "./pages/StudentStatusPage"

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
  path="/choose-profile"
  element={
    role === "student" ? (
      <Layout>
        <ChooseProfile />
      </Layout>
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
  path="/student/status"
  element={
    role === "student" ? (
      <Layout>
        <StudentStatusPage />
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
  path="/teacher/learning-design"
  element={
    role === "teacher" ? (
      <Layout>
        <LearningDesignPage />
      </Layout>
    ) : (
      <Navigate to="/dashboard" />
    )
  }
/>
      <Route
  path="/teacher/students"
  element={
    role === "teacher" ? (
      <Layout>
        <StudentsPage />
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
