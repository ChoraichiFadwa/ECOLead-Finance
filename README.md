#  Serious Game

##  Overview

This platform is a gamified educational system where **students** progress through structured **missions**, grouped by **concepts** and organized by **difficulty levels**. It includes a React frontend and a FastAPI backend.
Currently in active development, the system supports **student progression tracking**, **concept-based learning**, and **adaptive mission unlocking**.

---

##  User Roles

| Role     | Status | Abilities |
|----------|--------|---------|
| **Student** | Implemented | Browse concepts, launch missions, track progress |
| **Teacher** | Implemented | View class analytics, monitor student progress, send feedback |

Role is selected on first visit and stored locally. Role-based access is enforced in routing and backend endpoints.
After that a student chosoes his role as student, he gets to choose what path to learn in, either it's ' Gestionnaire de portfeuille boursier', 'analyste financier' et 'Banquier d'affaires'.
Each cooncept is linked to a certain profile to personnalize the user experience.


Missions are grouped under **7 domains** and **3 specialized profiles** (see `DOCUMENTATION.md`).
---

##  Core Concepts

| Term       | Meaning |
|------------|---------|
| **Concept** | A thematic learning area (e.g., "Financement", "Stratégie") |
| **Mission** | A scenario-based learning unit tied to one concept and one difficulty level |
| **Level**   | One of `Débutant`, `Intermédiaire`, `Avancé` — missions unlock progressively per concept |

---

##  Tech Stack

| Layer     | Stack         |
|-----------|---------------|
| Frontend  | React + Vite + Tailwind |
| Backend   | FastAPI + Pydantic |
| Storage   | JSON (data layer), SQL planned |
| Routing   | `react-router-dom`, protected by `RoleContext` |

---

##  Frontend Routes

| Path                   | Description                         | Access     |
|------------------------|-------------------------------------|------------|
| `/`                    | Role selection page                 | Public     |
| `/dashboard`           | Student or Teacher dashboard        | Protected  |
| `/concepts`            | Concept library (list of concepts)  | Student    |
| `/concept/:conceptId`  | List of missions in that concept    | Student    |
| `/mission/:missionId`  | Mission player view                 | Student    |

Navigation is protected via `useRole()` and redirects unauthorized users.

---

##  API Endpoints

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

##  Data Model (JSON-based)

###  Concepts

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

###  Missions

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

##  Auth & Role Handling

- No login required yet (stored locally)
- RoleContext provides role and loading state globally
- Role is enforced on each route; unauthorized access redirects to `/`

---

###  Content

| Feature              | Value |
|----------------------|-------|
| Concept prerequisites | Require completion of another concept |
| Tags and filters     | Categorize missions for discoverability |
| Learning paths       | Curated mission flows across concepts |
| Resource links       | Videos, articles linked to concepts |





## 🛠 Project Setup

```bash
# Backend
cd backend
# (recommended) Create a virtual environment
python -m venv venv
# Activate it:
# On Linux/Mac
source venv/bin/activate
# On Windows
venv\Scripts\activate

# Install backend dependencies
pip install -r requirements.txt

# Run backend
python main.py

# Frontend
cd frontend
npm install
npm run dev
```

---

##  Credits

Built with ❤️ using FastAPI, React, and your brain.  
Design and game logic by **[Fadwa Choraichi]**.

---

## 📘 License
