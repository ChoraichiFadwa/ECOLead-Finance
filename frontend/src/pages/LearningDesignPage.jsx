// src/pages/LearningDesignPage.jsx
import { useState, useEffect } from "react"
import { useRole } from "../contexts/RoleContext"
import { api } from "../utils/api"
import ConceptForm from "../components/ConceptCreationForm"
import MissionForm from "../components/MissionCreationForm"
import { Link } from "react-router-dom" // 👈 for back navigation

const LearningDesignPage = () => {
  const { userId } = useRole()
  const [concepts, setConcepts] = useState([])
  const [missions, setMissions] = useState([])
  const [showConceptForm, setShowConceptForm] = useState(false)
  const [showMissionForm, setShowMissionForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [conceptsRes, missionsRes] = await Promise.all([
          api.getConcepts(userId),
          api.getMissions(userId),
        ])
        setConcepts(conceptsRes)
        setMissions(missionsRes)
      } catch (err) {
        console.error("Failed to load learning content", err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) fetchData()
  }, [userId])

  // 💡 Note: You may need to add getConcepts/getMissions to your API util
  // For now, this assumes they exist. If not, you can skip lists and just show forms.

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conception pédagogique</h1>
          <p className="text-gray-600 mt-1">Créez des concepts et des missions pour votre classe</p>
        </div>
        <Link
          to="/teacher/dashboard"
          className="px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition"
        >
          ← Retour au tableau de bord
        </Link>
      </div>

      {/* Concepts Section */}
      <section className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Concepts</h2>
          <button
            onClick={() => setShowConceptForm(!showConceptForm)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            {showConceptForm ? "Annuler" : "+ Ajouter un concept"}
          </button>
        </div>

        {showConceptForm && (
          <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <ConceptForm teacherId={userId} />
          </div>
        )}

        {/* Optional: List of existing concepts */}
        {concepts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {concepts.map((concept) => (
              <div key={concept.id} className="p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900">{concept.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{concept.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Missions Section */}
      <section className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Missions</h2>
          <button
            onClick={() => setShowMissionForm(!showMissionForm)}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            {showMissionForm ? "Annuler" : "+ Créer une mission"}
          </button>
        </div>

        {showMissionForm && (
          <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <MissionForm teacherId={userId} />
          </div>
        )}

        {/* Optional: List of existing missions */}
        {missions.length > 0 && (
          <div className="space-y-3">
            {missions.map((mission) => (
              <div key={mission.id} className="p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900">{mission.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default LearningDesignPage