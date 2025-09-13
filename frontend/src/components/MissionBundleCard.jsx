import { useNavigate } from "react-router-dom"
export default function MissionBundleCard({ mission, onEventClick }) {
    const navigate = useNavigate()
    const handleStartMission = (missionId) => {
    navigate(`/mission/${missionId}`)
  }
  return (
    <div className="mission-card bg-white p-5 rounded-lg shadow hover:shadow-md transition">
      <h3 className="font-bold text-lg mb-2">{mission.mission_id}</h3>
      <div className="text-sm text-gray-600 mb-3">
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
          {mission.concept}
        </span>
        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
          {mission.niveau}
        </span>
        {mission.has_event && (
          <button
            onClick={onEventClick}
            className="ml-2 text-yellow-600 hover:text-yellow-800"
            title="Voir contexte événementiel"
          >
            ⚡
          </button>
        )}
      </div>
      <ul className="text-xs text-gray-700 mb-4 space-y-1">
        {mission.why.map((reason, i) => (
          <li key={i} className="flex items-start">
            <span className="mr-2">•</span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>
      <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition" onClick={() => handleStartMission(mission.mission_id)}>
        Commencer cette mission
      </button>
    </div>
  );
}