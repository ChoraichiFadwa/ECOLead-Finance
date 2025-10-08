// components/EventLibrarySection.jsx

import React, { useState, useEffect, useMemo } from "react";
import { Globe, Search, Calendar, TrendingUp, AlertTriangle, X } from "lucide-react";
import EventContextCard from "./EventContextCard";
import { api } from "../utils/api";

const EventLibrarySection = ({ studentId }) => {
  const [allEvents, setAllEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Types d'événements basés sur ton flowchart
  const EVENT_TYPES = {
    all: { label: "Tous", icon: Globe, color: "gray" },
    Historique: { label: "Historique", icon: Calendar, color: "blue" },
    Macro: { label: "Macro", icon: TrendingUp, color: "purple" },
    Contemporain: { label: "Contemporain", icon: AlertTriangle, color: "red" },
    "Politique monétaire": { label: "Politique monétaire", icon: TrendingUp, color: "green" },
    Marchés: { label: "Marchés", icon: TrendingUp, color: "indigo" },
    Banking: { label: "Banking", icon: TrendingUp, color: "yellow" },
    Réglementation: { label: "Réglementation", icon: TrendingUp, color: "cyan" },
    Innovation: { label: "Innovation", icon: TrendingUp, color: "pink" },
    Souverain: { label: "Souverain", icon: TrendingUp, color: "orange" },
    Géopolitique: { label: "Géopolitique", icon: AlertTriangle, color: "red" }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.getAllEvents();
        setAllEvents(response);
      } catch (err) {
        console.error("Erreur chargement événements:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Filtrage avec useMemo pour optimisation
  const filteredEvents = useMemo(() => {
    let filtered = allEvents;

    // Filtre par type
    if (selectedType !== "all") {
      filtered = filtered.filter(e => e.context?.type === selectedType);
    }

    // Filtre par recherche
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.title?.toLowerCase().includes(searchLower) ||
        e.message?.toLowerCase().includes(searchLower) ||
        e.id?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [allEvents, selectedType, searchTerm]);

  // Compter événements par type
  const eventCounts = useMemo(() => {
    const counts = { all: allEvents.length };
    Object.keys(EVENT_TYPES).forEach(type => {
      if (type !== "all") {
        counts[type] = allEvents.filter(e => e.context?.type === type).length;
      }
    });
    return counts;
  }, [allEvents]);

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec recherche intégrée */}
      <div className="card">
        <div className="flex flex-col space-y-4">
          {/* Titre et compteur */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-full">
                <Globe className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Événements Stratégiques
                </h3>
                <p className="text-sm text-gray-600">
                  {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''}
                  {selectedType !== "all" && ` · ${EVENT_TYPES[selectedType]?.label}`}
                </p>
              </div>
            </div>

            {/* Barre de recherche compacte à droite */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filtres par type - Tags horizontaux */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(EVENT_TYPES).map(([key, config]) => {
              const count = eventCounts[key] || 0;
              const isActive = selectedType === key;
              
              return (
                <button
                  key={key}
                  onClick={() => setSelectedType(key)}
                  disabled={count === 0 && key !== "all"}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md scale-105'
                      : count > 0
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {config.label}
                  {count > 0 && (
                    <span className={`ml-1.5 ${isActive ? 'text-indigo-200' : 'text-gray-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Résultats */}
      {filteredEvents.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun événement trouvé
          </h4>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? `Aucun résultat pour "${searchTerm}"`
              : `Aucun événement dans la catégorie "${EVENT_TYPES[selectedType]?.label}"`
            }
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedType("all");
            }}
            className="btn-outline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => {
            const eventType = event.context?.type || "all";
            const typeConfig = EVENT_TYPES[eventType] || EVENT_TYPES.all;
            const IconComponent = typeConfig.icon;

            return (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="card cursor-pointer hover:shadow-xl transition-all duration-200 group relative overflow-hidden"
              >
                {/* Type badge */}
                <div className="absolute top-3 right-3 z-10">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                    {typeConfig.label}
                  </span>
                </div>

                {/* Icon background */}
                <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
                  <IconComponent className="h-32 w-32 text-gray-900" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h4 className="font-semibold text-gray-900 mb-2 pr-20 group-hover:text-indigo-600 transition">
                    {event.title || event.id}
                  </h4>
                  
                  {event.message && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {event.message}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>{event.date || event.context?.period || 'Récent'}</span>
                    </div>
                    <span className="text-indigo-600 font-medium group-hover:underline">
                      Voir détails →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'événement */}
      <EventContextCard
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        region="MENA/Maroc"
      />
    </div>
  );
};

export default EventLibrarySection;