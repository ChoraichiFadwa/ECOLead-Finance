// src/components/TeacherFeedbackPanel.jsx
import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { Send, CheckCircle, MessageCircle } from "lucide-react";

export default function TeacherFeedbackPanel({ teacherId, studentId }) {
  const [missions, setMissions] = useState([]);
  const [feedbacks, setFeedbacks] = useState({});
  const [statuses, setStatuses] = useState({}); // 'idle' | 'sending' | 'success' | 'error'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teacherId || !studentId) return;
    setLoading(true);
    setError(null);

    const fetchMissions = async () => {
      try {
        const data = await api.getTeacherStudentMissions(teacherId, studentId);
        setMissions(data);

        const initialFeedbacks = {};
        const initialStatuses = {};
        data.forEach(m => {
          const mid = m.mission_id || m.id;
          initialFeedbacks[mid] = m.feedback_teacher || "";
          initialStatuses[mid] = m.feedback_teacher ? "success" : "idle";
        });
        setFeedbacks(initialFeedbacks);
        setStatuses(initialStatuses);
      } catch (err) {
        console.error(err);
        setError(err.message || "Erreur lors du chargement des missions");
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, [teacherId, studentId]);

  const stringifyChoice = (choix) => {
    if (!choix) return "Aucun choix enregistré";
    if (typeof choix === "string") return choix;
    if (typeof choix === "object") {
      const entries = Object.entries(choix);
      if (!entries.length) return "Aucun choix";
      const values = entries.map(([k, v]) => 
        typeof v === "object" ? JSON.stringify(v) : String(v)
      );
      return values.join(" — ");
    }
    return String(choix);
  };

  const handleChange = (missionId, value) => {
    setFeedbacks(prev => ({ ...prev, [missionId]: value }));
    // Reset status if editing after success
    if (statuses[missionId] === "success") {
      setStatuses(prev => ({ ...prev, [missionId]: "idle" }));
    }
  };

  const handleSubmit = async (missionId) => {
    const comment = (feedbacks[missionId] || "").trim();
    if (!comment) {
      setStatuses(prev => ({ ...prev, [missionId]: "error" }));
      setTimeout(() => {
        setStatuses(prev => ({ ...prev, [missionId]: "idle" }));
      }, 3000);
      return;
    }

    setStatuses(prev => ({ ...prev, [missionId]: "sending" }));
    try {
      await api.addTeacherFeedback(teacherId, studentId, missionId, { comment });
      setStatuses(prev => ({ ...prev, [missionId]: "success" }));
    } catch (err) {
      console.error(err);
      setStatuses(prev => ({ ...prev, [missionId]: "error" }));
      setTimeout(() => {
        setStatuses(prev => ({ ...prev, [missionId]: "idle" }));
      }, 3000);
    }
  };

  if (loading) return <div className="py-4 text-gray-500">Chargement des missions...</div>;
  if (error) return <div className="py-4 text-red-600">Erreur : {error}</div>;
  if (!missions.length) return <div className="py-4 text-gray-600">Aucune mission terminée par cet étudiant.</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Feedback pédagogique</h3>
      </div>

      {missions.map(m => {
        const mid = m.mission_id || m.id || m.title;
        const studentChoice = stringifyChoice(m.choix_etudiant || m.choix || m.choice);
        const status = statuses[mid] || "idle";
        const hasExistingFeedback = m.feedback_teacher;

        return (
          <div 
            key={mid} 
            className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition"
          >
            {/* Mission Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium text-gray-900">{m.title || mid}</h4>
                {m.concept && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {m.concept}
                  </span>
                )}
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>Niveau : {m.niveau || m.level || "—"} </div>
                <div className="font-medium text-gray-900">+{m.score_earned || 0} pts</div>
              </div>
            </div>

            {/* Context & Objective */}
            {m.contexte && (
              <div className="mb-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Contexte :</span> {m.contexte}
                </p>
              </div>
            )}
            {m.objectif_pedagogique && (
              <div className="mb-3">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Objectif :</span> {m.objectif_pedagogique}
                </p>
              </div>
            )}

            {/* Student Choice */}
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Choix de l’étudiant</p>
              <p className="text-sm text-gray-900">{studentChoice}</p>
            </div>

            {/* Auto Feedback */}
            {m.feedback_auto && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">Feedback automatique</p>
                <p className="text-sm text-blue-900">{m.feedback_auto}</p>
              </div>
            )}

            {/* Teacher Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre feedback personnalisé
              </label>
              
              {hasExistingFeedback && status !== "idle" && (
                <div className="mb-3 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Déjà envoyé</p>
                      <p className="text-sm text-green-900 mt-1">{hasExistingFeedback}</p>
                    </div>
                  </div>
                </div>
              )}

              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                placeholder="Soyez constructif, précis et encourageant. Ex: « Bonne analyse du risque, mais pense à vérifier la liquidité avant d’investir. »"
                value={feedbacks[mid] || ""}
                onChange={(e) => handleChange(mid, e.target.value)}
                disabled={status === "success" && !hasExistingFeedback}
              />

              {/* Status & Action */}
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {status === "error" && (
                    <span className="text-red-600">Veuillez écrire un commentaire.</span>
                  )}
                  {status === "success" && !hasExistingFeedback && (
                    <span className="text-green-600">Feedback envoyé avec succès !</span>
                  )}
                </div>
                <button
                  onClick={() => handleSubmit(mid)}
                  disabled={status === "sending" || (status === "success" && !hasExistingFeedback)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {status === "sending" ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {hasExistingFeedback ? "Mettre à jour" : "Envoyer"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}