// src/components/StrategyBundleSection.jsx
import { useState, useEffect } from 'react';
import MissionBundleCard from './MissionBundleCard';
import EventContextCard from './EventContextCard';

const StrategyBundleSection = ({ studentId = 123 }) => {
  const [bundleData, setBundleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBundle = async () => {
      try {
        const response = await fetch('/api/suggest-strategy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            goal: "reduce_stress",  // ou dynamique selon l'étudiant
            max_bundle: 3
          })
        });
        if (!response.ok) throw new Error('Failed to fetch bundle');
        const data = await response.json();
        setBundleData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBundle();
  }, [studentId]);

  if (loading) return <div>Chargement de ton mini-bundle...</div>;
  if (error) return <div>Erreur : {error}</div>;
  if (!bundleData) return null;

  return (
    <div className="strategy-bundle-section mt-8 p-6 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">🎯 Ton mini-bundle personnalisé</h2>
      
      {/* Missions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {bundleData.bundle.missions.map(mission => (
          <MissionBundleCard
            key={mission.mission_id}
            mission={mission}
            onEventClick={() => {
              // Ouvre modal ou affiche EventContextCard
              console.log("Show event:", mission);
            }}
          />
        ))}
      </div>

      {/* Tip IA */}
      {bundleData.tip && (
        <div className="tip p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded">
          <strong>💡 {bundleData.tip.text}</strong>
        </div>
      )}

      {/* Explanation */}
      <p className="text-sm text-gray-600 mt-4">{bundleData.explanation}</p>
    </div>
  );
};

export default StrategyBundleSection;