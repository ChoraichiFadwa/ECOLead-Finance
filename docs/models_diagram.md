```mermaid
classDiagram
    %% Base User class
    class User {
        +int id
        +string name
        +string email
        +UserRole role
        +datetime created_at
        +string type
        +Progress[] progress_records
        +MetricHistory[] metric_history
    }

    %% Student inherits User
    class Student {
        +string level_ai
        +int total_score
        +float cashflow
        +float controle
        +float stress
        +float rentabilite
        +float reputation
        +int profile
        +profile_label()
    }

    %% Teacher inherits User
    class Teacher {
    }

    %% Progress
    class Progress {
        +int id
        +int student_id
        +string mission_id
        +string concept
        +string level
        +JSON choices_made
        +int score_earned
        +int time_spent_seconds
        +datetime completed_at
        +float cashflow_after
        +float controle_after
        +float stress_after
        +float rentabilite_after
        +float reputation_after
    }

    %% MetricHistory
    class MetricHistory {
        +int id
        +int student_id
        +datetime recorded_at
        +float cashflow
        +float controle
        +float stress
        +float rentabilite
        +float reputation
        +int total_score
        +string mission_id
    }

    %% ConceptProgress
    class ConceptProgress {
        +int id
        +int student_id
        +string concept
        +int missions_completed
        +int total_missions
        +bool is_completed
        +datetime completed_at
    }

    %% ProfileType enum
    class ProfileType {
        <<enum>>
        Gestionnaire de Portefeuille = 1
        Analyste financier = 2
        Banquier d'affaires = 3
    }

    %% Relationships
    User <|-- Student
    User <|-- Teacher
    User "1" --> "*" Progress : progress_records
    User "1" --> "*" MetricHistory : metric_history
    User "1" --> "*" ConceptProgress : concept_progress
