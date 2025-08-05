import { useState, useEffect } from "react"
import { useRole } from "../contexts/RoleContext"
import { api } from "../utils/api"
import { Users, Clock, Target, Award, Eye } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import MetricCard from "../components/MetricCard"
import LoadingSpinner from "../components/LoadingSpinner"

const TeacherDashboard = () => {
  const { userId } = useRole()
  const [dashboardData, setDashboardData] = useState(null)
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentMetrics, setStudentMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [dashboardResponse, studentsResponse] = await Promise.all([
          api.getTeacherDashboard(userId),
          api.getAllStudents(),
        ])

        setDashboardData(dashboardResponse)
        setStudents(studentsResponse)
      } catch (err) {
        setError(err.message || "Erreur lors du chargement du tableau de bord")
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchData()
    }
  }, [userId])

  const handleStudentSelect = async (student) => {
    setSelectedStudent(student)
    try {
      const metrics = await api.getStudentMetrics(userId, student.id)
      setStudentMetrics(metrics)
    } catch (err) {
      console.error("Failed to load student metrics:", err)
    }
  }

  if (loading) {
    return <LoadingSpinner size="xl" className="min-h-96" />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Échec du chargement des données du tableau de bord</div>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord professeur</h1>
        <p className="text-gray-600 mt-1">Suivez les progrès et l'engagement des étudiants</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Students" value={students.length} icon={Users} color="blue" />
        <MetricCard
          title="Active Missions"
          value={dashboardData?.total_active_missions || 0}
          icon={Target}
          color="green"
        />
        <MetricCard
          title="Avg. Completion Time"
          value={`${dashboardData?.avg_completion_time_minutes || 0}min`}
          icon={Clock}
          color="yellow"
        />
        <MetricCard title="Avg. Score" value={dashboardData?.avg_score || 0} icon={Award} color="purple" />
      </div>

      {/* Students Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Students List */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Étudiants</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {students.map((student) => (
              <div
                key={student.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedStudent?.id === student.id
                    ? "border-primary-300 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => handleStudentSelect(student)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{student.name}</h4>
                    <p className="text-sm text-gray-600">{student.email}</p>
                    <p className="text-sm text-gray-500 capitalize">Niveau : {student.current_level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">{student.total_score}</p>
                    <p className="text-sm text-gray-500">points</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Details */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedStudent ? `${selectedStudent.name} - Détails` : "Sélectionnez un étudiant"}
          </h3>

          {selectedStudent ? (
            <div className="space-y-4">
              {/* Current Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{selectedStudent.cashflow}€</p>
                  <p className="text-sm text-gray-600">Cashflow</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedStudent.controle}%</p>
                  <p className="text-sm text-gray-600">Contrôle</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{selectedStudent.stress}%</p>
                  <p className="text-sm text-gray-600">Stress</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{selectedStudent.rentabilite}%</p>
                  <p className="text-sm text-gray-600">Rentabilité</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Réputation</span>
                  <span className="text-sm text-gray-900">{selectedStudent.reputation}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${selectedStudent.reputation}%` }}
                  />
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-gray-600">
                  <strong>Date d'inscription :</strong> {new Date(selectedStudent.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Cliquez sur un étudiant pour voir ses détails</p>
            </div>
          )}
        </div>
      </div>

      {/* Platform Analytics */}
      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Engagement Over Time */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement sur la plateforme</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.engagement_over_time || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <Line
                    type="monotone"
                    dataKey="active_students"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Étudiants actifs"
                  />
                  <Line
                    type="monotone"
                    dataKey="missions_completed"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Missions terminées"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Concept Performance */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.concept_performance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="concept" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avg_score" fill="#3b82f6" name="Score moyen" />
                  <Bar dataKey="completion_rate" fill="#10b981" name="Completion Rate" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
        <div className="space-y-4">
          {students.slice(0, 5).map((student, index) => (
            <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium">{student.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{student.name}</h4>
                  <p className="text-sm text-gray-600">Niveau : {student.level_ai}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary-600">{student.total_score}</p>
                <p className="text-sm text-gray-500">points totaux</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard
