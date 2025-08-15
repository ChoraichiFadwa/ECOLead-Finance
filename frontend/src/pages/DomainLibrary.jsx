"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useRole } from "../contexts/RoleContext"
import { ArrowLeft, BookOpen, Trophy, Clock, Star } from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"

function DomainLibrary() {
  const [domains, setDomains] = useState([])
  const [userStage, setUserStage] = useState(null)
  const [loading, setLoading] = useState(true)
  const { userId } = useRole()
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchData() {
      try {
        const [domainsData, stageData] = await Promise.all([
          fetch(`http://localhost:8000/api/domains/`).then((res) => res.json()),
          fetch(`http://localhost:8000/api/learning-flow/${userId}/stage`).then((res) => res.json()),
        ])
        setDomains(domainsData)
        setUserStage(stageData)
      } catch (err) {
        console.error("Erreur lors du chargement des domaines", err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchData()
    }
  }, [userId])

  const handleBackToDashboard = () => {
    navigate("/dashboard")
  }

  const handleDomainClick = (domain) => {
    if (userStage?.stage === "fundamentals") {
      // Show only fundamental concepts
      navigate(`/domain/${domain.id}/fundamentals`)
    } else if (userStage?.stage === "specialized") {
      // Show specialized content based on profile
      navigate(`/domain/${domain.id}/specialized`)
    } else {
      // General domain view
      navigate(`/domain/${domain.id}`)
    }
  }

  const getDomainStatus = (domain) => {
    // This would be calculated based on user progress
    return {
      fundamentalsCompleted: Math.floor(Math.random() * 100),
      specializedCompleted: Math.floor(Math.random() * 100),
      totalConcepts: domain.concepts?.length || 0,
    }
  }

  if (loading) {
    return <LoadingSpinner size="xl" className="min-h-96" />
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Domaines d'apprentissage</h1>
        <p className="text-gray-600">
          {userStage?.stage === "fundamentals" &&
            "Complétez les concepts fondamentaux pour débloquer les profils spécialisés"}
          {userStage?.stage === "profile_selection" && "Choisissez votre profil de spécialisation"}
          {userStage?.stage === "specialized" && "Continuez votre apprentissage spécialisé"}
        </p>
      </div>

      {/* Learning Stage Indicator */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">
              {userStage?.stage === "fundamentals" && "Phase: Concepts Fondamentaux"}
              {userStage?.stage === "profile_selection" && "Phase: Sélection de Profil"}
              {userStage?.stage === "specialized" && "Phase: Apprentissage Spécialisé"}
            </h3>
            <p className="text-blue-700 text-sm mt-1">{userStage?.next_action}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900">{Math.round(userStage?.progress_percentage || 0)}%</div>
            <div className="text-blue-600 text-sm">Progression</div>
          </div>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2 mt-3">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${userStage?.progress_percentage || 0}%` }}
          ></div>
        </div>
      </div>

      {/* Profile Selection Button */}
      {userStage?.stage === "profile_selection" && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-900 mb-2">Félicitations!</h3>
            <p className="text-green-700 mb-4">
              Vous avez terminé les concepts fondamentaux. Choisissez maintenant votre profil de spécialisation.
            </p>
            <button
              onClick={() => navigate("/profile-selection")}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Choisir mon profil
            </button>
          </div>
        </div>
      )}

      {/* Domains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {domains.map((domain) => {
          const status = getDomainStatus(domain)
          return (
            <div
              key={domain.id}
              className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => handleDomainClick(domain)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{domain.name}</h2>
                  <p className="text-gray-600 text-sm mb-3">{domain.description}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500 flex-shrink-0 ml-3" />
              </div>

              {/* Progress Indicators */}
              <div className="space-y-3">
                {userStage?.stage === "fundamentals" && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Fondamentaux</span>
                      <span className="text-sm text-gray-500">{status.fundamentalsCompleted}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${status.fundamentalsCompleted}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {userStage?.stage === "specialized" && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Spécialisé</span>
                      <span className="text-sm text-gray-500">{status.specializedCompleted}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${status.specializedCompleted}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4" />
                    <span>{status.totalConcepts} concepts</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>~{Math.ceil(status.totalConcepts * 15)} min</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  {userStage?.stage === "fundamentals"
                    ? "Apprendre les bases"
                    : userStage?.stage === "specialized"
                      ? "Continuer la spécialisation"
                      : "Explorer le domaine"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DomainLibrary
