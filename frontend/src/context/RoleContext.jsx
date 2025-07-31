import { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [role, setRoleState] = useState(null);
  const [loading, setLoading] = useState(true); // <- NEW

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    if (storedRole === 'student' || storedRole === 'teacher') {
      setRoleState(storedRole);
    }
    setLoading(false); // <- Mark as ready
  }, []);

  const setRole = (newRole) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem('role', newRole);
    } else {
      localStorage.removeItem('role');
    }
  };

  return (
    <RoleContext.Provider value={{ role, setRole, loading }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
