const API_BASE_URL = "/api"

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(errorData.detail || "An error occurred", response.status)
  }
  return response.json()
}

export const api = {
  // Users
  createStudent: async (data) => {
    const response = await fetch(`${API_BASE_URL}/students/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  createTeacher: async (data) => {
    const response = await fetch(`${API_BASE_URL}/teachers/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  getStudent: async (id) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`)
    return handleResponse(response)
  },

  getTeacher: async (id) => {
    const response = await fetch(`${API_BASE_URL}/teachers/${id}`)
    return handleResponse(response)
  },

  getAllStudents: async () => {
    const response = await fetch(`${API_BASE_URL}/students/`)
    return handleResponse(response)
  },
  // profiles
  setStudentProfile: async (studentId, profileKey) => {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/profile?profile=${encodeURIComponent(profileKey)}`, {
      method: "POST",
    })
    return handleResponse(response)
  },

  getStudentProfile: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/profile`)
    return handleResponse(response)
  },

  // Missions
  getNextMission: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/next-mission`)
    return handleResponse(response)
  },

  submitMission: async (studentId, missionId, data) => {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/missions/${missionId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },
    getMissionsByConcept: async (conceptId) => {
    const response = await fetch(`${API_BASE_URL}/concepts/${encodeURIComponent(conceptId)}/missions`)
    return handleResponse(response)
  },
    getMissionById: async (missionId) => {
    const response = await fetch(`${API_BASE_URL}/missions/id/${missionId}`)
    return handleResponse(response)
  },


  // Get all concepts
getConcepts: async () => {
  const response = await fetch(`${API_BASE_URL}/concepts`);
  return handleResponse(response);
},


  // Progress
  getStudentProgress: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/progress`)
    return handleResponse(response)
  },

  getStudentChartData: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/chart-data`)
    return handleResponse(response)
  },

    getStudentConceptProgress: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/concept-progress`)
    return handleResponse(response)
  },
    getConceptProgress: async (studentId, conceptId) => {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/concepts/${conceptId}/progress`)
    return handleResponse(response)
  },



  // Teacher Analytics
  getTeacherDashboard: async (teacherId) => {
    const response = await fetch(`${API_BASE_URL}/teachers/${teacherId}/dashboard`)
    return handleResponse(response)
  },

  getStudentMetrics: async (teacherId, studentId) => {
    const response = await fetch(`${API_BASE_URL}/teachers/${teacherId}/students/${studentId}/metrics`)
    return handleResponse(response)
  },
  // Strategic Context
  getStrategicContext: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/strategy/students/${studentId}/strategic-context`)
    return handleResponse(response)
  },
  // Strategic Context
  getStrategicContext: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/strategy/students/${studentId}/strategic-context`)
    return handleResponse(response)
  },

  // Strategy Bundle (ton endpoint existant pour les missions recommandées)
  getStrategyBundle: async (studentId, goal, maxBundle = 3, conceptWhitelist = null) => {
    const params = new URLSearchParams({
      goal,
      max_bundle: maxBundle
    })
    if (conceptWhitelist && conceptWhitelist.length > 0) {
      params.append('concept_whitelist', conceptWhitelist.join(','))
    }
    const response = await fetch(`${API_BASE_URL}/strategy/students/${studentId}/suggest?${params}`)
    return handleResponse(response)
  },

  getAllEvents: async () => {
    const response = await fetch(`${API_BASE_URL}/events`);
    return handleResponse(response);
  },
  // Concept creation 
  createConcept: async (teacherId, data) => {
  const response = await fetch(`${API_BASE_URL}/teachers/${teacherId}/concepts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse(response)
},
// Mission creation
createMission: async (teacherId, data) => {
  const response = await fetch(`${API_BASE_URL}/teachers/${teacherId}/missions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
},
getCustomMissions: async (teacherId) => {
  const response = await fetch(`${API_BASE_URL}/teachers/${teacherId}/missions`)
  if (!response.ok) throw new Error("Failed to fetch missions")
  return response.json()
},
getCustomConcepts: async (teacherId) => {
  const response = await fetch(`${API_BASE_URL}/teachers/${teacherId}/concepts`)
  if (!response.ok) throw new Error("Failed to fetch concepts")
  return response.json()
}

}
