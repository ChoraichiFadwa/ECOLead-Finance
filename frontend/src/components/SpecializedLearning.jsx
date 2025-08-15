"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useRole } from "../contexts/RoleContext"
import { TrendingUp, BarChart3, DollarSign, Star, CheckCircle, Lock, Play } from "lucide-react"
import LoadingSpinner from "./LoadingSpinner"

function SpecializedLearning() {
  const [specializedContent, setSpecializedContent] = useState(null)
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
    async function fetchSpecializedContent() {
      try {
        const response = await fetch(`http://localhost:8000/api/learning-flow/${userId}/specialized-content`)
        const data = await response.json()
        setSpecializedContent(data)
      } catch (err) {
        console.error("Erreur lors du chargement du contenu spécialisé", err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchSpecializedContent()
    }
  }, [userId])

  const handleConceptClick = (conceptId) => {
    navigate(`/concept/${conceptId}`)
  }

  const getColorClasses = (color) => {
    const colors = {
      blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-900",
      purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-900",
      green: "from-green-50 to-green-100 border-green-200 text-green-900",
    }
    return colors[color] || colors.blue
  }

  const getButtonColor = (color) => {
    const colors = {
      blue: "bg-blue-600 hover:bg-blue-700",
      purple: "bg-purple-600 hover:bg-purple-700",
      green: "bg-green-600 hover:bg-green-700",
    }
    return colors[color] || colors.blue
  }

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  if (!specializedContent) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">Aucun profil spécialisé sélectionné</div>
        <button
          onClick={() => navigate("/profile-selection")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Choisir un profil
        </button>
      </div>
    )
  }

  const profileName = specializedContent.profile_type?.replace(/([A-Z])/g, " $1").trim()
  const IconComponent = profileIcons[specializedContent.profile_type] || Star
  const color = profileColors[specializedContent.profile_type] || "blue"
  const progressPercentage =
    specializedContent.total_concepts > 0
      ? (specializedContent.completed_concepts / specializedContent.total_concepts) * 100
      : 0

  // Group concepts by difficulty level
  const conceptsByDifficulty = specializedContent.content.reduce((acc, concept) => {
    const level = concept.difficulty_level || "beginner"
    if (!acc[level]) acc[level] = []
    acc[level].push(concept)
    return acc
  }, {})

  const difficultyOrder = ["beginner", "intermediate", "advanced"]
  const difficultyLabels = {
    beginner: "Débutant",
    intermediate: "Intermédiaire",
    advanced: "Avancé",
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className={`bg-gradient-to-r ${getColorClasses(color)} border rounded-lg p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <IconComponent className="h-12 w-12 mr-4" />
            <div>
              <h2 className="text-2xl font-bold">{profileName}</h2>
              <p className="mt-1 opacity-80">Votre parcours de spécialisation</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {specializedContent.completed_concepts}/{specializedContent.total_concepts}
            </div>
            <div className="text-sm opacity-80">Concepts terminés</div>
          </div>
        </div>

        <div className="w-full bg-white bg-opacity-30 rounded-full h-3 mb-4">
          <div
            className="bg-white bg-opacity-80 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        <div className="text-sm opacity-80">{Math.round(progressPercentage)}% de votre spécialisation terminée</div>
      </div>

      {/* Concepts by Difficulty */}
      {difficultyOrder.map((difficulty) => {
        const concepts = conceptsByDifficulty[difficulty] || []
        if (concepts.length === 0) return null

        return (
          <div key={difficulty} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Niveau {difficultyLabels[difficulty]}</h3>
              <div className="text-sm text-gray-500">
                {concepts.filter((c) => c.completed).length}/{concepts.length} terminés
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {concepts.map((concept) => (
                <div
                  key={concept.id}
                  className={`bg-white border rounded-lg p-5 transition-all duration-200 ${
                    concept.completed
                      ? "border-green-200 bg-green-50"
                      : concept.prerequisites_met
                        ? "border-gray-200 hover:shadow-md hover:border-gray-300 cursor-pointer"
                        : "border-gray-100 bg-gray-50"
                  }`}
                  onClick={() => concept.prerequisites_met && handleConceptClick(concept.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">{concept.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{concept.description}</p>

                      {concept.score > 0 && (
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span>Score: {concept.score}%</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 ml-3">
                      {concept.completed ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : concept.prerequisites_met ? (
                        <Play className="h-6 w-6 text-blue-600" />
                      ) : (
                        <Lock className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (concept.prerequisites_met) {
                        handleConceptClick(concept.id)
                      }
                    }}
                    disabled={!concept.prerequisites_met}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      concept.completed
                        ? "bg-green-100 text-green-800 cursor-default"
                        : concept.prerequisites_met
                          ? `${getButtonColor(color)} text-white`
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {concept.completed ? "Terminé" : concept.prerequisites_met ? "Commencer" : "Verrouillé"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Completion Achievement */}
      {progressPercentage === 100 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Star className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-yellow-900 mb-2">Spécialisation terminée !</h3>
          <p className="text-yellow-800 mb-4">
            Félicitations ! Vous avez maîtrisé votre spécialisation en {profileName}. Vous êtes maintenant un expert
            dans ce domaine.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
          >
            Retour au tableau de bord
          </button>
        </div>
      )}
    </div>
  )
}

export default SpecializedLearning
