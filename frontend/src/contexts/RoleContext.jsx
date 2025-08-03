import { createContext, useContext, useState, useEffect } from "react"

const RoleContext = createContext()

export const RoleProvider = ({ children }) => {
  const [role, setRoleState] = useState(null)
  const [userId, setUserIdState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedRole = localStorage.getItem("role")
    const storedUserId = localStorage.getItem("userId")

    if ((storedRole === "student" || storedRole === "teacher") && storedUserId) {
      setRoleState(storedRole)
      setUserIdState(Number.parseInt(storedUserId))
    }
    setLoading(false)
  }, [])

  const setRole = (newRole, newUserId) => {
    setRoleState(newRole)
    setUserIdState(newUserId)

    if (newRole && newUserId) {
      localStorage.setItem("role", newRole)
      localStorage.setItem("userId", newUserId.toString())
    } else {
      localStorage.removeItem("role")
      localStorage.removeItem("userId")
    }
  }

  const logout = () => {
    setRole(null, null)
  }

  return <RoleContext.Provider value={{ role, userId, setRole, logout, loading }}>{children}</RoleContext.Provider>
}

export const useRole = () => {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}
