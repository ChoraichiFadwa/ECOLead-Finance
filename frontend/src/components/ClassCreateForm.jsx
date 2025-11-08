import { useState, useEffect } from "react"
import { api } from "../utils/api"

const ClassCreateForm = ({ teacherId, onCreated }) => {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [students, setStudents] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await api.getAllStudents()
        setStudents(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchStudents()
  }, [])

  const toggleStudent = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      await api.createClass(teacherId, {
        name,
        description,
        student_ids: selectedStudents,
      })
      setSuccess("Classe créée avec succès 🎉")
      setName("")
      setDescription("")
      setSelectedStudents([])
      if (onCreated) onCreated() // Refresh parent
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Créer une nouvelle classe</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Nom de la classe</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Description</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Ajouter des étudiants</label>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
            {students.map((s) => (
              <label key={s.id} className="flex items-center space-x-2 p-1">
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(s.id)}
                  onChange={() => toggleStudent(s.id)}
                />
                <span>{s.name}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg"
        >
          {loading ? "Création..." : "Créer la classe"}
        </button>
      </form>
    </div>
  )
}

export default ClassCreateForm
