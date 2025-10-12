// src/pages/StudentsPage.jsx
import { useState, useEffect } from "react"
import { useRole } from "../contexts/RoleContext"
import { api } from "../utils/api"
import LoadingSpinner from "../components/LoadingSpinner"
import { Link } from "react-router-dom"

const StudentsPage = () => {
  const { userId } = useRole()
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentMetrics, setStudentMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return
      try {
        setLoading(true)
        const studentsRes = await api.getAllStudents()
        setStudents(studentsRes)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userId])

  const handleStudentSelect = async (student) => {
    setSelectedStudent(student)
    try {
      const metrics = await api.getStudentMetrics(userId, student.id)
      setStudentMetrics(metrics)
    } catch (err) {
      console.error("Failed to load metrics", err)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Étudiants</h1>
        <Link to="/teacher/dashboard" className="text-primary-600 hover:underline">
          ← Retour au tableau de bord
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student List */}
        <div className="card max-h-[600px] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Liste des étudiants</h2>
          <div className="space-y-3">
            {students.map((student) => (
              <div
                key={student.id}
                onClick={() => handleStudentSelect(student)}
                className={`p-4 rounded-lg border cursor-pointer transition ${
                  selectedStudent?.id === student.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="font-medium">{student.name}</div>
                <div className="text-sm text-gray-600">{student.email}</div>
                <div className="text-sm text-gray-500">Profil : {student.level_ai}</div>
                <div className="mt-2 text-lg font-bold text-primary-600">
                  {student.total_score} pts
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Detail */}
        <div className="card">
          {selectedStudent ? (
            <>
              <h2 className="text-lg font-semibold mb-4">
                {selectedStudent.name} — Détails
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Metric label="Cashflow" value={`${selectedStudent.cashflow}€`} color="green" />
                <Metric label="Contrôle" value={`${selectedStudent.controle}%`} color="blue" />
                <Metric label="Stress" value={`${selectedStudent.stress}%`} color="red" />
                <Metric label="Rentabilité" value={`${selectedStudent.rentabilite}%`} color="purple" />
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Réputation</span>
                  <span>{selectedStudent.reputation}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${selectedStudent.reputation}%` }}
                  />
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Inscrit le {new Date(selectedStudent.created_at).toLocaleDateString()}
              </p>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Sélectionnez un étudiant pour voir ses statistiques
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper component
const Metric = ({ label, value, color }) => {
  const colorClasses = {
    green: "text-green-600 bg-green-50",
    blue: "text-blue-600 bg-blue-50",
    red: "text-red-600 bg-red-50",
    purple: "text-purple-600 bg-purple-50",
  }
  return (
    <div className={`text-center p-3 rounded-lg ${colorClasses[color]}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-sm text-gray-700">{label}</div>
    </div>
  )
}

export default StudentsPage