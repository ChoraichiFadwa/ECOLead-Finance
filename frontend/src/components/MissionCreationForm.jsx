// src/components/MissionCreationForm.jsx
import React, { useState, useEffect } from "react";
import { api } from "../utils/api";

const LEVEL_OPTIONS = ["débutant", "intermédiaire", "avancé"];
const INITIAL_CHOICES = ["A", "B"];

export default function MissionForm({ teacherId }) {
  const [concepts, setConcepts] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [form, setForm] = useState({
    title: "",
    concept: "",
    level: "débutant",
    type: "",
    contexte: "",
    objectif_pedagogique: "",
    choix: {
      A: { description: "", impact: { cashflow: 0, rentabilite: 0, reputation: 0, stress: 0, controle: 0 } },
      B: { description: "", impact: { cashflow: 0, rentabilite: 0, reputation: 0, stress: 0, controle: 0 } },
    },
    variables_affectees: "",
    tags: "",
  });

  const [choix, setChoix] = useState({
    A: { description: "", impact: { cashflow: 0, rentabilite: 0, reputation: 0, stress: 0, controle: 0 }, feedback: "" },
    B: { description: "", impact: { cashflow: 0, rentabilite: 0, reputation: 0, stress: 0, controle: 0 }, feedback: "" },
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        const data = await api.getConcepts();
        setConcepts(data);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les concepts");
      }
    };
    const fetchEvents = async () => {
      try {
        const data = await api.getAllEvents();
        setAllEvents(Array.isArray(data) ? data : (data.events || []));
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les événements");
      }
    };
    fetchEvents();
    fetchConcepts();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImpactChange = (choiceKey, field, delta) => {
    setChoix({
      ...choix,
      [choiceKey]: {
        ...choix[choiceKey],
        impact: {
          ...choix[choiceKey].impact,
          [field]: choix[choiceKey].impact[field] + delta,
        },
      },
    });
  };

  const handleDescriptionChange = (choiceKey, value) => {
    setChoix({ ...choix, [choiceKey]: { ...choix[choiceKey], description: value } });
  };

  const handleFeedbackChange = (choiceKey, value) => {
    setChoix({ ...choix, [choiceKey]: { ...choix[choiceKey], feedback: value } });
  };

  const addChoice = () => {
    const existingKeys = Object.keys(choix);
    const nextChar = String.fromCharCode(existingKeys[existingKeys.length - 1].charCodeAt(0) + 1);
    setChoix({
      ...choix,
      [nextChar]: { 
        description: "", 
        impact: { cashflow: 0, rentabilite: 0, reputation: 0, stress: 0, controle: 0 }, 
        feedback: "" 
      },
    });
  };

  const handleEventToggle = (eventId) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.concept || !form.level || !form.type.trim() || !form.contexte.trim() || !form.objectif_pedagogique.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const payload = {
      ...form,
      variables_affectees: form.variables_affectees.split(",").map(v => v.trim()).filter(Boolean),
      tags: form.tags.split(",").map(v => v.trim()).filter(Boolean),
      evenements_possibles: selectedEvents,
      choix: Object.fromEntries(
        Object.entries(choix).map(([key, val]) => [key, { description: val.description, impact: val.impact }])
      ),
      feedback: Object.fromEntries(Object.entries(choix).map(([key, val]) => [key, val.feedback])),
    };

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await api.createMission(teacherId, payload);
      setMessage(`Mission "${response.title}" créée avec succès !`);
      // Reset form
      setForm({
        title: "",
        concept: "",
        level: "débutant",
        type: "",
        contexte: "",
        objectif_pedagogique: "",
        variables_affectees: "",
        tags: "",
      });
      setChoix(INITIAL_CHOICES.reduce((acc, key) => {
        acc[key] = { description: "", impact: { cashflow: 0, rentabilite: 0, reputation: 0, stress: 0, controle: 0 }, feedback: "" };
        return acc;
      }, {}));
      setSelectedEvents([]);
    } catch (err) {
      console.error(err);
      setError("❌ Échec de la création. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get event title safely
  const getEventTitle = (evt) => evt.title || evt.nom || evt.name || evt.id || "Événement sans titre";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Feedback Messages */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
          {message}
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre de la mission *
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ex: Décider d'un investissement"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <input
            type="text"
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ex: Investissement, Gestion de crise..."
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contexte *
        </label>
        <textarea
          name="contexte"
          value={form.contexte}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows={3}
          placeholder="Décrivez la situation dans laquelle l'élève se trouve..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Objectif pédagogique *
        </label>
        <textarea
          name="objectif_pedagogique"
          value={form.objectif_pedagogique}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows={2}
          placeholder="Quel concept ou compétence l'élève doit-il mobiliser ?"
          required
        />
      </div>

      {/* Concept & Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Concept *
          </label>
          <select
            name="concept"
            value={form.concept}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="">Sélectionnez un concept</option>
            {concepts.map((c, idx) => (
              <option key={c.id || c.nom || idx} value={c.nom || c.name || c.id}>
                {c.nom || c.name || c.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Niveau *
          </label>
          <select
            name="level"
            value={form.level}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          >
            {LEVEL_OPTIONS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Selector - Improved UX */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Événements possibles
        </label>
        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-gray-50">
          {allEvents.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun événement disponible</p>
          ) : (
            allEvents.map((evt) => {
              const id = evt.id || evt.nom || evt.name || evt.title;
              return (
                <label
                  key={id}
                  className={`flex items-center p-2 rounded cursor-pointer ${
                    selectedEvents.includes(id)
                      ? "bg-primary-100 border border-primary-200"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(id)}
                    onChange={() => handleEventToggle(id)}
                    className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{getEventTitle(evt)}</span>
                </label>
              );
            })
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Cochez les événements que cette mission peut déclencher.
        </p>
      </div>

      {/* Variables & Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Variables affectées (séparées par des virgules)
          </label>
          <input
            type="text"
            name="variables_affectees"
            value={form.variables_affectees}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="cashflow, stress, reputation..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (séparés par des virgules)
          </label>
          <input
            type="text"
            name="tags"
            value={form.tags}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="finance, risque, éthique..."
          />
        </div>
      </div>

      {/* Choices Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Choix et impacts
          </label>
          <button
            type="button"
            onClick={addChoice}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            + Ajouter un choix
          </button>
        </div>

        <div className="space-y-4">
          {Object.entries(choix).map(([key, val]) => (
            <div key={key} className="p-4 border border-gray-200 rounded-lg bg-white">
              <h4 className="font-medium text-gray-900 mb-3">Choix {key}</h4>

              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={val.description}
                  onChange={(e) => handleDescriptionChange(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ex: Accepter le risque"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-2">Impacts</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(val.impact).map(([impactKey, impactVal]) => (
                    <div key={impactKey} className="flex flex-col items-center">
                      <span className="text-xs font-medium text-gray-700 capitalize mb-1">
                        {impactKey}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleImpactChange(key, impactKey, -1)}
                          className="w-6 h-6 flex items-center justify-center text-sm bg-gray-200 rounded hover:bg-gray-300"
                          disabled={loading}
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-mono">{impactVal}</span>
                        <button
                          type="button"
                          onClick={() => handleImpactChange(key, impactKey, 1)}
                          className="w-6 h-6 flex items-center justify-center text-sm bg-gray-200 rounded hover:bg-gray-300"
                          disabled={loading}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Feedback</label>
                <input
                  type="text"
                  value={val.feedback}
                  onChange={(e) => handleFeedbackChange(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Message affiché après le choix"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70"
        >
          {loading ? "Création en cours..." : "Créer la mission"}
        </button>
      </div>
    </form>
  );
}