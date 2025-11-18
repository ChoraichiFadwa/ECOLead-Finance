// src/components/Layout.jsx
import { useState } from "react";
import { useRole } from "../contexts/RoleContext";
import { useLocation, Link } from "react-router-dom";
import { 
  LogOut, 
  BookOpen, 
  Menu, 
  Home, 
  Users, 
  Target, 
  BarChart3, 
  BookOpen as BookOpenIcon, School
} from "lucide-react";

const Layout = ({ children }) => {
  const { role, logout, student } = useRole();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Student Navigation - Fixed: Apprentissage points to concepts page
  const studentSidebarItems = [
    { icon: Home, label: "Accueil", path: "/dashboard" },
    { icon: BookOpenIcon, label: "Apprentissage", path: "/concepts" }, // 👈 Changed
    { icon: BarChart3, label: "Mon état", path: "/student/status" },
    { icon: School, label: "Mes cours", path: "/student/classes" },
    { icon: LogOut, label: "Déconnexion", onClick: logout },
  ];

  // Teacher Navigation
  const teacherSidebarItems = [
    { icon: Home, label: "Accueil", path: "/teacher/dashboard" },
    { icon: Users, label: "Cours enseignés", path: "/teacher/students" },
    { icon: Target, label: "Contenu pédagogique", path: "/teacher/learning-design" },
    { icon: LogOut, label: "Déconnexion", onClick: logout },
  ];

  const sidebarItems = role === "student" ? studentSidebarItems : teacherSidebarItems;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div 
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          sidebarExpanded ? "w-64" : "w-16"
        }`}
      >
        {/* Logo Header */}
        <div className="p-4 border-b flex items-center justify-between">
          {sidebarExpanded ? (
            // Expanded: Show icon + full text
            <>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-primary-600" />
                <h1 className="text-lg font-bold text-gray-900">ECOLeadGame</h1>
              </div>
              <button 
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-5 h-5" />
              </button>
            </>
          ) : (
            // Collapsed: Show only Menu button centered
            <button 
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="text-gray-500 hover:text-gray-700 mx-auto"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <div
                key={index}
                onClick={item.onClick || undefined}
                className="relative"
              >
                <Link
                  to={item.path || "#"}
                  className={`flex items-center px-3 py-3 rounded-lg transition ${
                    isActive 
                      ? "bg-white text-primary-700 border-l-4 border-primary-500" // 👈 New style
                      : "text-gray-700 hover:bg-gray-100"
                  } ${!sidebarExpanded ? "justify-center" : ""}`}
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                  }}
                >
                  {/* Left accent (semi-circle) - only when active and expanded */}
                  {isActive && sidebarExpanded && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-4 bg-primary-500 rounded-r-full"></div>
                  )}
                  
                  {/* Icon with consistent sizing */}
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  
                  {/* Label only when expanded */}
                  {sidebarExpanded && <span className="ml-3">{item.label}</span>}
                </Link>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  );
};

export default Layout;