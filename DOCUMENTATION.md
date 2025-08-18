# 📘 ECOLead Finance – Full Project Documentation

**Project:** Gamified Advanced Finance Learning Module  
**Organization:** CIIP, UM5R  
**Intern:** Fadwa Choraichi  
**Supervisor:** Salah Eddine Essebbar  
**Public:** Students of faculty of economy 

---

## 1. Introduction

ECOLead is a **serious game platform** designed to teach **advanced finance concepts** through **interactive missions**, **dynamic economic events**, and **AI-driven personalization**.

It targets **Bachelor and master level students** in finance and simulates real-world financial decision-making under uncertainty.

###  Core Vision
> *"The financial world is not just technical — it is deeply human and contextual."*

ECOLead bridges theory and practice by:
-  Personalizing learning via **specialized profiles**
-  Simulating **historical and macroeconomic events**
-  Using **AI (KMeans, DecisionTree)** for adaptive feedback
-  Gamifying progression with missions, levels, and metrics

---

## 2. Pedagogical Architecture

### 2.1 Learning Domains

The curriculum is structured around **7 financial domains**:

| Domain | Key Concepts |
|-------|-------------|
| **Corporate Finance** | Financing, valuation, governance |
| **Financial Markets** | Equity, bonds, derivatives, forex |
| **Risk Management** | VaR, hedging, compliance |
| **Treasury Management** | Cash flow, banking relationships |
| **Sectoral Finance** | Startups, sustainable finance |
| **Economic Environment** | Macroeconomics, international economy |
| **Strategic Finance** | M&A, investment, performance |
| **Financial Regulation** | M&A, investment, performance |

Each domain is broken into **concepts** and each concept has missions with **3 levels of complexity**:
- **Beginner**: Guided missions, clear feedback
- **Intermediate**: Multi-variable decisions, complex scenarios
- **Advanced**: Strategic optimization, high uncertainty

---

## 3. Specialized User Profiles

Students choose one of three **career-aligned tracks**, each with specific tools, competencies, and mission paths.

### 3.1 Portfolio Management
- **Focus**: Asset allocation, risk-return optimization
- **Key Tools**: CAPM, Markowitz, Bloomberg, VaR
- **Missions**: Diversification, stress testing, portfolio rebalancing

### 3.2 Technical Analysis
- **Focus**: Market timing, algorithmic trading
- **Key Tools**: RSI, MACD, backtesting, chart patterns
- **Missions**: Swing trading, breakout detection, flash crash response

### 3.3 Fundraising & Banking
- **Focus**: Startup valuation, due diligence, credit scoring
- **Key Tools**: DCF, term sheet, credit models, crowdfunding
- **Missions**: Seed round, IPO, SME credit approval

---

## 4. Mission System

### 4.1 Structure
Each mission is a **scenario-based decision game** with:
- Context (e.g., "A startup needs a Series A")
- 2–3 choices with financial impact
- Metrics update (cashflow, stress, reputation)
- SWOT reflection at the end

### 4.2 Data Model (JSON)
```json
"mission_valuation_a": {
  "id": "mission_valuation_a",
  "concept": "Évaluation& Investissement",
  "niveau": "intermédiaire",
  "contexte": "Une startup tech recherche une levée de fonds...",
  "choix": {
    "A": { "description": "Valorisation agressive", "impact": { "dilution": 40, "stress": 20 } },
    "B": { "description": "Valorisation conservatrice", "impact": { "dilution": 15, "score": 10 } }
  },
  "evenements_possibles": ["inflation", "crise_financiere"]
}
```
### Suggested structure : 
backend/
├─ main.py                    # App entrypoint
├─ database.py                # DB engine, Base, session
├─ config.py                  # Environment variables, settings (DB URL, secrets)
├─ models/                    # SQLAlchemy ORM models
│   ├─ __init__.py
│   ├─ user.py
│   ├─ progress.py
│   └─ profile.py
├─ schemas/                   # Pydantic models for request/response validation
│   ├─ __init__.py
│   ├─ user.py
│   ├─ progress.py
│   └─ mission.py
├─ routes/                    # API endpoints (FastAPI routers)
│   ├─ __init__.py
│   ├─ users.py
│   ├─ missions.py
│   ├─ progress.py
│   └─ analytics.py
├─ services/                  # Business/domain logic (non-route, non-DB helpers)
│   ├─ __init__.py
│   ├─ mission_evaluator.py   # Moves MissionEvaluator from utils here
│   └─ event_service.py       # Logic to check active events for a student
├─ utils/                     # Generic helper functions, reusable tools
│   ├─ __init__.py
│   └─ game_loader.py         # Pure JSON/data loading, no business logic
├─ data/                      # Static JSON files or other assets
│   ├─ missions.json
│   └─ events.json
├─ tests/                     # Unit and integration tests
│   ├─ __init__.py
│   └─ test_missions.py
├─ docs/                      # Documentation, diagrams, README extras
│   └─ models_diagram.md      # Mermaid UML / ER diagrams
└─ requirements.txt           # Dependencies

### Backend files :
Models 
user.py : User hierarchy
progress.py : All progress-related models.
profile.py : Profile enums + constants.

Utils 
evaluator 
game_loader
for future reference : 
move domain/business logic → services/, consider the event_actif to be in a service and mission evaluator too.
maybe add schemas to models for serializing 
Models → database logic

Schemas → API interface
Analogy:

Models are your DB blueprint.

Schemas are your API contract with the frontend.

services/user_service.py