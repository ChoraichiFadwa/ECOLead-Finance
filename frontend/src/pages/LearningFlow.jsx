import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useRole } from "../contexts/RoleContext"
import { ArrowLeft } from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"
import FundamentalsProgress from "../components/FundamentalsProgress"
import SpecializedLearning from "../components/SpecializedLearning"

function LearningFlow() {
  const [learningStage, setLearningStage] = useState(null)
  const [loading, setLoading] = useState(true)
  const { userId } = useRole()
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchLearningStage() {
      try {
        const response = await fetch(`http://localhost:8000/api/learning-flow/${userId}/stage`)
        const data = await response.json()
        setLearningStage(data)
      } catch (err) {
        console.error("Erreur lors du chargement de l'étape d'apprentissage", err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchLearningStage()
    }
  }, [userId])

  const handleBackToDashboard = () => {
    navigate("/dashboard")
  }

  if (loading) {
    return <LoadingSpinner size="xl" className="min-h-96" />
  }

  if (!learningStage) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Erreur lors du chargement du parcours d'apprentissage</div>
        <button
          onClick={handleBackToDashboard}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retour au tableau de bord
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={handleBackToDashboard}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Retour au tableau de bord</span>
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Parcours d'apprentissage</h1>
        <p className="text-gray-600">
          {learningStage.stage === "fundamentals" &&
            "Maîtrisez les concepts fondamentaux pour débloquer les spécialisations"}
          {learningStage.stage === "profile_selection" && "Choisissez votre profil de spécialisation"}
          {learningStage.stage === "specialized" && "Continuez votre apprentissage spécialisé"}
        </p>
      </div>

      {/* Render appropriate component based on learning stage */}
      {learningStage.stage === "fundamentals" && <FundamentalsProgress />}

      {learningStage.stage === "profile_selection" && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prêt pour la spécialisation !</h2>
          <p className="text-gray-600 mb-6">
            Vous avez terminé tous les concepts fondamentaux. Il est temps de choisir votre profil de spécialisation.
          </p>
          <button
            onClick={() => navigate("/profile-selection")}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Choisir ma spécialisation
          </button>
        </div>
      )}

      {learningStage.stage === "specialized" && <SpecializedLearning />}
    </div>
  )
}

export default LearningFlow
