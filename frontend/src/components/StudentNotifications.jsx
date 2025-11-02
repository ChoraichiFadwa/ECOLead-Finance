// src/components/StudentNotifications.jsx
import { useEffect, useState, useRef } from "react"
import { Bell } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { api } from "../utils/api"

export default function StudentNotifications({studentId, onMissionSelect }) {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  
  // Fetch notifications on mount
  useEffect(() => {
    api.getNotifications(studentId).then(setNotifications).catch(console.error)
  }, [studentId])

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleNotificationClick = async (n) => {
    try {
      if (!n.is_read) {
        await api.markNotificationRead(n.id, studentId);
        setNotifications(prev =>
          prev.map(x => x.id === n.id ? { ...x, is_read: true } : x)
        );
      }
      if (n.target_mission_id) {
        // Instead of navigating
        onMissionSelect(n.target_mission_id);
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50 max-h-96 overflow-y-auto">
          {notifications.length === 0 && (
            <div className="p-4 text-gray-500 text-sm">Aucune notification</div>
          )}
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-3 cursor-pointer hover:bg-gray-100 ${!n.is_read ? "bg-gray-50 font-medium" : ""}`}
            >
              <div className="text-sm">{n.message}</div>
              <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
