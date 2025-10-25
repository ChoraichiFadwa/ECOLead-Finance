// src/components/EventCreationForm.jsx
import React, { useState } from "react";
import { api } from "../utils/api"; // make sure api.createEvent exists

export default function EventCreationForm({ teacherId }) {
  const [eventForm, setEventForm] = useState({
    title: "",
    message: "",
    context: "",
    conditions: "",
    modifie_choix: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // handle input changes
  const handleEventChange = (e) => {
    setEventForm({ ...eventForm, [e.target.name]: e.target.value });
  };

  // form submission
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // simple validation
    if (!eventForm.title.trim() || !eventForm.message.trim()) {
      setError("Le titre et le message sont obligatoires.");
      setLoading(false);
      return;
    }

    try {
      // parse JSON fields
      const payload = {
        ...eventForm,
        conditions: eventForm.conditions ? JSON.parse(eventForm.conditions) : {},
        modifie_choix: eventForm.modifie_choix ? JSON.parse(eventForm.modifie_choix) : {},
      };

      // call backend
      const response = await api.createEvent(teacherId, payload);

      setMessage(`Événement "${response.title}" créé avec succès !`);

      // reset form
      setEventForm({
        title: "",
        message: "",
        context: "",
        conditions: "",
        modifie_choix: "",
      });
    } catch (err) {
      console.error(err);
      setError("❌ Échec de la création de l'événement. Vérifiez vos champs JSON.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleEventSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-700 rounded">{error}</div>}
      {message && <div className="p-3 bg-green-50 text-green-700 rounded">{message}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700">Titre *</label>
        <input
          type="text"
          name="title"
          value={eventForm.title}
          onChange={handleEventChange}
          placeholder="Ex: Panne électrique"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Message *</label>
        <textarea
          name="message"
          value={eventForm.message}
          onChange={handleEventChange}
          placeholder="Message affiché à l'utilisateur"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Contexte</label>
        <textarea
          name="context"
          value={eventForm.context}
          onChange={handleEventChange}
          placeholder="Contexte ou description"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Conditions (JSON)
        </label>
        <textarea
          name="conditions"
          value={eventForm.conditions}
          onChange={handleEventChange}
          placeholder='Ex: {"cashflow":1,"stress":2}'
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Modifie Choix (JSON)
        </label>
        <textarea
          name="modifie_choix"
          value={eventForm.modifie_choix}
          onChange={handleEventChange}
          placeholder='Ex: {"A":{"cashflow":2},"B":{"stress":1}}'
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={2}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
      >
        {loading ? "Création en cours..." : "Créer l'événement"}
      </button>
    </form>
  );
}
