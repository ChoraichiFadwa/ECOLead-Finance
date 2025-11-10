// src/pages/LearningDesignPage.jsx
import { useState, useEffect, useMemo } from "react";
import { useRole } from "../contexts/RoleContext";
import { api } from "../utils/api";
import ConceptForm from "../components/ConceptCreationForm";
import MissionForm from "../components/MissionCreationForm";
import EventCreationForm from "../components/EventCreationForm";
import { Link } from "react-router-dom";
import { BookOpen, Target, Plus, Search, Calendar } from "lucide-react";

const LearningDesignPage = () => {
  const { userId } = useRole();
  const [concepts, setConcepts] = useState([]);
  const [missions, setMissions] = useState([]);
  const [showConceptForm, setShowConceptForm] = useState(false);
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [conceptSearch, setConceptSearch] = useState("");
  const [missionSearch, setMissionSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
const [showEventForm, setShowEventForm] = useState(false);
const [eventSearch, setEventSearch] = useState("");

  // 🔍 Filtrer les concepts
  const filteredConcepts = useMemo(() => {
    if (!conceptSearch.trim()) return concepts;
    const term = conceptSearch.toLowerCase();
    return concepts.filter(
      (c) =>
        (c.nom || c.name || "").toLowerCase().includes(term) ||
        (c.description || "").toLowerCase().includes(term)
    );
  }, [concepts, conceptSearch]);

  // 🔍 Filtrer les missions
  const filteredMissions = useMemo(() => {
    if (!missionSearch.trim()) return missions;
    const term = missionSearch.toLowerCase();
    return missions.filter(
      (m) =>
        (m.title || "").toLowerCase().includes(term) ||
        (m.contexte || m.description || "").toLowerCase().includes(term)
    );
  }, [missions, missionSearch]);
  const filteredEvents = useMemo(() => {
  if (!eventSearch.trim()) return events;
  const term = eventSearch.toLowerCase();
  return events.filter(
    (e) =>
      (e.title || "").toLowerCase().includes(term) ||
      (e.message || e.context || "").toLowerCase().includes(term)
  );
}, [events, eventSearch]);


  useEffect(() => {
    const fetchTeacherContent = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        // ⚠️ Assure-toi que ces endpoints renvoient SEULEMENT le contenu du teacher
        const [conceptsRes, missionsRes, eventsRes] = await Promise.all([
          api.getCustomConcepts(userId),        // Doit filtrer par teacher_id
          api.getCustomMissions(userId),  // Doit filtrer par teacher_id
          api.getCustomEvents(userId),      // Doit filtrer par teacher_id
        ]);
        setConcepts(Array.isArray(conceptsRes) ? conceptsRes : []);
        setMissions(Array.isArray(missionsRes) ? missionsRes : []);
        setEvents(Array.isArray(eventsRes) ? eventsRes : []);
      } catch (err) {
        console.error("Erreur lors du chargement du contenu", err);
        setConcepts([]);
        setMissions([]);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherContent();
  }, [userId]);

  // 🟢 Empty State
  const EmptyState = ({ type, onAdd }) => (
    <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
      <div className="inline-flex p-3 bg-gray-200 rounded-full mb-4">
        {type === "concept" ? (
          <BookOpen className="h-6 w-6 text-gray-600" />
        ) : (
          <Target className="h-6 w-6 text-gray-600" />
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        Aucun{type === "concept" ? "" : "e"} {type === "concept" ? "concept" : "mission"} créé{type === "concept" ? "" : "e"}
      </h3>
      <p className="text-gray-600 mb-4 max-w-md mx-auto">
        {type === "concept"
          ? "Créez des concepts clés que vos élèves devront maîtriser."
          : "Concevez des missions interactives basées sur vos concepts."}
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        <Plus className="h-4 w-4 mr-1" />
        Créer un{type === "concept" ? "" : "e"} {type === "concept" ? "concept" : "mission"}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold text-gray-900">Conception pédagogique</h1>
        </div>
        <div className="card animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
        <div className="card animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conception pédagogique</h1>
          <p className="text-gray-600 mt-1">
            Créez et gérez vos concepts et missions personnalisés.
          </p>
        </div>
        <Link
          to="/teacher/dashboard"
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          ← Tableau de bord
        </Link>
      </div>

      {/* Concepts Section */}
      <section className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Concepts</h2>
          <button
            onClick={() => setShowConceptForm(!showConceptForm)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            {showConceptForm ? "Annuler" : "Nouveau concept"}
          </button>
        </div>

        {showConceptForm ? (
          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <ConceptForm teacherId={userId} />
          </div>
        ) : concepts.length > 0 ? (
          <>
            {/* Barre de recherche */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={conceptSearch}
                onChange={(e) => setConceptSearch(e.target.value)}
                placeholder="Rechercher un concept..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Liste complète */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredConcepts.map((concept) => (
                <div
                  key={concept.id || concept.nom}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <h4 className="font-medium text-gray-900">{concept.nom || concept.name || "Sans titre"}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {concept.description || "Aucune description"}
                  </p>
                </div>
              ))}
              {filteredConcepts.length === 0 && (
                <p className="text-gray-500 text-center py-4">Aucun concept trouvé.</p>
              )}
            </div>
          </>
        ) : (
          <EmptyState type="concept" onAdd={() => setShowConceptForm(true)} />
        )}
      </section>

      {/* Missions Section */}
      <section className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Missions</h2>
          <button
            onClick={() => setShowMissionForm(!showMissionForm)}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            {showMissionForm ? "Annuler" : "Nouvelle mission"}
          </button>
        </div>

        {showMissionForm ? (
          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <MissionForm teacherId={userId} />
          </div>
        ) : missions.length > 0 ? (
          <>
            {/* Barre de recherche */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={missionSearch}
                onChange={(e) => setMissionSearch(e.target.value)}
                placeholder="Rechercher une mission..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Liste complète */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredMissions.map((mission) => (
                <div
                  key={mission.id || mission.title}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <h4 className="font-medium text-gray-900">{mission.title || "Sans titre"}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {mission.contexte || mission.description || "Aucun contexte"}
                  </p>
                </div>
              ))}
              {filteredMissions.length === 0 && (
                <p className="text-gray-500 text-center py-4">Aucune mission trouvée.</p>
              )}
            </div>
          </>
        ) : (
          <EmptyState type="mission" onAdd={() => setShowMissionForm(true)} />
        )}
      </section>
      {/* Events Section */}
<section className="card">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold text-gray-900">Événements</h2>
    <button
      onClick={() => setShowEventForm(!showEventForm)}
      className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center"
    >
      <Plus className="h-4 w-4 mr-1" />
      {showEventForm ? "Annuler" : "Nouvel événement"}
    </button>
  </div>

  {showEventForm ? (
    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
      <EventCreationForm teacherId={userId} />
    </div>
  ) : events.length > 0 ? (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={eventSearch}
          onChange={(e) => setEventSearch(e.target.value)}
          placeholder="Rechercher un événement..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {filteredEvents.map((event) => (
          <div
            key={event.id || event.title}
            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <h4 className="font-medium text-gray-900">{event.title || "Sans titre"}</h4>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {event.message || event.context || "Aucun message"}
            </p>
          </div>
        ))}
        {filteredEvents.length === 0 && (
          <p className="text-gray-500 text-center py-4">Aucun événement trouvé.</p>
        )}
      </div>
    </>
  ) : (
    <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
      <div className="inline-flex p-3 bg-gray-200 rounded-full mb-4">
        <Calendar className="h-6 w-6 text-gray-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun événement créé</h3>
      <p className="text-gray-600 mb-4 max-w-md mx-auto">
        Créez des événements que vos missions peuvent déclencher.
      </p>
      <button
        onClick={() => setShowEventForm(true)}
        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        <Plus className="h-4 w-4 mr-1" />
        Créer un événement
      </button>
    </div>
  )}
</section>

    </div>
  );
};

export default LearningDesignPage;