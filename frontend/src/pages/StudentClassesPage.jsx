import { useState, useEffect } from "react";
import { useRole } from "../contexts/RoleContext";
import { api } from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { Link } from "react-router-dom";

const StudentClassesPage = () => {
  const { userId } = useRole();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getStudentClasses(userId);
        setClasses(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Mes cours</h1>
      </div>

      {/* List of classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
            onClick={() => setSelectedClass(cls)}
          >
            <h3 className="font-medium text-gray-900">{cls.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{cls.description}</p>
            <div className="mt-3 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block">
              {cls.students?.length} étudiants
            </div>
          </div>
        ))}
      </div>

      {/* Class details panel */}
      {selectedClass && (
        <div className="card p-5 mt-6">
          <h2 className="text-xl font-semibold mb-3">{selectedClass.name}</h2>
          <p className="text-gray-700">{selectedClass.description}</p>
        </div>
      )}
    </div>
  );
};

export default StudentClassesPage;
