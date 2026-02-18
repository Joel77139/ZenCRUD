interface Task {
  id: number
  text: string
  completed: boolean
}

interface Note {
  id: number
  title: string
  content: string
  color: string
}

const TASKS_KEY = 'zen-tasks'
const NOTES_KEY = 'zen-notes'

export const storageService = {
  // --- Tasks ---
  getTasks(): Task[] {
    const data = localStorage.getItem(TASKS_KEY)
    return data ? JSON.parse(data) : []
  },

  saveTasks(tasks: Task[]): void {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  },

  // --- Notes ---
  getNotes(): Note[] {
    const data = localStorage.getItem(NOTES_KEY)
    return data ? JSON.parse(data) : []
  },

  saveNotes(notes: Note[]): void {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
  },

  // --- Cloud Sync Simulation ---
  async syncToCloud() {
    // Simula una latencia de red
    return new Promise((resolve) => setTimeout(resolve, 800))
  }
}
