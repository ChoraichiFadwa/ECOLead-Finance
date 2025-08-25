```mermaid

graph LR

%% Profil 1
P1["Profil 1"]

subgraph C1["Marché Boursier"]
  M1["Débutant: Découvrir le marché boursier"]
  M2["Débutant: Premier choix stratégique"]
  M3["Intermédiaire: Lire les cycles boursiers"]
  M4["Intermédiaire: ETF et fonds indiciels"]
  M5["Avancé: Produits dérivés et stratégies avancées"]
end

subgraph C2["Marché des Changes"]
  M6["Débutant: Découvrir le marché des changes"]
  M7["Débutant: Premier choix des changes"]
  M8["Intermédiaire: Lire les taux d'intérêt"]
  M9["Avancé: Stratégies avancées sur obligations"]
end

P1 --> C1
P1 --> C2

%% Profil 2
P2["Profil 2"]

subgraph C3["Finance d'entreprise"]
  M10["Débutant: Découvrir la finance d'entreprise"]
  M11["Débutant: Premier choix de financement"]
  M12["Intermédiaire: Simulation de levée de fonds"]
  M13["Avancé: Optimisation du WACC"]
end

subgraph C4["Évaluation d’entreprise"]
  M14["Débutant: Découvrir les méthodes d’évaluation"]
  M15["Débutant: Évaluation simplifiée d’une PME"]
  M16["Intermédiaire: Analyse de sensibilité"]
  M17["Avancé: Investissements R&D"]
end

subgraph C5["Finance Sectorielle"]
  M18["Débutant: Introduction aux secteurs"]
  M19["Intermédiaire: Analyse sectorielle"]
  M20["Avancé: Projection stratégique sectorielle"]
end

P2 --> C3
P2 --> C4
P2 --> C5

%% Profil 3
P3["Profil 3"]

subgraph C6["Gestion de Trésorerie & Financement"]
  M21["Débutant: Plan de trésorerie simplifié"]
  M22["Intermédiaire: Arbitrage dette vs equity"]
end

subgraph C7["Gestion des Risques Transactionnels"]
  M23["Débutant: Identifier un risque de crédit"]
  M24["Intermédiaire: Évaluer un risque M&A"]
  M25["Avancé: Structurer une opération avec gestion des risques"]
end

P3 --> C6
P3 --> C7
