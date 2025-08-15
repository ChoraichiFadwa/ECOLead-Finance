import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api' 
import { useRole } from "../contexts/RoleContext" 
import { ArrowLeft } from "lucide-react"

function ConceptLibrary() {
  const [conceptProgress, setConceptProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const { userId, profile} = useRole()
  const navigate = useNavigate()
 
  useEffect(() => {
    async function fetchConceptsWithProgress() {
      try {
        const res = await api.getStudentConceptProgress(userId)
        // filtering based on profiles
        const filteredConcepts = res.filter(concept => {
          const conceptProfiles = concept.profiles || []  // e.g., [1, 3]
          return conceptProfiles.includes(profile)       // e.g., does [1,3] include 1? → true
        })
        setConceptProgress(filteredConcepts)
      } catch (err) {
        console.error('Erreur lors du chargement des concepts', err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchConceptsWithProgress()
    }
  }, [])

  const getActionLabel = (summary) => {
    if (summary.missions_completed === 0) return 'Commencer'
    if (!summary.is_completed) return 'Continuer'
    return 'Réviser'
  }
  const handleBackToDashboard = () => {
    navigate("/dashboard")
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Chargement de la bibliothèque…</div>
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
              <div className="flex items-center mb-6">
        <button
          onClick={handleBackToDashboard}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Retour</span>
        </button>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Bibliothèque de concepts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {conceptProgress.map(concept => (
          <div key={concept.concept} className="bg-white shadow rounded-xl p-5 border border-gray-200">
            <h2 className="text-lg font-semibold mb-2">{concept.concept}</h2>
            <p className="text-sm text-gray-600 mb-2">
              Progression : {concept.missions_completed} / {concept.total_missions}
            </p>
            <div className="w-full h-2 bg-gray-200 rounded mb-4">
              <div
                className="h-2 bg-blue-500 rounded"
                style={{
                  width: `${(concept.missions_completed / concept.total_missions) * 100}%`,
                }}
              ></div>
            </div>
            <button
              className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
              onClick={() => navigate(`/concept/${encodeURIComponent(concept.concept)}`)}
            >
              {getActionLabel(concept)}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ConceptLibrary
