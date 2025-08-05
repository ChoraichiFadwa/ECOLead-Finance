import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "../utils/api"
import { groupBy } from "lodash"
import LoadingSpinner from "../components/LoadingSpinner"
import { Play, ArrowLeft } from "lucide-react"
import { useRole } from "../contexts/RoleContext"

const ConceptMissions = () => {
  const { conceptId } = useParams()
  const { userId } = useRole()
  const navigate = useNavigate()

  const [missions, setMissions] = useState([])
  const [missionStatus, setMissionStatus] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [missionsRes, statusRes] = await Promise.all([
          api.getMissionsByConcept(conceptId),
          api.getConceptProgress(userId, conceptId)
        ])
        setMissions(missionsRes)
        console.log("MISSIONS RECEIVED", missionsRes)
        setMissionStatus(statusRes.progress_by_level)
      } catch (err) {
        setError("Échec du chargement des missions ou de la progression pour ce concept.")
      } finally {
        setLoading(false)
      }
    }

    if (conceptId && userId) {
      fetchData()
    }
  }, [conceptId, userId])

  const handleStartMission = (missionId) => {
    navigate(`/mission/${missionId}`)
  }

  const handleBackToConcepts = () => {
    navigate('/concepts')
  }

  const groupedMissions = groupBy(missions, "niveau")
  const orderedLevels = ["débutant", "intermédiaire", "avancé"]

  const isLevelLocked = (levelIndex) => {
    for (let i = 0; i < levelIndex; i++) {
      const lvl = orderedLevels[i]
      if ((missionStatus[lvl] || []).some(m => !m.completed)) {
        return true
      }
    }
    return false
  }

  const isMissionCompleted = (level, missionId) => {
    return (missionStatus[level] || []).find(m => m.id === missionId)?.completed
  }

  if (loading) return <LoadingSpinner />
  if (error) return (
    <div className="text-center text-red-600 py-8">
      <p>{error}</p>
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center mb-6">
        <button
          onClick={handleBackToConcepts}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Retour</span>
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 capitalize">Concept: {conceptId}</h1>

      {orderedLevels.map((level, levelIdx) => {
        const levelMissions = groupedMissions[level] || []
        if (!levelMissions.length) return null

        const locked = isLevelLocked(levelIdx)

        return (
          <div key={level} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 capitalize">Niveau: {level}</h2>

            {levelMissions.map((mission) => {
              const completed = isMissionCompleted(level, mission.id)
              return (
                <div
                  key={mission.id}
                  className="card flex flex-col sm:flex-row justify-between items-center"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {mission.titre || mission.id}
                    </h3>
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Objectif:</strong> {mission.objectif_pedagogique}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {mission.tags?.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {completed ? (
                    <span className="text-green-600 font-semibold mt-4 sm:mt-0">✔ Terminée</span>
                    ) : (
                      <button
                      onClick={() => !locked && handleStartMission(mission.id)}
                      className={`mt-4 sm:mt-0 btn-primary ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={locked}
                      >
                        <Play className="h-4 w-4 inline-block mr-2" />
                        {locked ? "Verrouillée" : "Lancer"}
                        </button>
                        )}

                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export default ConceptMissions
