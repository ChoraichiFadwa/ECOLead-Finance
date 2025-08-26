import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useRole } from "../contexts/RoleContext"
import { api } from "../utils/api"
import { ArrowLeft, Clock, Target, AlertCircle, CheckCircle, TrendingUp, TrendingDown, Info } from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"
import EventContextCard from "../components/EventContextCard"

const MissionPage = () => {
  const { missionId } = useParams()
  const { userId } = useRole()
  const navigate = useNavigate()

  const [mission, setMission] = useState(null)
  const [openEventId, setOpenEventId] = useState(null)
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState("")
  const [startTime] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchMission = async () => {
      try {
        setLoading(true)
        const missionData = await api.getMissionById(missionId)
        setMission(missionData)
        

      } catch (err) {
        setError(err.message || "Failed to load mission")
      } finally {
        setLoading(false)
      }
    }

    if (userId && missionId) {
      fetchMission()
    }
  }, [userId, missionId])

  const handleSubmit = async () => {
    if (!selectedChoice) {
      setError("Veuillez sélectionner une option avant de valider.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      const submissionData = {
        mission_id: missionId,
        choices: { main: selectedChoice },
        time_spent_seconds: timeSpent,
      }

      const resultData = await api.submitMission(userId, missionId, submissionData)
      setResult(resultData)
    } catch (err) {
      setError(err.message || "Failed to submit mission")
    } finally {
      setSubmitting(false)
    }
  }

  const handleBackToDashboard = () => {
    navigate("/dashboard")
  }
  const handleBackToConcepts = () => {
  navigate("/concepts")
}


  if (loading) {
    return <LoadingSpinner size="xl" className="min-h-96" />
  }

  if (error && !mission) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <div className="text-red-600 mb-4">Erreur lors du chargement de la mission</div>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={handleBackToDashboard} className="btn-primary">
          Retour au tableau de bord
        </button>
      </div>
    )
  }

  if (result) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mission terminée !</h1>
          <p className="text-gray-600">Bravo ! Voici vos résultats.</p>
        </div>

        {/* Results Card */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Score and Feedback */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Résultats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="font-medium text-gray-900">Score obtenu</span>
                  <span className="text-2xl font-bold text-green-600">+{result.score_earned}</span>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Feedback</h4>
                  {/* <p className="text-gray-700 text-sm">{result.feedback}</p> */}
                  <p className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: result.feedback.replace(/\n/g, "<br/>") }} />

                </div>

                {result.level_up && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-1">🎉 Niveau supérieur !</h4>
                    <p className="text-yellow-700 text-sm">Félicitations ! Vous êtes passé(e) au niveau {result.new_level} !</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metrics Changes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact sur les indicateurs</h3>
              <div className="space-y-3">
                {Object.entries(result.metrics_changes || {}).map(([metric, change]) => (
                  <div key={metric} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700 capitalize">{metric}</span>
                    <div className="flex items-center space-x-2">
                      {change > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : change < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : null}
                      <span
                        className={`font-bold ${
                          change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600"
                        }`}
                      >
                        {change > 0 ? "+" : ""}
                        {change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Current Metrics */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Indicateurs mis à jour</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(result.new_metrics || {}).map(([metric, value]) => (
              <div key={metric} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-600 capitalize">{metric}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="text-center">
          <button onClick={handleBackToConcepts} className="btn-primary">
            Retour à la bibliothèque
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={handleBackToConcepts}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Retour</span>
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{mission?.concept}</h1>
          <p className="text-gray-600 capitalize">Niveau: {mission?.niveau}</p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>Début {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Target className="h-4 w-4" />
            <span className="capitalize">{mission?.niveau}</span>
          </div>
        </div>
      </div>

      {/* Mission Context */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Contexte de la mission</h2>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-800">{mission?.contexte}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Objectif pédagogique</h3>
            <p className="text-gray-700">{mission?.objectif_pedagogique}</p>
          </div>

{mission?.evenements_actifs && mission.evenements_actifs.length > 0 && (
  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <h4 className="font-medium text-yellow-800 mb-3">⚡ Événements actifs</h4>

    {/* Show 2 cards by default; reveal the rest on click */}
    {(() => {
      const events = mission.evenements_actifs
      const visible = showAllEvents ? events : events.slice(0, 2)

      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visible.map((event, index) => {
              const evKey = event.id ?? index
              const isOpen = openEventId === evKey

              return (
                <div
                  key={evKey}
                  className="bg-white border border-yellow-200 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 text-yellow-700" aria-hidden="true" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {event.title || "Événement"}
                        </div>
                        <p className="text-sm text-yellow-800 mt-0.5">
                          {event.message}
                        </p>

                        {/* Optional badge if you have type/tags */}
                        {event?.context?.type && (
                          <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                            {event.context.type}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setOpenEventId(evKey)}
                      className="inline-flex items-center justify-center
                                 text-base md:text-sm font-medium
                                 px-4 py-2 rounded-lg border-2
                                 bg-white text-yellow-900 hover:bg-yellow-100
                                 shadow-sm"
                    >
                      Détails
                    </button>
                  </div>

                  {/* Modal/drawer for details */}
                  <EventContextCard
                    event={event}
                    open={isOpen}
                    onClose={() => setOpenEventId(null)}
                  />
                </div>
              )
            })}
          </div>

          {/* Show more / less toggle if many events */}
          {events.length > 2 && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setShowAllEvents(s => !s)}
                className="text-sm px-3 py-1 rounded-md border bg-white text-yellow-900 hover:bg-yellow-100"
              >
                {showAllEvents ? "Afficher moins" : `Afficher ${events.length - 2} autre(s)`}
              </button>
            </div>
          )}
        </>
      )
    })()}
  </div>
)}



          {mission?.tags && (
            <div className="flex flex-wrap gap-2">
              {mission.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Choices */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Choisissez votre stratégie</h2>
        <div className="space-y-4">
          {mission?.choix &&
            Object.entries(mission.choix).map(([key, choice]) => (
              <div
                key={key}
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedChoice === key
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedChoice(key)}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${
                      selectedChoice === key
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-gray-300 text-gray-500"
                    }`}
                  >
                    {key}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium mb-2">{choice.description}</p>

                    {choice.impact && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Impact attendu :</p>
                        <div className="flex flex-wrap gap-3">
                          {Object.entries(choice.impact).map(([metric, value]) => (
                            <span
                              key={metric}
                              className={`px-2 py-1 text-xs rounded-full ${
                                value > 0
                                  ? "bg-green-100 text-green-800"
                                  : value < 0
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {metric}: {value > 0 ? "+" : ""}
                              {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Error Display */}
      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {/* Submit Button */}
      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={!selectedChoice || submitting}
          className={`btn-primary px-8 py-3 text-lg ${
            !selectedChoice || submitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {submitting ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>Envoi en cours...</span>
            </div>
          ) : (
            "Valider la mission"
          )}
        </button>
      </div>
    </div>
  )
}

export default MissionPage
