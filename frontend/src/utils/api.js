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

  // Domains
  getDomains: async () => {
    const response = await fetch(`${API_BASE_URL}/domains/`)
    return handleResponse(response)
  },

  getDomainById: async (domainId) => {
    const response = await fetch(`${API_BASE_URL}/domains/${domainId}`)
    return handleResponse(response)
  },

  getConceptsByDomain: async (domainId) => {
    const response = await fetch(`${API_BASE_URL}/domains/${domainId}/concepts`)
    return handleResponse(response)
  },

  // Student Domain Progress
  getStudentDomainProgress: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/domain-progress`)
    return handleResponse(response)
  },

  updateConceptProgress: async (studentId, conceptId, progressData) => {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/concepts/${conceptId}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(progressData),
    })
    return handleResponse(response)
  },

  // Profile Management
  getUserProfile: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`)
    return handleResponse(response)
  },

  selectProfile: async (userId, profileType) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/select-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_type: profileType }),
    })
    return handleResponse(response)
  },

  getProfileRecommendation: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/profile-recommendation`)
    return handleResponse(response)
  },

  // Learning Flow
  getLearningStage: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/learning-stage`)
    return handleResponse(response)
  },

  checkFundamentalsCompletion: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/fundamentals-completion`)
    return handleResponse(response)
  },

  updateLearningStage: async (userId, stage) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/learning-stage`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    })
    return handleResponse(response)
  },

  // Specialized Learning Paths
  getSpecializedPath: async (userId, profileType) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/specialized-path/${profileType}`)
    return handleResponse(response)
  },

  getPathProgress: async (userId, pathId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/path-progress/${pathId}`)
    return handleResponse(response)
  },

  updatePathProgress: async (userId, pathId, progressData) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/path-progress/${pathId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(progressData),
    })
    return handleResponse(response)
  },

  getPathRecommendations: async (userId, pathId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/path-recommendations/${pathId}`)
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
}
