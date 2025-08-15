"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useRole } from "../contexts/RoleContext"
import { CheckCircle, Clock, BookOpen, ArrowRight } from "lucide-react"
import LoadingSpinner from "./LoadingSpinner"

function FundamentalsProgress() {
  const [fundamentalsData, setFundamentalsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { userId } = useRole()
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchFundamentalsProgress() {
      try {
        const response = await fetch(`http://localhost:8000/api/learning-flow/${userId}/fundamentals`)
        const data = await response.json()
        setFundamentalsData(data)
      } catch (err) {
        console.error("Erreur lors du chargement des fondamentaux", err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchFundamentalsProgress()
    }
  }, [userId])

  const handleConceptClick = (conceptId) => {
    navigate(`/concept/${conceptId}`)
  }

  const handleCompleteFundamentals = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/learning-flow/${userId}/complete-fundamentals`, {
        method: "POST",
      })

      if (response.ok) {
        navigate("/profile-selection")
      } else {
        alert("Vous devez terminer tous les concepts fondamentaux avant de continuer.")
      }
    } catch (err) {
      console.error("Erreur lors de la finalisation des fondamentaux", err)
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  if (!fundamentalsData) {
    return <div className="text-center text-gray-600">Aucune donnée disponible</div>
  }

  const canComplete = fundamentalsData.completed_concepts === fundamentalsData.total_concepts

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-900">Concepts Fondamentaux</h2>
            <p className="text-blue-700 mt-1">Maîtrisez les bases avant de choisir votre spécialisation</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-900">
              {fundamentalsData.completed_concepts}/{fundamentalsData.total_concepts}
            </div>
            <div className="text-blue-600 text-sm">Concepts terminés</div>
          </div>
        </div>

        <div className="w-full bg-blue-200 rounded-full h-3 mb-4">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${fundamentalsData.progress_percentage}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-700">{Math.round(fundamentalsData.progress_percentage)}% terminé</span>
          {canComplete && (
            <button
              onClick={handleCompleteFundamentals}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
            >
              <span>Terminer les fondamentaux</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Current Concept */}
      {fundamentalsData.current_concept && (
        <div className="bg-white border-2 border-yellow-300 rounded-lg p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-800">Concept actuel</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{fundamentalsData.current_concept.title}</h3>
              <p className="text-gray-600 mb-3">{fundamentalsData.current_concept.description}</p>
              <div className="flex items-center text-sm text-gray-500">
                <BookOpen className="h-4 w-4 mr-1" />
                <span>Domaine: {fundamentalsData.current_concept.domain}</span>
              </div>
            </div>
            <button
              onClick={() => handleConceptClick(fundamentalsData.current_concept.id)}
              className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium ml-4"
            >
              Commencer
            </button>
          </div>
        </div>
      )}

      {/* Next Concepts */}
      {fundamentalsData.next_concepts && fundamentalsData.next_concepts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Prochains concepts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fundamentalsData.next_concepts.map((concept) => (
              <div
                key={concept.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{concept.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{concept.description}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <BookOpen className="h-3 w-3 mr-1" />
                      <span>{concept.domain}</span>
                    </div>
                  </div>
                  {concept.completed && <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />}
                </div>

                <button
                  onClick={() => handleConceptClick(concept.id)}
                  disabled={concept.completed}
                  className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                    concept.completed
                      ? "bg-green-100 text-green-800 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {concept.completed ? "Terminé" : "À venir"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Message */}
      {canComplete && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-900 mb-2">Félicitations ! Fondamentaux terminés</h3>
          <p className="text-green-700 mb-4">
            Vous avez maîtrisé tous les concepts fondamentaux. Vous pouvez maintenant choisir votre profil de
            spécialisation.
          </p>
          <button
            onClick={handleCompleteFundamentals}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Choisir ma spécialisation
          </button>
        </div>
      )}
    </div>
  )
}

export default FundamentalsProgress
