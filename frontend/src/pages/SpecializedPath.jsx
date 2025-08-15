"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useRole } from "../contexts/RoleContext"
import {
  ArrowLeft,
  TrendingUp,
  BarChart3,
  DollarSign,
  Clock,
  Target,
  CheckCircle,
  Play,
  Star,
  BookOpen,
} from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"

function SpecializedPath() {
  const [pathData, setPathData] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const { userId } = useRole()
  const navigate = useNavigate()

  const profileIcons = {
    GestiondePortefeuilleBoursier: TrendingUp,
    LecturedesIndicateursTechniques: BarChart3,
    SimulationdeLevéedeFonds: DollarSign,
  }

  const profileColors = {
    GestiondePortefeuilleBoursier: "blue",
    LecturedesIndicateursTechniques: "purple",
    SimulationdeLevéedeFonds: "green",
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [pathResponse, recommendationsResponse] = await Promise.all([
          fetch(`http://localhost:8000/api/specialized-paths/${userId}/overview`),
          fetch(`http://localhost:8000/api/specialized-paths/${userId}/recommendations`),
        ])

        const pathData = await pathResponse.json()
        const recommendationsData = await recommendationsResponse.json()

        setPathData(pathData)
        setRecommendations(recommendationsData.recommendations || [])
      } catch (err) {
        console.error("Erreur lors du chargement du parcours spécialisé", err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchData()
    }
  }, [userId])

  const handleConceptClick = (conceptId) => {
    navigate(`/specialized-concept/${conceptId}`)
  }

  const getColorClasses = (color) => {
    const colors = {
      blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-900",
      purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-900",
      green: "from-green-50 to-green-100 border-green-200 text-green-900",
    }
    return colors[color] || colors.blue
  }

  const getPhaseColor = (completed, total) => {
    const percentage = (completed / total) * 100
    if (percentage === 100) return "bg-green-500"
    if (percentage > 50) return "bg-yellow-500"
    return "bg-blue-500"
  }

  if (loading) {
    return <LoadingSpinner size="xl" className="min-h-96" />
  }

  if (!pathData) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">Aucun parcours spécialisé trouvé</div>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retour au tableau de bord
        </button>
      </div>
    )
  }

  const IconComponent = profileIcons[pathData.profile_type] || Star
  const color = profileColors[pathData.profile_type] || "blue"

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Retour au tableau de bord</span>
        </button>
      </div>

      {/* Profile Header */}
      <div className={`bg-gradient-to-r ${getColorClasses(color)} border rounded-lg p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <IconComponent className="h-16 w-16 mr-6" />
            <div>
              <h1 className="text-3xl font-bold">{pathData.profile_name}</h1>
              <p className="mt-2 opacity-90">Votre parcours de spécialisation personnalisé</p>
              <div className="mt-3 flex items-center space-x-4 text-sm opacity-80">
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-1" />
                  <span>Phase actuelle: {pathData.current_phase}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Progression: {Math.round(pathData.progress_percentage)}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">
              {pathData.completed_concepts}/{pathData.total_concepts}
            </div>
            <div className="text-sm opacity-80">Concepts maîtrisés</div>
          </div>
        </div>

        <div className="w-full bg-white bg-opacity-30 rounded-full h-4">
          <div
            className="bg-white bg-opacity-90 h-4 rounded-full transition-all duration-500"
            style={{ width: `${pathData.progress_percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Next Milestone */}
      {pathData.next_milestone && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Prochain objectif</h3>
              <p className="text-yellow-800 mb-1">{pathData.next_milestone.phase_name}</p>
              <p className="text-yellow-700 text-sm">{pathData.next_milestone.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-900">{pathData.next_milestone.progress}</div>
              <div className="text-yellow-600 text-sm">{Math.round(pathData.next_milestone.percentage)}% terminé</div>
            </div>
          </div>
        </div>
      )}

      {/* Learning Phases */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Phases d'apprentissage</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pathData.learning_phases.map((phase, index) => {
            const isCompleted = phase.completed === phase.total
            const isActive = pathData.current_phase === phase.name
            const progressPercentage = (phase.completed / phase.total) * 100

            return (
              <div
                key={index}
                className={`bg-white border-2 rounded-lg p-6 transition-all duration-200 ${
                  isActive
                    ? "border-blue-300 shadow-lg"
                    : isCompleted
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{phase.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{phase.description}</p>
                  </div>
                  {isCompleted && <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />}
                  {isActive && <Play className="h-6 w-6 text-blue-600 flex-shrink-0" />}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Progression</span>
                    <span className="font-medium">
                      {phase.completed}/{phase.total}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPhaseColor(phase.completed, phase.total)}`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>

                  <div className="text-xs text-gray-500">{Math.round(progressPercentage)}% terminé</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Recommandations personnalisées</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleConceptClick(rec.concept_id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm text-blue-600 font-medium">{rec.domain}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{rec.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{rec.estimated_duration} min</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full ${
                          rec.priority === "high" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {rec.priority === "high" ? "Priorité haute" : "Recommandé"}
                      </span>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Commencer ce concept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Achievement */}
      {pathData.progress_percentage === 100 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-8 text-center">
          <Star className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-green-900 mb-3">Spécialisation terminée !</h3>
          <p className="text-green-800 mb-6 max-w-2xl mx-auto">
            Félicitations ! Vous avez maîtrisé votre spécialisation en {pathData.profile_name}. Vous êtes maintenant un
            expert dans ce domaine et pouvez appliquer vos connaissances dans des situations professionnelles réelles.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Retour au tableau de bord
            </button>
            <button
              onClick={() => navigate("/profile-selection")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Choisir une nouvelle spécialisation
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpecializedPath
