// src/components/StudentMissionReport.jsx
import { useEffect, useState } from "react";
import { api } from "../utils/api"; // 👈 Use your api util, not fetch

export default function StudentMissionReport({ studentId, missionId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        // ✅ Use your existing API util
        const data = await api.getStudentMissionReport(studentId, missionId);
        setReport(data);
      } catch (err) {
        console.error("Erreur chargement rapport:", err);
      } finally {
        setLoading(false);
      }
    };

    if (studentId && missionId) {
      loadReport();
    }
  }, [studentId, missionId]);

  if (loading) return <div className="py-4 text-gray-500">Chargement du rapport...</div>;
  if (!report) return <div className="py-4 text-red-600">Rapport non trouvé.</div>;

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <p><strong>Mission :</strong> {report.title || report.mission_id}</p>
        <p><strong>Concept :</strong> {report.concept}</p>
        <p><strong>Niveau :</strong> {report.niveau || report.level}</p>
        <p><strong>Type :</strong> {report.type}</p>
      </div>

      <div>
        <p><strong>Contexte :</strong></p>
        <p className="bg-gray-50 p-3 rounded mt-1">{report.contexte}</p>
      </div>

      <div>
        <p><strong>Objectif pédagogique :</strong></p>
        <p className="bg-gray-50 p-3 rounded mt-1">{report.objectif_pedagogique}</p>
      </div>

      <div className="border-t pt-3">
        <h3 className="font-semibold text-gray-700 mb-2">Votre choix</h3>
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
          {JSON.stringify(report.student_choices, null, 2)}
        </pre>
      </div>

      <div className="border-t pt-3">
        <h3 className="font-semibold text-gray-700 mb-2">Feedback automatique</h3>
        <p className="bg-blue-50 p-3 rounded text-sm">{report.feedback_auto}</p>
      </div>

      {report.feedback_teacher?.length > 0 && (
        <div className="border-t pt-3">
          <h3 className="font-semibold text-gray-700 mb-2">Feedback du professeur</h3>
          <ul className="list-disc list-inside space-y-1">
            {report.feedback_teacher.map((fb, idx) => (
              <li key={idx} className="text-sm">{fb}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t pt-3 text-gray-600">
        <p><strong>Score :</strong> +{report.score_earned}</p>
        <p><strong>Complétée le :</strong> {new Date(report.completed_at).toLocaleString('fr-FR')}</p>
      </div>
    </div>
  );
}