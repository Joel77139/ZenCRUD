<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storageService, type Task, type Note } from './services/storageService'

// --- State ---
const isAuth = ref(false)
const username = ref('')
const currentView = ref<'tasks' | 'notes'>('tasks')
const isSyncing = ref(false)
const isLoading = ref(true)
const showDatePicker = ref(false)

const tasks = ref<Task[]>([])
const newTaskText = ref('')
const newTaskDueDate = ref('')
const newTaskPriority = ref<Task['priority']>('Media')
const editingId = ref<number | null>(null)
const editText = ref('')

const notes = ref<Note[]>([])
const newNoteTitle = ref('')
const newNoteContent = ref('')
const editingNoteId = ref<number | undefined | null>(null)
const editNoteTitle = ref('')
const editNoteContent = ref('')

const colors = ['#8b5cf6', '#38bdf8', '#10b981', '#f59e0b', '#ef4444']

// --- Initialization ---
onMounted(async () => {
  const savedUser = localStorage.getItem('zen-user')
  if (savedUser) {
    username.value = savedUser
    isAuth.value = true
    await loadData()
  }
  isLoading.value = false
})

const loadData = async () => {
  try {
    isSyncing.value = true
    tasks.value = await storageService.getTasks()
    notes.value = await storageService.getNotes()
  } catch (e) {
    console.error("Error al cargar datos:", e)
    alert("Error al cargar datos de Supabase. Revisa la consola.")
  } finally {
    isSyncing.value = false
  }
}

// --- Auth Functions ---
const login = async () => {
  if (username.value.trim()) {
    isAuth.value = true
    localStorage.setItem('zen-user', username.value)
    await loadData()
  }
}

const logout = () => {
  isAuth.value = false
  localStorage.removeItem('zen-user')
  username.value = ''
}

// --- Helpers ---
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

// --- Task Functions ---
const addTask = async () => {
  if (newTaskText.value.trim()) {
    isSyncing.value = true
    try {
      const newTask = await storageService.addTask({
        text: newTaskText.value.trim(),
        due_date: newTaskDueDate.value || undefined,
        priority: newTaskPriority.value
      })
      tasks.value.unshift(newTask)
      newTaskText.value = ''
      newTaskDueDate.value = ''
      newTaskPriority.value = 'Media'
      showDatePicker.value = false
    } catch (e) {
      console.error("Error al añadir tarea:", e)
      alert("No se pudo añadir la tarea. Posiblemente falta configurar RLS en Supabase.")
    } finally {
      isSyncing.value = false
    }
  }
}

const deleteTask = async (id: number) => {
  isSyncing.value = true
  try {
    await storageService.deleteTask(id)
    tasks.value = tasks.value.filter(t => t.id !== id)
  } finally {
    isSyncing.value = false
  }
}

const cycleStatus = async (task: Task) => {
  isSyncing.value = true
  try {
    const statusFlow: Task['status'][] = ['pendiente', 'en progreso', 'completada']
    const currentIndex = statusFlow.indexOf(task.status)
    const nextStatus = statusFlow[(currentIndex + 1) % statusFlow.length]
    
    await storageService.updateTask(task.id, { status: nextStatus })
    task.status = nextStatus
  } catch (e) {
    console.error("Error al cambiar estado:", e)
    alert("Hubo un error al actualizar el estado en Supabase.")
  } finally {
    isSyncing.value = false
  }
}

const startEdit = (task: Task) => {
  editingId.value = task.id
  editText.value = task.text
}

const saveEdit = async () => {
  const task = tasks.value.find(t => t.id === editingId.value)
  if (task && editText.value.trim()) {
    isSyncing.value = true
    try {
      await storageService.updateTask(task.id, { text: editText.value.trim() })
      task.text = editText.value.trim()
    } finally {
      isSyncing.value = false
    }
  }
  editingId.value = null
}

// --- Note Functions ---
const addNote = async () => {
  if (newNoteTitle.value.trim() || newNoteContent.value.trim()) {
    isSyncing.value = true
    try {
      const newNote = await storageService.addNote({
        title: newNoteTitle.value.trim() || 'Sin título',
        content: newNoteContent.value.trim(),
        color: colors[Math.floor(Math.random() * colors.length)]
      })
      notes.value.unshift(newNote)
      newNoteTitle.value = ''
      newNoteContent.value = ''
    } finally {
      isSyncing.value = false
    }
  }
}

const deleteNote = async (id: number) => {
  isSyncing.value = true
  try {
    await storageService.deleteNote(id)
    notes.value = notes.value.filter(n => n.id !== id)
  } finally {
    isSyncing.value = false
  }
}

const startEditNote = (note: Note) => {
  editingNoteId.value = note.id as number
  editNoteTitle.value = note.title
  editNoteContent.value = note.content
}

const saveEditNote = async () => {
  const note = notes.value.find(n => n.id === editingNoteId.value)
  if (note && note.id !== undefined) {
    isSyncing.value = true
    try {
      const title = editNoteTitle.value.trim() || 'Sin título'
      const content = editNoteContent.value.trim()
      await storageService.updateNote(note.id, { title, content })
      note.title = title
      note.content = content
    } finally {
      isSyncing.value = false
    }
  }
  editingNoteId.value = null
}
</script>

<template>
  <!-- PANTALLA DE CARGA -->
  <div v-if="isLoading && isAuth" class="login-screen">
    <div class="status-badge syncing">
      <span class="icon">⏳</span> Cargando tus datos...
    </div>
  </div>

  <!-- PANTALLA DE LOGIN -->
  <div v-else-if="!isAuth" class="login-screen">
    <div class="glass-card login-card">
      <h1>Bienvenido a ZenTask</h1>
      <p class="subtitle">Conectado a Supabase Realtime</p>
      <input v-model="username" @keyup.enter="login" placeholder="Tu nombre..." autofocus />
      <button @click="login" class="btn-primary" :disabled="!username.trim()">Entrar</button>
    </div>
  </div>

  <!-- APLICACIÓN PRINCIPAL -->
  <div v-else class="app-container">
    <header class="main-header">
      <div class="user-info">
        <span class="avatar">{{ username[0].toUpperCase() }}</span>
        <span>Hola, <strong>{{ username }}</strong>!</span>
      </div>
      <div class="status-badge" :class="{ syncing: isSyncing }">
        <span class="icon">{{ isSyncing ? '⏳' : '☁️' }}</span>
        {{ isSyncing ? 'Sincronizando...' : 'En la nube' }}
      </div>
      <button @click="logout" class="btn-logout">Salir</button>
    </header>

    <nav class="nav-tabs">
      <button :class="{ active: currentView === 'tasks' }" @click="currentView = 'tasks'">Tareas</button>
      <button :class="{ active: currentView === 'notes' }" @click="currentView = 'notes'">Notas</button>
    </nav>

    <div class="glass-card main-card">
      <!-- VIEW: TASKS -->
      <div v-if="currentView === 'tasks'" class="view-content">
        <div class="input-group">
          <input v-model="newTaskText" @keyup.enter="addTask" placeholder="¿Qué necesitas hacer hoy?" />
          <div class="input-row">
            <select v-model="newTaskPriority" class="priority-select">
              <option value="Alta">🔴 Alta</option>
              <option value="Media">🟠 Media</option>
              <option value="Baja">🔵 Baja</option>
            </select>
            <button @click="showDatePicker = !showDatePicker" class="btn-secondary" :class="{ active: showDatePicker }">
              {{ showDatePicker ? '📅 Quitar' : '📅 Plazo' }}
            </button>
            <input v-if="showDatePicker" type="date" v-model="newTaskDueDate" class="date-input" />
            <button @click="addTask" class="btn-primary" :disabled="isSyncing">Añadir</button>
          </div>
        </div>

        <ul class="task-list">
          <transition-group name="list">
            <li v-for="task in tasks" :key="task.id" class="task-item" :class="task.status">
              <div v-if="editingId === task.id" class="edit-mode">
                <input v-model="editText" @keyup.enter="saveEdit" autofocus />
                <button @click="saveEdit" class="btn-save">✓</button>
              </div>
              <div v-else class="view-mode">
                <div class="task-content">
                  <div class="status-toggle" @click="cycleStatus(task)" :title="'Estado: ' + task.status">
                    <div class="status-indicator"></div>
                    <span class="status-text">{{ task.status }}</span>
                  </div>
                  <div class="task-info">
                    <div class="task-header">
                      <span class="task-text">{{ task.text }}</span>
                      <span class="priority-badge" :class="task.priority.toLowerCase()">{{ task.priority }}</span>
                    </div>
                    <div class="task-dates">
                      <span class="date-tag created">📅 {{ formatDate(task.created_at) }}</span>
                      <span v-if="task.due_date" class="date-tag due">⏰ {{ formatDate(task.due_date) }}</span>
                    </div>
                  </div>
                </div>
                <div class="actions">
                  <button @click="startEdit(task)" class="btn-icon">✎</button>
                  <button @click="deleteTask(task.id)" class="btn-icon delete" :disabled="isSyncing">🗑</button>
                </div>
              </div>
            </li>
          </transition-group>
        </ul>
        <div v-if="tasks.length === 0 && !isSyncing" class="empty-state">No hay tareas pendientes.</div>
      </div>

      <!-- VIEW: NOTES -->
      <div v-else class="view-content">
        <div class="note-form input-group">
          <input v-model="newNoteTitle" placeholder="Título (opcional)" />
          <textarea v-model="newNoteContent" placeholder="Escribe tu nota aquí..."></textarea>
          <button @click="addNote" class="btn-primary" :disabled="isSyncing">Guardar Nota</button>
        </div>

        <div class="notes-grid">
          <transition-group name="list">
            <div v-for="note in notes" :key="note.id" class="note-card" :style="{ borderLeftColor: note.color }">
              <div v-if="editingNoteId === note.id" class="edit-note-mode">
                <input v-model="editNoteTitle" />
                <textarea v-model="editNoteContent"></textarea>
                <div class="edit-actions">
                  <button @click="saveEditNote" class="btn-save">✓</button>
                  <button @click="editingNoteId = null" class="btn-cancel">✕</button>
                </div>
              </div>
              <div v-else>
                <div class="note-header">
                  <h3>{{ note.title }}</h3>
                  <div class="actions">
                    <button @click="startEditNote(note)" class="btn-icon">✎</button>
                    <button v-if="note.id !== undefined" @click="deleteNote(note.id)" class="btn-icon delete" :disabled="isSyncing">🗑</button>
                  </div>
                </div>
                <p>{{ note.content }}</p>
              </div>
            </div>
          </transition-group>
        </div>
        <div v-if="notes.length === 0 && !isSyncing" class="empty-state">No hay notas guardadas.</div>
      </div>
    </div>
    
    <footer class="app-footer">
      ZenTask v1.1 • Conectado a Supabase Realtime 🚀
    </footer>
  </div>
</template>

<style scoped>
/* Login Screen */
.login-screen {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}
.login-card {
  width: 100%;
  max-width: 400px;
  text-align: center;
}
.login-card input { margin-bottom: 1.5rem; }

/* Main App Layout */
.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

.main-header {
  width: 100%;
  max-width: 500px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.5);
  padding: 0.75rem 1.25rem;
  border-radius: 1rem;
  border: 1px solid var(--glass-border);
  font-size: 0.9rem;
}

.user-info { display: flex; align-items: center; gap: 0.75rem; }
.avatar {
  width: 2rem; height: 2rem;
  background: var(--primary);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold;
}

.status-badge {
  display: flex; align-items: center; gap: 0.4rem;
  color: var(--text-muted);
  font-size: 0.8rem;
  transition: all 0.3s ease;
}
.status-badge.syncing { color: var(--accent); }

.btn-logout { background: transparent; color: #ef4444; font-size: 0.8rem; font-weight: 600; }

.nav-tabs {
  background: rgba(30, 41, 59, 0.5);
  padding: 0.5rem; border-radius: 1rem;
  border: 1px solid var(--glass-border);
  display: flex; gap: 0.5rem;
}
.nav-tabs button {
  padding: 0.5rem 1.5rem; border-radius: 0.75rem;
  color: var(--text-muted); font-weight: 600;
  background: transparent;
}
.nav-tabs button.active { background: var(--primary); color: white; }

.main-card { width: 100%; max-width: 500px; }

/* Components */
.input-group { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; }
.input-row { display: flex; gap: 0.75rem; }
.priority-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  color: white;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  flex: 1;
}

.btn-primary { background: var(--primary); color: white; padding: 0.75rem; border-radius: 0.75rem; font-weight: 600; flex: 1.5; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  padding: 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  border: 1px solid var(--glass-border);
  flex: 1;
}
.btn-secondary.active {
  background: rgba(139, 92, 246, 0.1);
  color: #a855f7;
  border-color: #a855f7;
}

.task-list { list-style: none; display: flex; flex-direction: column; gap: 1rem; }
.task-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: 1rem; padding: 1rem;
  transition: all 0.3s ease;
}
.task-content { display: flex; align-items: flex-start; gap: 1rem; cursor: pointer; flex: 1; }
.task-info { display: flex; flex-direction: column; gap: 0.4rem; width: 100%; }
.task-header { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.task-text { font-size: 1.05rem; }

.priority-badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
  border-radius: 2rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.priority-badge.alta { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
.priority-badge.media { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
.priority-badge.baja { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }

.task-dates { display: flex; gap: 0.75rem; }
.date-tag { font-size: 0.7rem; color: var(--text-muted); opacity: 0.8; display: flex; align-items: center; gap: 0.2rem; }
.date-tag.due { color: #f59e0b; opacity: 1; font-weight: 600; }
.status-toggle {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2rem;
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
  user-select: none;
}

.status-indicator {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--text-muted);
}

.status-text {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

/* Pendiente */
.task-item.pendiente .status-indicator { background: #a855f7; box-shadow: 0 0 10px rgba(168, 85, 247, 0.4); }
.task-item.pendiente .status-text { color: #a855f7; }

/* En Progreso */
.task-item.en.progreso .status-indicator { background: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.4); }
.task-item.en.progreso .status-text { color: #3b82f6; }

/* Completada */
.task-item.completada .status-indicator { background: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
.task-item.completada .status-text { color: #10b981; }
.task-item.completada span { text-decoration: line-through; opacity: 0.6; }

.notes-grid { display: flex; flex-direction: column; gap: 1rem; }
.note-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-left: 4px solid var(--primary);
  border-radius: 1rem; padding: 1.25rem;
}
.note-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
.note-card p { color: var(--text-muted); white-space: pre-wrap; font-size: 0.95rem; }

.actions { display: flex; gap: 0.5rem; }
.btn-icon { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); width: 2.25rem; height: 2.25rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; }
.btn-icon.delete:hover { color: #ef4444; }

.edit-mode, .edit-note-mode { display: flex; flex-direction: column; gap: 0.5rem; }
.btn-save { background: var(--primary); color: white; padding: 0.5rem; border-radius: 0.5rem; }

.app-footer { margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted); }

.empty-state { text-align: center; color: var(--text-muted); margin-top: 2rem; font-style: italic; }

/* Animations */
.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(20px); }
</style>
