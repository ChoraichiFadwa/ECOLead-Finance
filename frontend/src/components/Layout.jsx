import { useRole } from "../contexts/RoleContext"
import { LogOut, User, BookOpen } from "lucide-react"

const Layout = ({ children }) => {
  const { role, logout } = useRole()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-primary-600" />
                <h1 className="text-xl font-bold text-gradient">ECOLeadGame</h1>
              </div>
              <div className="hidden sm:block">
                <span className="px-3 py-1 text-sm font-medium bg-primary-100 text-primary-800 rounded-full capitalize">
                  {role}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="h-5 w-5" />
                <span className="text-sm font-medium capitalize">{role} Tableau de bord</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}

export default Layout
