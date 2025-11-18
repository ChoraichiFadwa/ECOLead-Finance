// src/pages/StudentStatusPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRole } from "../contexts/RoleContext";
import { api } from "../utils/api";
import { 
  DollarSign, Shield, Zap, TrendingUp, Star,
  LineChart as LineChartIcon, PieChart as PieChartIcon
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import EventLibrarySection from '../components/EventLibrarySection';
import StudentNotifications from "../components/StudentNotifications"; // 👈 Added
import StudentMissionReport from "../components/StudentMissionReport"; // 👈 Added

// Recharts imports
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const StudentStatusPage = () => {
  const { userId } = useRole();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [recentMissions, setRecentMissions] = useState([]);
  const [selectedMissionId, setSelectedMissionId] = useState(null); // 👈 For inline report
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const studentData = await api.getStudent(userId);
        setStudent(studentData);

        const [chartDataResponse] = await Promise.all([
          api.getStudentChartData(userId),
        ]);
        setChartData(chartDataResponse);
        setRecentMissions(chartDataResponse.mission_timeline || []);
      } catch (err) {
        setError(err.message || "Échec du chargement");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchData();
  }, [userId]);

  if (loading) return <LoadingSpinner size="xl" className="min-h-96" />;
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Erreur</div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  const metricsData = student
    ? [
        { subject: "Cashflow", value: student.cashflow, fullMark: 200 },
        { subject: "Contrôle", value: student.controle, fullMark: 100 },
        { subject: "Stress", value: 100 - student.stress, fullMark: 100 },
        { subject: "Rentabilité", value: student.rentabilite + 50, fullMark: 200 },
        { subject: "Réputation", value: student.reputation, fullMark: 100 },
      ]
    : [];

  return (
    <div className="space-y-8 animate-fade-in">


      {/* Current Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricItem label="Cashflow" value={`${student?.cashflow}€`} icon={DollarSign} color="text-green-600" bg="bg-green-50" />
        <MetricItem label="Contrôle" value={`${student?.controle}%`} icon={Shield} color="text-blue-600" bg="bg-blue-50" />
        <MetricItem label="Stress" value={`${student?.stress}%`} icon={Zap} color="text-red-600" bg="bg-red-50" />
        <MetricItem label="Rentabilité" value={`${student?.rentabilite}%`} icon={TrendingUp} color="text-purple-600" bg="bg-purple-50" />
        <MetricItem label="Réputation" value={`${student?.reputation}%`} icon={Star} color="text-yellow-600" bg="bg-yellow-50" />
      </div>

      {/* Charts */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Progress Over Time */}
          <div className="card">
            <div className="flex items-center mb-4">
              <LineChartIcon className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Progression du score</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.metrics_over_time}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                  <Line type="monotone" dataKey="total_score" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metrics Radar */}
          <div className="card">
            <div className="flex items-center mb-4">
              <PieChartIcon className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Vue d’ensemble</h3>
            </div>
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

      {/* Recent Missions */}
      {recentMissions.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Missions récentes</h3>
          <div className="space-y-3">
            {recentMissions.slice(0, 5).map((mission, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{mission.concept}</h4>
                  <p className="text-sm text-gray-600">Niveau : {mission.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-600">+{mission.score_earned}</p>
                  <p className="text-sm text-gray-500">
                    {Math.floor(mission.time_spent_seconds / 60)} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Inline Mission Report */}
      {selectedMissionId && (
        <div className="card animate-fade-in">
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
  );
};

// 🔁 Reusable Metric Item
const MetricItem = ({ label, value, icon: Icon, color, bg }) => (
  <div className={`p-4 rounded-lg border ${bg}`}>
    <div className="flex items-center space-x-2 mb-2">
      <Icon className={`h-5 w-5 ${color}`} />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
    <p className="text-xl font-bold text-gray-900">{value}</p>
  </div>
);

export default StudentStatusPage;