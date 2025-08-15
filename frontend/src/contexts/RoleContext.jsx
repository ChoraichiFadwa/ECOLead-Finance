import { createContext, useContext, useState, useEffect } from "react"

const RoleContext = createContext()

export const RoleProvider = ({ children }) => {
  const [role, setRoleState] = useState(null)
  const [userId, setUserIdState] = useState(null)
  const [profile, setProfileState] = useState(-1)           // ← New: current profile value (1, 2, 3, or -1)
  const [profileLabel, setProfileLabelState] = useState("Choisis un profil") // ← New: label for UI
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedRole = localStorage.getItem("role")
    const storedUserId = localStorage.getItem("userId")
    const storedProfile = localStorage.getItem("profile")
    const storedProfileLabel = localStorage.getItem("profileLabel")

    if ((storedRole === "student" || storedRole === "teacher") && storedUserId) {
      setRoleState(storedRole)
      setUserIdState(Number.parseInt(storedUserId))
    }
    // Restore profile if exists
    if (storedProfile !== null) {
      setProfileState(Number.parseInt(storedProfile))
    }
    if (storedProfileLabel) {
      setProfileLabelState(storedProfileLabel)
    }
    setLoading(false)
  }, [])

  const setRole = (newRole, newUserId, newProfile = null, newProfileLabel = null) => {
    setRoleState(newRole)
    setUserIdState(newUserId)
    // Only update profile if provided
    if (newProfile !== null) {
      setProfileState(newProfile)
      localStorage.setItem("profile", newProfile.toString())
    }
    if (newProfileLabel !== null) {
      setProfileLabelState(newProfileLabel)
      localStorage.setItem("profileLabel", newProfileLabel)
    }

    if (newRole && newUserId) {
      localStorage.setItem("role", newRole)
      localStorage.setItem("userId", newUserId.toString())
    } else {
      localStorage.removeItem("role")
      localStorage.removeItem("userId")
      localStorage.removeItem("profile")
      localStorage.removeItem("profileLabel")
    }
  }

  // New: separate setProfile (optional, but clean)
  const setProfile = (newProfile, newProfileLabel) => {
    setProfileState(newProfile)
    setProfileLabelState(newProfileLabel)
    localStorage.setItem("profile", newProfile.toString())
    localStorage.setItem("profileLabel", newProfileLabel)
  }

  const logout = () => {
    setRole(null, null)
  }

  return <RoleContext.Provider value={{ role, userId, setRole,profile, profileLabel,setProfile, logout, loading }}>{children}</RoleContext.Provider>
}

export const useRole = () => {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}
