// src/components/StudentSidebar.jsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Home, BookOpen, BarChart3, LogOut } from "lucide-react";

export default function StudentSidebar() {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  const navItems = [
    { icon: Home, label: "Accueil", path: "/dashboard" },
    { icon: BookOpen, label: "Apprentissage", path: "/dashboard" },
    { icon: BarChart3, label: "Mon état", path: "/student/status" },
    { icon: LogOut, label: "Déconnexion", path: "/logout" },
  ];

  return (
    <div 
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isExpanded ? "w-64" : "w-16"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        {isExpanded ? (
          <h1 className="text-xl font-bold text-gray-900">ECOLeadGame</h1>
        ) : (
          <div className="text-lg font-bold text-gray-900">E</div>
        )}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-3 rounded-lg transition-colors group mb-1 ${
                isActive 
                  ? "bg-primary-100 text-primary-700" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {/* Icon (always visible, larger in collapsed state) */}
              <div className="flex-shrink-0 w-10 text-center">
                <Icon 
                  className={`w-6 h-6 mx-auto transition-transform ${
                    isExpanded ? "scale-100" : "scale-110"
                  }`} 
                />
              </div>

              {/* Label (only in expanded) */}
              {isExpanded && (
                <span className="ml-4 font-medium">{item.label}</span>
              )}

              {/* Optional: Hover tooltip when collapsed */}
              {!isExpanded && (
                <div className="absolute left-16 bg-gray-800 text-white text-sm rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}