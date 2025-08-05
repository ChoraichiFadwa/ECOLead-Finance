# 🎮 ECOLea Game

## 📌 Overview

This platform is a gamified educational system where **students** progress through structured **missions**, grouped by **concepts** and organized by **difficulty levels**. It includes a React frontend and a FastAPI backend, with future extensions planned for teacher analytics, XP-based progression, and content enrichment.

---

## 👤 User Roles

| Role     | Abilities                                            |
|----------|------------------------------------------------------|
| Student  | Browse concepts, launch missions, view progression   |
| Teacher  | (Planned) View student metrics, manage content       |

Role is selected on first visit and stored locally. Role-based access is enforced in routing and backend endpoints.

---

## 🧠 Core Concepts

| Term       | Meaning |
|------------|---------|
| **Concept** | A thematic learning area (e.g., "Financement", "Stratégie") |
| **Mission** | A scenario-based learning unit tied to one concept and one difficulty level |
| **Level**   | One of `Débutant`, `Intermédiaire`, `Avancé` — missions unlock progressively per concept |

---

## 🖥️ Tech Stack

| Layer     | Stack         |
|-----------|---------------|
| Frontend  | React + Vite + Tailwind |
| Backend   | FastAPI + Pydantic |
| Storage   | JSON (data layer), SQL planned |
| Routing   | `react-router-dom`, protected by `RoleContext` |

---

## 📚 Frontend Routes

| Path                   | Description                         | Access     |
|------------------------|-------------------------------------|------------|
| `/`                    | Role selection page                 | Public     |
| `/dashboard`           | Student or Teacher dashboard        | Protected  |
| `/concepts`            | Concept library (list of concepts)  | Student    |
| `/concept/:conceptId`  | List of missions in that concept    | Student    |
| `/mission/:missionId`  | Mission player view                 | Student    |

Navigation is protected via `useRole()` and redirects unauthorized users.

---

## 🔄 API Endpoints

| Method | Path                                           | Description                              |
|--------|------------------------------------------------|------------------------------------------|
| GET    | `/api/students/{student_id}/progress`          | Get full progression per student         |
| GET    | `/api/students/{student_id}/concepts/{concept_id}/progress` | Missions completed in one concept |
| GET    | `/api/students/{student_id}/next-mission`      | Compute and return next mission to launch |
| POST   | `/api/students/{student_id}/complete`          | Mark a mission as completed              |
| GET    | `/api/concepts`                                | Get list of all concepts                 |
| GET    | `/api/concepts/{concept_id}`                   | Get metadata and missions of one concept |
| GET    | `/api/missions/{mission_id}`                   | Get data for a mission                   |

---

## 🗃️ Data Model (JSON-based)

### 📁 Concepts

```json
"stratégie": {
  "nom": "stratégie",
  "description": "Progression sur le concept : stratégie",
  "missions": {
    "intermédiaire": [{ "id": "mission_fusion_acquisition_a" }],
    "avancé": [{ "id": "mission_expansion_i_fadwa" }]
  },
  "progression": 0
}
```

### 📁 Missions

```json
"mission_fusion_acquisition_a": {
  "id": "mission_fusion_acquisition_a",
  "concept": "stratégie",
  "niveau": "intermédiaire",
  "contexte": "Une opportunité de M&A se présente dans le secteur {secteur}...",
  "choix": {
    "A": { "description": "...", "impact": { "cashflow": -30, "controle": -25 } },
    ...
  },
  "evenements_possibles": ["event_due_diligence_issue"]
}
```

---

## 🔐 Auth & Role Handling

- No login required yet (stored locally)
- RoleContext provides role and loading state globally
- Role is enforced on each route; unauthorized access redirects to `/`

---

## 🚧 Features in Development

- ✅ Mission completion and tracking
- ✅ Mission unlock logic by concept/level
- 🚧 Teacher dashboard
- 🚧 XP system
- 🚧 Prerequisites between concepts
- 🚧 Mini-quizzes before missions
- 🚧 Avatar and dashboard personalization

---

## 🌱 Suggested Extensions

### 📚 Content

| Feature              | Value |
|----------------------|-------|
| Concept prerequisites | Require completion of another concept |
| Tags and filters     | Categorize missions for discoverability |
| Learning paths       | Curated mission flows across concepts |
| Resource links       | Videos, articles linked to concepts |

### 🎮 Interactivity

| Feature       | Value |
|---------------|-------|
| XP system     | Gain points and unlock new missions |
| Achievements  | Rewards for milestones |
| Streaks       | Encourage daily usage |

### 📊 Analytics

| Feature               | Description |
|------------------------|-------------|
| Heatmaps of difficulty | Detect struggle points per student |
| Time spent             | Track engagement |
| Teacher insights       | Completion stats, failure patterns |

---

## 🧱 Developer Notes

- JSON is loaded from `game_data.json`, with flattened mission structure
- Progress is per student and per concept
- Backend models and routes are modular (`routes/progress.py`, `routes/missions.py`, etc.)

---

## 🛠 Project Setup

```bash
# Backend
cd backend
python main.py

# Frontend
cd frontend
npm install
npm run dev
```

---

## ✨ Credits

Built with ❤️ using FastAPI, React, and your brain.  
Design and game logic by **[Fadwa Choraichi]**.

---

## 📘 License
