// src/pages/TeacherDashboard.jsx
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useRole } from "../contexts/RoleContext"
import { api } from "../utils/api"
import { Users, Clock, Target, Award } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import MetricCard from "../components/MetricCard"
import LoadingSpinner from "../components/LoadingSpinner"

const TeacherDashboard = () => {
  const { userId } = useRole()
  const [dashboardData, setDashboardData] = useState(null)
  const [students, setStudents] = useState([])
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
        setError(err.message || "Erreur lors du chargement")
      } finally {
        setLoading(false)
      }
    }

    if (userId) fetchData()
  }, [userId])

  if (loading) return <LoadingSpinner size="xl" className="min-h-96" />
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Échec du chargement</div>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord professeur</h1>
          <p className="text-gray-600 mt-1">Suivez les progrès et l'engagement de votre classe</p>
        </div>
        {/* 👇 Link to Learning Design Page */}
        <Link
          to="/teacher/learning-design"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          Créer du contenu pédagogique
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Étudiants" value={students.length} icon={Users} color="blue" />
        <MetricCard 
          title="Taux de complétion" 
          value={`${dashboardData?.class_completion_rate || 0}%`} 
          icon={Target} 
          color="green" 
        />
        <MetricCard 
          title="Temps moyen" 
          value={`${dashboardData?.avg_completion_time_minutes || 0} min`} 
          icon={Clock} 
          color="yellow" 
        />
        <MetricCard 
          title="Score moyen" 
          value={Math.round(dashboardData?.avg_score || 0)} 
          icon={Award} 
          color="purple" 
        />
        <Link to="/teacher/students" className="block">
    <MetricCard 
      title="Voir les étudiants" 
      value="→" 
      icon={Users} 
      color="indigo" 
    />
  </Link>
      </div>

      {/* Engagement Chart */}
      {dashboardData && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement sur la plateforme</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.engagement_trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                <YAxis />
                <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                <Line type="monotone" dataKey="active_students" stroke="#3b82f6" name="Étudiants actifs" />
                <Line type="monotone" dataKey="missions_completed" stroke="#10b981" name="Missions terminées" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}



      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
        <div className="space-y-4">
          {students.slice(0, 5).map((student) => (
            <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium">{student.name.charAt(0)}</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{student.name}</h4>
                  <p className="text-sm text-gray-600">Profil : {student.level_ai}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary-600">{student.total_score}</p>
                <p className="text-sm text-gray-500">points</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard