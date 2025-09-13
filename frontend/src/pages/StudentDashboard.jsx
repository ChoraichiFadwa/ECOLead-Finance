import React, { useState, useEffect} from "react"
import { useNavigate } from "react-router-dom"
import { useRole } from "../contexts/RoleContext"
import { api } from "../utils/api"
import { PieChart, Briefcase, Play, Trophy, Target, TrendingUp, DollarSign, Shield, Zap, BarChart3, Star } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import MetricCard from "../components/MetricCard"
import ProgressBar from "../components/ProgressBar"
import LoadingSpinner from "../components/LoadingSpinner"
import { BookOpen } from "lucide-react"
import StrategyBundleSection from '../components/StrategyBundleSection'
// Profile icons and labels
const PROFILE_ICONS = {
  1: PieChart,      // Gestion de portefeuille
  2: TrendingUp,    // Lecture des indicateurs
  3: Briefcase,     // Simulation de levée de fonds
}

const PROFILE_DESCRIPTIONS = {
  1: "Spécialiste de la gestion de portefeuille, de l'allocation d'actifs et de l'optimisation du risque/rendement.",
  2: "Expert en analyse technique, signaux de marché et trading algorithmique.",
  3: "Spécialiste de la levée de fonds, valorisation startup et financement bancaire.",
}

const StudentDashboard = () => {
  const { userId, setProfile, profile } = useRole()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [progress, setProgress] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [nextMission, setNextMission] = useState(null)
  const [recommendedConcept, setRecommendedConcept] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch student first to check profile
      const studentData = await api.getStudent(userId)

      if (studentData.profile === -1) {
        // Redirect to profile selection if no profile
        navigate("/choose-profile")
        return
      }

      // Set profile in context
      setProfile(studentData.profile,studentData.profile_label)
      setStudent(studentData)

      // Fetch other dashboard data in parallel 
      const [progressData, chartDataResponse, conceptProgressData] = await Promise.all([
        api.getStudentProgress(userId),
        api.getStudentChartData(userId),
        api.getStudentConceptProgress(userId),
      ])

      const filteredConcepts = conceptProgressData.filter(concept => {
        const conceptProfiles = concept.profiles || []  // e.g., [1, 3]
        return conceptProfiles.includes(profile)
      })

      setProgress({
  ...progressData,
  concept_progress: filteredConcepts
})
      // find the concept he didn't start yet or the lowest completion rate
      if (filteredConcepts && filteredConcepts.length > 0){
        const incomplete=filteredConcepts.filter(c => c.missions_completed< c.total_missions)
        .sort((a,b)=> a.missions_completed - b.missions_completed)

        setRecommendedConcept(incomplete[0] || progressData.concept_progress[0])
      }
      setChartData(chartDataResponse)

      // Try to get next mission
      try {
        const missionData = await api.getNextMission(userId)
        setNextMission(missionData)
      } catch (err) {
        setNextMission(null)
      }
    } catch (err) {
      setError(err.message || "Échec du chargement des données du tableau de bord")
    } finally {
      setLoading(false)
    }
  }

  if (userId) {
    fetchData()
  }
}, [userId, navigate])


  const handleStartMission = () => {
    if (nextMission) {
      navigate(`/mission/${nextMission.id}`)
    } 
  }

  if (loading) {
    return <LoadingSpinner size="xl" className="min-h-96" />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Erreur lors du chargement du tableau de bord</div>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  const completedConcepts = progress?.concept_progress?.filter(c => c.is_completed).length || 0
  const totalConcepts = progress?.concept_progress?.length || 0
  const metricsData = student
    ? [
        {
          subject: "Cashflow",
          value: student.cashflow,
          fullMark: 200,
        },
        {
          subject: "Contrôle",
          value: student.controle,
          fullMark: 100,
        },
        {
          subject: "Stress",
          value: 100 - student.stress, // Invert stress for better visualization
          fullMark: 100,
        },
        {
          subject: "Rentabilité",
          value: student.rentabilite + 50, // Adjust for visualization
          fullMark: 200,
        },
        {
          subject: "Réputation",
          value: student.reputation,
          fullMark: 100,
        },
      ]
    : []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
{/* Header with Profile */}
<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Bon retour, {student?.name} !</h1>
      <p className="text-gray-600 mt-1">Votre parcours spécialisé vous attend</p>
    </div>

    {/* Profile Badge */}
    {student?.profile !== -1 && (
      <div className="flex items-center space-x-3 bg-indigo-50 px-4 py-3 rounded-xl border border-indigo-200 max-w-xs">
        {React.createElement(PROFILE_ICONS[student.profile] || BookOpen, { className: "h-6 w-6 text-indigo-600" })}
        <div>
          <p className="text-sm font-medium text-gray-900">Profil</p>
          <p className="text-sm font-semibold text-indigo-700">{student.profile_label}</p>
        </div>
      </div>
    )}
  </div>
</div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Score total" value={student?.total_score || 0} icon={Trophy} color="yellow" />
        <MetricCard title="Profil d'investissement" value={student?.level_ai || "Prudent"} icon={Target} color="blue" />
        <MetricCard
          title="Missions terminées"
          value={progress?.missions_completed || 0}
          icon={BarChart3}
          color="green"
        />
        <MetricCard 
  title="Concepts" 
  value={`${completedConcepts}/${totalConcepts}`}
  icon={BookOpen} 
  color="purple" 
/>
      </div>

      {/* Learning Focus OR Completion Celebration */}
{progress?.concept_progress && progress.concept_progress.length > 0 ? (
  // Concepts exist and are loaded
  progress.concept_progress.some(c => c.missions_completed < c.total_missions) ? (
    // 🔹 Still learning: Show Recommended Concept
    <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Focus d'apprentissage</h3>
          {recommendedConcept ? (
            <>
              <p className="text-gray-700 mb-1">
                <strong>Recommandé :</strong> {recommendedConcept.concept}
              </p>
              <p className="text-gray-600 mb-2">
                Progression : {recommendedConcept.missions_completed} / {recommendedConcept.total_missions}
              </p>
              <div className="w-full h-2 bg-indigo-200 rounded mb-4">
                <div
                  className="h-2 bg-indigo-600 rounded"
                  style={{
                    width: `${(recommendedConcept.missions_completed / recommendedConcept.total_missions) * 100}%`,
                  }}
                ></div>
              </div>
            </>
          ) : (
            <p className="text-gray-600">Chargement du prochain concept...</p>
          )}
        </div>
        <div className="ml-6 mt-4 md:mt-0">
          <button
            onClick={() => navigate("/concepts")}
            className="btn-primary flex items-center space-x-2"
          >
            <BookOpen className="h-5 w-5" />
            <span>Voir la bibliothèque</span>
          </button>
        </div>
      </div>
    </div>
  ) : (
    // 🎉 All concepts completed
    <div className="card text-center py-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
      <Trophy className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Félicitations !</h3>
      <p className="text-gray-700 mb-4 max-w-2xl mx-auto">
        Vous avez maîtrisé tous les concepts de votre parcours. 
        Vous êtes maintenant prêt(e) à affronter des défis financiers complexes.
      </p>
      <button
        onClick={() => navigate("/concepts")}
        className="btn-outline mx-auto"
      >
        Explorer les défis avancés
      </button>
    </div>
  )
) : (
  // 🟡 No concepts loaded yet (e.g., first time user, still loading)
  <div className="card text-center py-8">
    <p className="text-gray-700">
      Chargement de votre parcours d'apprentissage...
    </p>
  </div>
)}

      {/* Mini-bundle IA */}
      <StrategyBundleSection studentId={userId} />

      {/* Le reste de ton dashboard */}

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Level Progress */} 
        {/* <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Level Progress</h3>
          <div className="space-y-4">
            {progress?.level_progress &&
              Object.entries(progress.level_progress).map(([level, data]) => (
                <div key={level}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">{level}</span>
                    <span className="text-sm text-gray-500">
                      {data.completed}/{data.total}
                    </span>
                  </div>
                  <ProgressBar
                    value={data.completed}
                    max={data.total}
                    color={data.percentage === 100 ? "success" : "primary"}
                    showLabel={false}
                  />
                </div>
              ))}
          </div>
        </div> */}

        {/* Current Metrics */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Indicateurs actuels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Cashflow</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{student?.cashflow}€</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Contrôle</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{student?.controle}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium">Stress</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{student?.stress}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Rentabilité</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{student?.rentabilite}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium">Réputation</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{student?.reputation}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Progress Over Time */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progression du score</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.metrics_over_time}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                  <Line
                    type="monotone"
                    dataKey="total_score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metrics Radar */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vue d’ensemble des indicateurs</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={metricsData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, "dataMax"]} />
                  <Radar name="Current" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* AI Tip */}
<div className="card">
  <div className="flex items-start space-x-3">
    <div className="p-2 bg-amber-100 rounded-full">
      <Star className="h-5 w-5 text-amber-600" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-900">Conseil du jour</h3>
      <p className="text-gray-700">
        "La diversification réduit le risque, mais pas le stress. 
        Explorez <strong>Gestion des Risques</strong> pour apprendre à gérer les deux."
      </p>
    </div>
  </div>
</div>
      {/* Recent Missions */}
      {chartData?.mission_timeline && chartData.mission_timeline.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Missions récentes</h3>
          <div className="space-y-4">
            {chartData.mission_timeline.slice(0, 5).map((mission, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 capitalize">{mission.concept}</h4>
                  <p className="text-sm text-gray-600">Niveau : {mission.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-600">+{mission.score_earned}</p>
                  <p className="text-sm text-gray-500">
  {Math.floor(mission.time_spent_seconds / 60)} min {mission.time_spent_seconds % 60} sec
</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentDashboard
