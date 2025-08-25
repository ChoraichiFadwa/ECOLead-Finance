```mermaid
%%{init: {"theme": "default", "themeVariables": { "fontSize": "14px"}, "logLevel": "debug"}}%%

graph LR

%% Profiles
P1["Profil 1"]
P2["Profil 2"]
P3["Profil 3"]

%% Concepts for Profil 1
C1["Marché Boursier"]
C2["Marché des Changes"]

%% Missions Marché Boursier
M1["Découvrir le marché boursier"]
M2["Premier choix stratégique"]
M3["Lire les cycles boursiers"]
M4["ETF et les fonds indiciels"]
M5["Produits dérivés et stratégies avancées"]

%% Missions Marché des Changes
M6["Découvrir le marché des changes"]
M7["Premier choix des changes"]
M8["Lire les taux d'intérêt"]
M9["Stratégies avancées sur obligations"]

%% Concepts for Profil 2
C3["Finance d'entreprise"]
C4["Évaluation d’entreprise"]
C5["Finance Sectorielle"]

%% Missions Finance d'entreprise
M10["Découvrir la finance d'entreprise"]
M11["Premier choix de financement"]
M12["Simulation de levée de fonds"]
M13["Optimisation du WACC"]

%% Missions Évaluation d’entreprise
M14["Découvrir les méthodes d’évaluation"]
M15["Évaluation simplifiée d’une PME"]
M16["Analyse de sensibilité"]
M17["Investissements R&D"]

%% Missions Finance Sectorielle
M18["Introduction aux secteurs"]
M19["Analyse sectorielle"]
M20["Projection stratégique sectorielle"]

%% Concepts for Profil 3
C6["Gestion de Trésorerie & Financement"]
C7["Gestion des Risques Transactionnels"]

%% Missions Gestion de Trésorerie
M21["Plan de trésorerie simplifié"]
M22["Arbitrage dette vs equity"]

%% Missions Gestion des Risques
M23["Identifier un risque de crédit dans une opération"]
M24["Évaluer un risque de transaction M&A"]
M25["Structurer une opération avec gestion intégrée des risques"]

%% Links
P1 --> C1 --> M1 & M2 & M3 & M4 & M5
P1 --> C2 --> M6 & M7 & M8 & M9
P2 --> C3 --> M10 & M11 & M12 & M13
P2 --> C4 --> M14 & M15 & M16 & M17
P2 --> C5 --> M18 & M19 & M20
P3 --> C6 --> M21 & M22
P3 --> C7 --> M23 & M24 & M25
