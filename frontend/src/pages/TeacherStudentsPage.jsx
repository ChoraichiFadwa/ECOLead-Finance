// src/pages/TeacherStudentsPage.jsx
import { useState, useEffect } from "react";
import { useRole } from "../contexts/RoleContext";
import { api } from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { Link } from "react-router-dom";
import TeacherFeedbackPanel from "../components/TeacherFeedbackPanel";
import ClassCreateForm from "../components/ClassCreateForm";

const TeacherStudentsPage = () => {
  const { userId } = useRole();
  const [allStudents, setAllStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentMetrics, setStudentMetrics] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false); // 👈 Toggle form visibility

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const [allStudentsRes, classesRes] = await Promise.all([
          api.getAllStudents(),
          api.getTeacherClasses(userId),
        ]);
        setAllStudents(allStudentsRes);
        setClasses(classesRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleClassSelect = async (cls) => {
    setSelectedClass(cls);
    setSelectedStudent(null);
    try {
      const studentsInClass = await api.getClassStudents(cls.id);
      setClassStudents(studentsInClass);
    } catch (err) {
      console.error("Failed to load class students", err);
      setClassStudents([]);
    }
  };

  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    try {
      const metrics = await api.getStudentMetrics(userId, student.id);
      setStudentMetrics(metrics);
    } catch (err) {
      console.error("Failed to load student metrics", err);
    }
  };

  const handleClassCreated = async () => {
    try {
      const newClasses = await api.getTeacherClasses(userId);
      setClasses(newClasses);
      setShowCreateForm(false); // Hide form after successful creation
    } catch (err) {
      console.error("Failed to refresh classes after creation", err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cours enseignés</h1>
        <Link to="/teacher/dashboard" className="text-primary-600 hover:underline">
          ← Retour au tableau de bord
        </Link>
      </div>

      {/* Classes Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vos Classes</h2>
        
        {/* Class Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleClassSelect(cls)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{cls.description}</p>
                </div>
                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {cls.students?.length || 0} étudiants
                </div>
              </div>
              
              <button
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleClassSelect(cls);
                }}
              >
                Voir les étudiants →
              </button>
            </div>
          ))}
        </div>

        {/* Create Class Button */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <span className="text-xl">+</span>
          <span>Créer une nouvelle classe</span>
        </button>

        {/* Create Class Form (appears below button) */}
        {showCreateForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <ClassCreateForm 
              teacherId={userId} 
              onCreated={handleClassCreated}
            />
          </div>
        )}
      </div>

      {/* Students and Details Section (only shows when class is selected) */}
      {selectedClass && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students in Selected Class */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">
              Étudiants dans {selectedClass.name}
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {classStudents.map((student) => (
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

          {/* Student Details */}
          <div className="card max-h-[700px] overflow-y-auto">
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

                <p className="text-sm text-gray-600 mb-6">
                  Inscrit le {new Date(selectedStudent.created_at).toLocaleDateString()}
                </p>

                {/* Teacher Feedback Panel */}
                <div className="border-t pt-4 mt-6">
                  <TeacherFeedbackPanel
                    teacherId={userId}
                    studentId={selectedStudent.id}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Sélectionnez un étudiant pour voir ses détails
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component
const Metric = ({ label, value, color }) => {
  const colorClasses = {
    green: "text-green-600 bg-green-50",
    blue: "text-blue-600 bg-blue-50",
    red: "text-red-600 bg-red-50",
    purple: "text-purple-600 bg-purple-50",
  };
  return (
    <div className={`text-center p-3 rounded-lg ${colorClasses[color]}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-sm text-gray-700">{label}</div>
    </div>
  );
};

export default TeacherStudentsPage;