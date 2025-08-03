import { useState } from "react"
import { useRole } from "../contexts/RoleContext"
import { api } from "../utils/api"
import { User, Users, BookOpen } from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"

const RoleSelection = () => {
  const { setRole } = useRole()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRoleSelect = async (selectedRole) => {
    setLoading(true)
    setError("")

    try {
      // Create a demo user
      const userData = {
        name: selectedRole === "student" ? "Demo Student" : "Demo Teacher",
        email: `demo-${selectedRole}@example.com`,
      }

      const user = selectedRole === "student" ? await api.createStudent(userData) : await api.createTeacher(userData)

      setRole(selectedRole, user.id)
    } catch (err) {
      setError(err.message || "Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-lg text-gray-600">Setting up your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="h-12 w-12 text-primary-600" />
            <h1 className="text-4xl font-bold text-gradient">ECOLeadGame</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome to the gamified educational platform. Choose your role to get started with an immersive learning
            experience.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">{error}</div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Student Card */}
          <div
            className="card hover:shadow-glow transition-all duration-300 cursor-pointer group"
            onClick={() => handleRoleSelect("student")}
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                <User className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Student</h3>
              <p className="text-gray-600 mb-6">
                Embark on an interactive learning journey through missions and challenges. Track your progress and
                master new concepts.
              </p>

              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Complete interactive missions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Track your learning progress</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Unlock new levels and concepts</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">View detailed analytics</span>
                </div>
              </div>

              <button className="btn-primary w-full mt-6 group-hover:bg-primary-800">Start Learning</button>
            </div>
          </div>

          {/* Teacher Card */}
          <div
            className="card hover:shadow-glow transition-all duration-300 cursor-pointer group"
            onClick={() => handleRoleSelect("teacher")}
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-success-200 transition-colors">
                <Users className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Teacher</h3>
              <p className="text-gray-600 mb-6">
                Monitor student progress, analyze performance metrics, and gain insights into learning patterns and
                engagement.
              </p>

              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Monitor student progress</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">View detailed analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Track engagement metrics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Generate performance reports</span>
                </div>
              </div>

              <button className="btn-success w-full mt-6 group-hover:bg-success-800">Access Dashboard</button>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            This is a demo environment. Your progress will be saved locally for testing purposes.
          </p>
        </div>
      </div>
    </div>
  )
}

export default RoleSelection
