// src/components/ConceptCreationForm.jsx
import React, { useState } from "react";
import { api } from "../utils/api";

const PROFILE_OPTIONS = [
  { label: "Gestionnaire de Portefeuille", value: 1 },
  { label: "Analyste financier", value: 2 },
  { label: "Banquier d'affaires", value: 3 },
];

export default function ConceptForm({ teacherId }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !description.trim() || profiles.length === 0) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await api.createConcept(teacherId, {
        name: name.trim(),
        description: description.trim(),
        profiles,
      });

      setMessage(`Concept "${response.name}" créé avec succès !`);
      setName("");
      setDescription("");
      setProfiles([]);
    } catch (err) {
      console.error(err);
      setError(" Échec de la création. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (value) => {
    setProfiles((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom du concept *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Ex: Gestion du risque"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows={3}
          placeholder="Expliquez brièvement ce que les élèves doivent comprendre..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profils concernés *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PROFILE_OPTIONS.map((profile) => (
            <label
              key={profile.value}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                profiles.includes(profile.value)
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={profiles.includes(profile.value)}
                onChange={() => handleProfileChange(profile.value)}
                className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">{profile.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70"
        >
          {loading ? "Création en cours..." : "Créer le concept"}
        </button>
      </div>
    </form>
  );
}