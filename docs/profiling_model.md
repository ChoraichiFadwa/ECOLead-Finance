```mermaid

flowchart TD

    A[Raw Sequences] --> B[Extract Features]
    B --> C[Standardize Features: scaler.pkl]
    C --> D[Clustering with KMeans: kmeans.pkl]
    D --> E[Cluster Labels]

    E --> F[Decision Tree Explainer: tree_explainer.pkl]

    %% Saving phase
    C -. Save .-> SC[(scaler.pkl in Drive)]
    D -. Save .-> KM[(kmeans.pkl in Drive)]
    F -. Save .-> TR[(tree_explainer.pkl in Drive)]

    %% Loading phase
    SC -. Load .-> C2[Scaler Loaded]
    KM -. Load .-> D2[KMeans Loaded]
    TR -. Load .-> F2[Tree Loaded]

    %% Inference workflow
    A2[New Sequence] --> B2[Extract Features]
    B2 --> C2
    C2 --> D2
    D2 --> E2[Predicted Cluster]
    E2 --> F2
    F2 --> G[Explanation Rule]

