import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRole } from "../contexts/RoleContext";
import { api } from "../utils/api";
import { Trophy, BookOpen, Play, Target } from "lucide-react";
import MetricCard from "../components/MetricCard";
import LoadingSpinner from "../components/LoadingSpinner";
import StrategyBundleSection from '../components/StrategyBundleSection';
import StrategicContextSection from '../components/StrategicContextSection';
import EventLibrarySection from "../components/EventLibrarySection";
import StudentNotifications from "../components/StudentNotifications";
import StudentMissionReport from "../components/StudentMissionReport";
import StudentSidebar from "../components/StudentSidebar";
const PROFILE_ICONS = {
  1: () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  2: () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M4 19.5v-15A2.5 2.5 0 016.5 2H19a2 2 0 012 2v15a2 2 0 01-2 2H6.5a2.5 2 0 01-2.5-2.5z" /></svg>,
  3: () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

const StudentDashboard = () => {
  const { userId, setProfile, profile } = useRole();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [progress, setProgress] = useState(null);
  const [chartData, setChartData] = useState(null)
  const [nextMission, setNextMission] = useState(null);
  const [selectedMissionId, setSelectedMissionId] = useState(null);
  const [recommendedConcept, setRecommendedConcept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const studentData = await api.getStudent(userId);

        if (studentData.profile === -1) {
          navigate("/choose-profile");
          return;
        }

        setProfile(studentData.profile, studentData.profile_label);
        setStudent(studentData);

        const [progressData, chartDataResponse, conceptProgressData] = await Promise.all([
          api.getStudentProgress(userId),
          api.getStudentChartData(userId),
          api.getStudentConceptProgress(userId),
        ]);

        const filteredConcepts = conceptProgressData.filter(concept =>
          (concept.profiles || []).includes(profile)
        );

        setProgress({ ...progressData, concept_progress: filteredConcepts });
       

        const incomplete = filteredConcepts
          .filter(c => c.missions_completed < c.total_missions)
          .sort((a, b) => a.missions_completed - b.missions_completed);
        setRecommendedConcept(incomplete[0] || filteredConcepts[0]);
        setChartData(chartDataResponse)
        try {
          const missionData = await api.getNextMission(userId);
          setNextMission(missionData);
        } catch (err) {
          setNextMission(null);
        }
      } catch (err) {
        setError(err.message || "Échec du chargement");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchData();
  }, [userId, navigate, profile]);

  const handleStartMission = () => {
    if (nextMission) {
      navigate(`/mission/${nextMission.id}`);
    }
  };

  if (loading) return <LoadingSpinner size="xl" className="min-h-96" />;
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Erreur</div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  const completedConcepts = progress?.concept_progress?.filter(c => c.is_completed).length || 0;
  const totalConcepts = progress?.concept_progress?.length || 0;

return (

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-8 animate-fade-in">

          {/* 👇 Moved from header → now first content block */}
          {/* Top Header - Personalized & Clean */}
{/* Top Header - Clean & Simple */}
{/* Top Header — Fluent, No Box, No Border */}
<div className="pt-6 pb-5 px-6 md:px-8">
  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
    {/* Left: Name + Profile Below */}
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Bon retour, {student?.name} !</h1>
      <p className="text-gray-600 mt-1">Votre parcours spécialisé vous attend</p>

      {/* Profile Label — directly under name, no box, no icon */}
      {student?.profile !== -1 && (
        <p className="mt-3 text-sm text-indigo-700 font-medium">
          Profil : {student.profile_label}
        </p>
      )}
    </div>

    {/* Right: Notification Bell — aligned to top of text */}
    <div className="flex items-center">
      <StudentNotifications 
        studentId={userId} 
        onMissionSelect={(missionId) => setSelectedMissionId(missionId)} 
      />
    </div>
  </div>
</div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard title="Score total" value={student?.total_score || 0} icon={Trophy} color="yellow" />
            <MetricCard 
              title="Profil d'investissement" 
              value={student?.level_ai || "Prudent"} 
              icon={Target} 
              color="blue" 
            />
            <MetricCard 
              title="Missions terminées" 
              value={progress?.missions_completed || 0} 
              icon={BookOpen} 
              color="green" 
            />
            <MetricCard 
              title="Concepts maîtrisés" 
              value={`${completedConcepts}/${totalConcepts}`} 
              icon={Target} 
              color="purple" 
            />
          </div>

          {/* Next Mission CTA
          {nextMission ? (
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Prochaine mission</h2>
              <p className="text-gray-700 mb-4">« {nextMission.title} »</p>
              <button
                onClick={handleStartMission}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Continuer la mission
              </button>
            </div>
          ) : recommendedConcept ? (
            <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Commencer un nouveau concept</h2>
              <p className="text-gray-700 mb-4">
                « {recommendedConcept.nom || recommendedConcept.name} »
              </p>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progression</span>
                  <span>{recommendedConcept.missions_completed}/{recommendedConcept.total_missions}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(recommendedConcept.missions_completed / recommendedConcept.total_missions) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : null} */}

          {/* Strategic Context & AI Bundle */}
          <StrategicContextSection 
            studentId={userId}
            onGoalSelect={(goal) => setSelectedGoal(goal)}
          />
          <StrategyBundleSection studentId={userId} selectedGoal={selectedGoal} />

          <EventLibrarySection studentId={userId} />
          
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

          {/* Mission Report */}
          {selectedMissionId && (
            <div className="card animate-fade-in mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Rapport de mission</h2>
                <button
                  onClick={() => setSelectedMissionId(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <StudentMissionReport
                studentId={userId}
                missionId={selectedMissionId}
              />
            </div>
          )}
        </div>
      </div>
);
};

export default StudentDashboard;