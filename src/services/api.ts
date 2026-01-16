/**
 * 🌐 API Client - Service de connexion au backend FastAPI
 *
 * Gère la communication avec le backend SQLite pour :
 * - Tâches et projets
 * - Données de santé (poids, repas, hydratation)
 * - Sessions Pomodoro
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.detail || 'Erreur API' }
    }

    return { success: true, data }
  } catch (error) {
    console.error(`[API] Erreur ${endpoint}:`, error)
    return { success: false, error: 'Connexion au serveur impossible' }
  }
}

// ═══════════════════════════════════════════════════════════════
// TASKS API
// ═══════════════════════════════════════════════════════════════

export const tasksApi = {
  // Tasks
  getTasks: (projectId?: string, includeCompleted = true) =>
    fetchApi<{ tasks: any[]; count: number }>(
      `/api/tasks-db/tasks?${projectId ? `project_id=${projectId}&` : ''}include_completed=${includeCompleted}`
    ),

  getTask: (id: string) =>
    fetchApi<{ task: any }>(`/api/tasks-db/tasks/${id}`),

  createTask: (task: any) =>
    fetchApi<{ id: string }>('/api/tasks-db/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),

  updateTask: (id: string, updates: any) =>
    fetchApi<{ success: boolean }>(`/api/tasks-db/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteTask: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/tasks-db/tasks/${id}`, {
      method: 'DELETE',
    }),

  toggleTask: (id: string) =>
    fetchApi<{ completed: boolean }>(`/api/tasks-db/tasks/${id}/toggle`, {
      method: 'POST',
    }),

  bulkCreateTasks: (tasks: any[], projectId?: string) =>
    fetchApi<{ created: number; ids: string[] }>('/api/tasks-db/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({ tasks, project_id: projectId }),
    }),

  // Projects
  getProjects: (includeArchived = false) =>
    fetchApi<{ projects: any[]; count: number }>(
      `/api/tasks-db/projects?include_archived=${includeArchived}`
    ),

  createProject: (project: any) =>
    fetchApi<{ id: string }>('/api/tasks-db/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    }),

  updateProject: (id: string, updates: any) =>
    fetchApi<{ success: boolean }>(`/api/tasks-db/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteProject: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/tasks-db/projects/${id}`, {
      method: 'DELETE',
    }),

  bulkCreateProjects: (projects: any[]) =>
    fetchApi<{ created: number; ids: string[] }>('/api/tasks-db/projects/bulk', {
      method: 'POST',
      body: JSON.stringify({ projects }),
    }),

  // Categories
  getCategories: () =>
    fetchApi<{ categories: any[] }>('/api/tasks-db/categories'),

  createCategory: (category: any) =>
    fetchApi<{ id: string }>('/api/tasks-db/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    }),

  deleteCategory: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/tasks-db/categories/${id}`, {
      method: 'DELETE',
    }),

  // Pomodoro
  getPomodoros: (date?: string) =>
    fetchApi<{ sessions: any[] }>(
      `/api/tasks-db/pomodoro${date ? `?date=${date}` : ''}`
    ),

  createPomodoro: (session: any) =>
    fetchApi<{ id: string }>('/api/tasks-db/pomodoro', {
      method: 'POST',
      body: JSON.stringify(session),
    }),

  // Stats
  getTasksStats: () =>
    fetchApi<{ stats: any }>('/api/tasks-db/stats'),

  getDailyStats: (days = 7) =>
    fetchApi<{ stats: any[] }>(`/api/tasks-db/stats/daily?days=${days}`),

  getDashboard: () =>
    fetchApi<any>('/api/tasks-db/dashboard'),
}

// ═══════════════════════════════════════════════════════════════
// HEALTH API
// ═══════════════════════════════════════════════════════════════

export const healthApi = {
  // Weight
  getWeightEntries: (limit = 100) =>
    fetchApi<{ entries: any[]; count: number }>(
      `/api/health/weight?limit=${limit}`
    ),

  addWeightEntry: (entry: any) =>
    fetchApi<{ id: number }>('/api/health/weight', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),

  deleteWeightEntry: (id: number) =>
    fetchApi<{ success: boolean }>(`/api/health/weight/${id}`, {
      method: 'DELETE',
    }),

  getWeightStats: () =>
    fetchApi<{ stats: any }>('/api/health/weight/stats'),

  // Meals
  getMeals: (date?: string, limit = 100) =>
    fetchApi<{ meals: any[]; count: number }>(
      `/api/health/meals?${date ? `date=${date}&` : ''}limit=${limit}`
    ),

  getTodayMeals: () =>
    fetchApi<{ meals: any[]; nutrition: any }>('/api/health/meals/today'),

  addMeal: (meal: any) =>
    fetchApi<{ id: number }>('/api/health/meals', {
      method: 'POST',
      body: JSON.stringify(meal),
    }),

  deleteMeal: (id: number) =>
    fetchApi<{ success: boolean }>(`/api/health/meals/${id}`, {
      method: 'DELETE',
    }),

  getDailyNutrition: (date: string) =>
    fetchApi<{ nutrition: any }>(`/api/health/nutrition/${date}`),

  // Hydration
  addHydration: (entry: any) =>
    fetchApi<{ id: number }>('/api/health/hydration', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),

  getHydration: (date?: string) =>
    fetchApi<{ hydration: any }>(
      `/api/health/hydration${date ? `?date=${date}` : ''}`
    ),

  // Profile
  getHealthProfile: () =>
    fetchApi<{ profile: any }>('/api/health/profile'),

  updateHealthProfile: (profile: any) =>
    fetchApi<{ success: boolean }>('/api/health/profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    }),

  // Dashboard
  getHealthDashboard: () =>
    fetchApi<any>('/api/health/dashboard'),
}

// ═══════════════════════════════════════════════════════════════
// CONNECTION CHECK
// ═══════════════════════════════════════════════════════════════

export async function checkBackendConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    return response.ok
  } catch {
    return false
  }
}

// ═══════════════════════════════════════════════════════════════
// DATABASE HEALTH CHECK (pour affichage Hub)
// ═══════════════════════════════════════════════════════════════

// Types pour les nouvelles bases de données isolées
interface DbInfo {
  ok: boolean
  path: string
  error?: string | null
  size_kb: number
  last_modified: string | null
  // Tasks DB
  tasks?: number
  projects?: number
  // Health DB
  weight_entries?: number
  meals?: number
  // Learning DB
  concepts?: number
  vocabulary?: number
}

export interface DbHealthStatus {
  connected: boolean
  databases: {
    tasks: DbInfo
    health: DbInfo
    learning: DbInfo
  }
}

export async function checkDatabasesHealth(): Promise<DbHealthStatus | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/health/databases`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export { API_BASE_URL }
