"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useRole } from "../contexts/RoleContext"
import { ArrowLeft, TrendingUp, BarChart3, DollarSign, Star, CheckCircle } from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"

function ProfileSelection() {
  const [recommendations, setRecommendations] = useState([])
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { userId } = useRole()
  const navigate = useNavigate()

  const profiles = [
    {
      id: "GestiondePortefeuilleBoursier",
      name: "Gestion de Portefeuille Boursier",
      description: "Maîtrisez l'art de la gestion de portefeuille et des investissements boursiers",
      icon: TrendingUp,
      color: "blue",
      skills: ["Analyse financière", "Diversification", "Gestion des risques", "Stratégies d'investissement"],
      duration: "8-10 semaines",
      difficulty: "Avancé",
    },
    {
      id: "LecturedesIndicateursTechniques",
      name: "Lecture des Indicateurs Techniques",
      description: "Apprenez à analyser les marchés financiers grâce aux indicateurs techniques",
      icon: BarChart3,
      color: "purple",
      skills: ["Analyse technique", "Graphiques financiers", "Indicateurs de momentum", "Patterns de trading"],
      duration: "6-8 semaines",
      difficulty: "Intermédiaire",
    },
    {
      id: "SimulationdeLevéedeFonds",
      name: "Simulation de Levée de Fonds",
      description: "Découvrez les mécanismes de financement et de levée de fonds pour entreprises",
      icon: DollarSign,
      color: "green",
      skills: ["Business plan", "Valorisation", "Négociation", "Financement bancaire"],
      duration: "6-8 semaines",
      difficulty: "Intermédiaire",
    },
  ]

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const response = await fetch(`http://localhost:8000/api/profiles/recommendations/${userId}`)
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      } catch (err) {
        console.error("Erreur lors du chargement des recommandations", err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchRecommendations()
    }
  }, [userId])

  const handleProfileSelect = async () => {
    if (!selectedProfile) return

    setSubmitting(true)
    try {
      const response = await fetch("http://localhost:8000/api/profiles/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          profile_type: selectedProfile,
          performance_score: 75, // This would come from actual user performance
        }),
      })

      if (response.ok) {
        navigate("/dashboard")
      } else {
        throw new Error("Erreur lors de la sélection du profil")
      }
    } catch (err) {
      console.error("Erreur:", err)
      alert("Erreur lors de la sélection du profil")
    } finally {
      setSubmitting(false)
    }
  }

  const getRecommendationForProfile = (profileId) => {
    return recommendations.find((rec) => rec.profile === profileId)
  }

  const getColorClasses = (color) => {
    const colors = {
      blue: "border-blue-200 bg-blue-50 text-blue-900",
      purple: "border-purple-200 bg-purple-50 text-purple-900",
      green: "border-green-200 bg-green-50 text-green-900",
    }
    return colors[color] || colors.blue
  }

  const getIconColor = (color) => {
    const colors = {
      blue: "text-blue-600",
      purple: "text-purple-600",
      green: "text-green-600",
    }
    return colors[color] || colors.blue
  }

  if (loading) {
    return <LoadingSpinner size="xl" className="min-h-96" />
  }

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

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Choisissez votre profil de spécialisation</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Félicitations pour avoir terminé les concepts fondamentaux ! Sélectionnez maintenant votre parcours de
          spécialisation basé sur vos intérêts et performances.
        </p>
      </div>

      {/* Recommendations Banner */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex items-center mb-2">
            <Star className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="font-semibold text-yellow-900">Recommandations personnalisées</h3>
          </div>
          <p className="text-yellow-800 text-sm">
            Basées sur vos performances, nous recommandons particulièrement :{" "}
            <strong>{recommendations[0]?.profile.replace(/([A-Z])/g, " $1").trim()}</strong>
          </p>
        </div>
      )}

      {/* Profile Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => {
          const recommendation = getRecommendationForProfile(profile.id)
          const IconComponent = profile.icon
          const isRecommended = !!recommendation
          const isSelected = selectedProfile === profile.id

          return (
            <div
              key={profile.id}
              className={`relative bg-white rounded-xl border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected ? `${getColorClasses(profile.color)} border-2` : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedProfile(profile.id)}
            >
              {/* Recommendation Badge */}
              {isRecommended && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  Recommandé
                </div>
              )}

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              )}

              <div className="mb-4">
                <IconComponent className={`h-12 w-12 ${getIconColor(profile.color)} mb-3`} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{profile.name}</h3>
                <p className="text-gray-600 text-sm">{profile.description}</p>
              </div>

              {/* Recommendation Score */}
              {recommendation && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-yellow-800">Score de compatibilité</span>
                    <span className="text-lg font-bold text-yellow-900">{recommendation.match_score}%</span>
                  </div>
                  <p className="text-xs text-yellow-700">{recommendation.reason}</p>
                </div>
              )}

              {/* Profile Details */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Durée:</span>
                  <span className="font-medium">{profile.duration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Niveau:</span>
                  <span className="font-medium">{profile.difficulty}</span>
                </div>

                <div>
                  <span className="text-sm text-gray-500 block mb-2">Compétences développées:</span>
                  <div className="flex flex-wrap gap-1">
                    {profile.skills.map((skill, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selection Button */}
      <div className="text-center pt-6">
        <button
          onClick={handleProfileSelect}
          disabled={!selectedProfile || submitting}
          className={`px-8 py-3 rounded-lg font-medium transition-colors ${
            selectedProfile && !submitting
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {submitting ? "Sélection en cours..." : "Confirmer ma sélection"}
        </button>
      </div>
    </div>
  )
}

export default ProfileSelection
