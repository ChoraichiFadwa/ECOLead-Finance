import { useNavigate } from "react-router-dom"
import { useRole } from "../contexts/RoleContext"
import { api } from "../utils/api"
import { 
  PieChart,    // Gestion de portefeuille
  TrendingUp,  // Lecture indicateurs
  Briefcase,   // Levée de fonds
  CheckCircle 
} from "lucide-react"

const profiles = [
  {
    id: 1,
    title: "Gestion de portefeuille boursier",
    blurb: "Apprenez à allouer des actifs, gérer le risque et maximiser la performance.",
    icon: PieChart,
    color: "from-blue-50 to-blue-100 border-blue-200",
    indicator: "blue-600",
  },
  {
    id: 2,
    title: "Lecture des indicateurs techniques",
    blurb: "Maîtrisez RSI, MACD, momentum et prenez des décisions basées sur les signaux.",
    icon: TrendingUp,
    color: "from-indigo-50 to-indigo-100 border-indigo-200",
    indicator: "indigo-600",
  },
  {
    id: 3,
    title: "Simulation de levée de fonds",
    blurb: "Explorez equity vs dette, dilution et calculez le coût du capital (WACC).",
    icon: Briefcase,
    color: "from-emerald-50 to-emerald-100 border-emerald-200",
    indicator: "emerald-600",
  },
]

export default function ChooseProfile() {
  const { userId, setProfile } = useRole()
  const navigate = useNavigate()

  const selectProfile = async (id) => {
    try {
      await api.setStudentProfile(userId, id)

      const label = profiles.find(p => p.id === id)?.title || "Profil inconnu"
      setProfile(id, label)

      navigate("/dashboard")
    } catch (err) {
      console.error("Échec de sélection du profil", err)
      alert("Une erreur est survenue. Veuillez réessayer.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="max-w-5xl w-full mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Choisissez votre parcours d’apprentissage
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Chaque profil vous oriente vers des missions adaptées à un domaine clé de la finance.
          </p>
        </div>

        {/* Profiles Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-8">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProfile(p.id)}
              className={`relative group p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:shadow-${p.indicator}/10 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-primary-300 bg-white ${p.color}`}
            >
              {/* Icon Circle */}
              <div className={`w-16 h-16 mx-auto mb-5 rounded-full bg-${p.indicator}/10 flex items-center justify-center text-${p.indicator} group-hover:scale-110 transition-transform`}>
                <p.icon className="h-8 w-8" />
              </div>

              {/* Title */}
              <h2 className="text-lg font-semibold text-gray-900 mb-3 text-center leading-tight">
                {p.title}
              </h2>

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed mb-6 text-center">
                {p.blurb}
              </p>

              {/* Hover CTA */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <span className={`bg-white text-${p.indicator} px-5 py-2 rounded-full font-medium text-sm shadow-md border border-${p.indicator}/20 pointer-events-auto transform scale-95 group-hover:scale-100 transition-transform`}>
                  Sélectionner ce profil
                </span>
              </div>

              {/* Subtle border highlight on hover */}
              <div className={`absolute inset-0 rounded-2xl border-2 border-transparent transition-colors duration-300 group-hover:border-${p.indicator}/30 pointer-events-none`}></div>
            </button>
          ))}
        </div>

        {/* Footer */}
        {/*<div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Vous pourrez modifier votre choix plus tard. Cela réinitialisera vos indicateurs de départ.
          </p>
        </div>*/}
      </div>
    </div>
  )
}