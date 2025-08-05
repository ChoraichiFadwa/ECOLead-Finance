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
      setError(err.message || "Échec de la création de l'utilisateur")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-lg text-gray-600">Configuration de votre compte...</p>
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
            Bienvenue sur la plateforme éducative gamifiée. Choisissez votre rôle pour commencer une expérience d'apprentissage immersive.
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
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Étudiant</h3>
              <p className="text-gray-600 mb-6">
                Lancez-vous dans un parcours d'apprentissage interactif à travers des missions et des défis. Suivez votre progression.
              </p>

              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Réalisez des missions interactives</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Suivez votre progression d'apprentissage</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Débloquez de nouveaux niveaux et concepts</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Consultez des analyses détaillées</span>
                </div>
              </div>

              <button className="btn-primary w-full mt-6 group-hover:bg-primary-800">Commencer l'apprentissage</button>
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
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Professeur</h3>
              <p className="text-gray-600 mb-6">
                Surveillez la progression des étudiants, analysez les indicateurs de performance et obtenez des informations sur les habitudes d'apprentissage et l'engagement.
              </p>

              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Surveillez la progression des étudiants</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Analysez les indicateurs de performance</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Suivez les indicateurs d'engagement</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Générez des rapports de performance</span>
                </div>
              </div>

              <button className="btn-success w-full mt-6 group-hover:bg-success-800">Accéder au tableau de bord</button>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Progress will be saved locally for testing purposes.
          </p>
        </div>
      </div>
    </div>
  )
}

export default RoleSelection
