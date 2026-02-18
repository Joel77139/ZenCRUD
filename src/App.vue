<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { storageService } from './services/storageService'

// --- Interfaces ---
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

// --- State ---
const isAuth = ref(false)
const username = ref('')
const currentView = ref<'tasks' | 'notes'>('tasks')
const isSyncing = ref(false)

const tasks = ref<Task[]>([])
const newTaskText = ref('')
const editingId = ref<number | null>(null)
const editText = ref('')

const notes = ref<Note[]>([])
const newNoteTitle = ref('')
const newNoteContent = ref('')
const editingNoteId = ref<number | null>(null)
const editNoteTitle = ref('')
const editNoteContent = ref('')

const colors = ['#8b5cf6', '#38bdf8', '#10b981', '#f59e0b', '#ef4444']

// --- Initialization ---
onMounted(() => {
  tasks.value = storageService.getTasks()
  notes.value = storageService.getNotes()
  
  const savedUser = localStorage.getItem('zen-user')
  if (savedUser) {
    username.value = savedUser
    isAuth.value = true
  }
})

// --- Persistence & Sync Simulation ---
watch([tasks, notes], async () => {
  isSyncing.value = true
  storageService.saveTasks(tasks.value)
  storageService.saveNotes(notes.value)
  
  // Simulamos el guardado en la nube (Supabase pre-check)
  await storageService.syncToCloud()
  isSyncing.value = false
}, { deep: true })

// --- Auth Functions ---
const login = () => {
  if (username.value.trim()) {
    isAuth.value = true
    localStorage.setItem('zen-user', username.value)
  }
}

const logout = () => {
  isAuth.value = false
  localStorage.removeItem('zen-user')
  username.value = ''
}

// --- Task Functions ---
const addTask = () => {
  if (newTaskText.value.trim()) {
    tasks.value.unshift({
      id: Date.now(),
      text: newTaskText.value.trim(),
      completed: false
    })
    newTaskText.value = ''
  }
}

const deleteTask = (id: number) => {
  tasks.value = tasks.value.filter(t => t.id !== id)
}

const toggleTask = (task: Task) => {
  task.completed = !task.completed
}

const startEdit = (task: Task) => {
  editingId.value = task.id
  editText.value = task.text
}

const saveEdit = () => {
  const task = tasks.value.find(t => t.id === editingId.value)
  if (task && editText.value.trim()) {
    task.text = editText.value.trim()
  }
  editingId.value = null
}

// --- Note Functions ---
const addNote = () => {
  if (newNoteTitle.value.trim() || newNoteContent.value.trim()) {
    notes.value.unshift({
      id: Date.now(),
      title: newNoteTitle.value.trim() || 'Sin título',
      content: newNoteContent.value.trim(),
      color: colors[Math.floor(Math.random() * colors.length)]
    })
    newNoteTitle.value = ''
    newNoteContent.value = ''
  }
}

const deleteNote = (id: number) => {
  notes.value = notes.value.filter(n => n.id !== id)
}

const startEditNote = (note: Note) => {
  editingNoteId.value = note.id
  editNoteTitle.value = note.title
  editNoteContent.value = note.content
}

const saveEditNote = () => {
  const note = notes.value.find(n => n.id === editingNoteId.value)
  if (note) {
    note.title = editNoteTitle.value.trim() || 'Sin título'
    note.content = editNoteContent.value.trim()
  }
  editingNoteId.value = null
}
</script>

<template>
  <!-- PANTALLA DE LOGIN MOCK -->
  <div v-if="!isAuth" class="login-screen">
    <div class="glass-card login-card">
      <h1>Bienvenido a ZenTask</h1>
      <p class="subtitle">Ingresa tu nombre para comenzar</p>
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
      <div v-if="currentView === 'tasks'" class="view-content">
        <div class="input-group">
          <input v-model="newTaskText" @keyup.enter="addTask" placeholder="¿Qué necesitas hacer hoy?" />
          <button @click="addTask" class="btn-primary">Añadir</button>
        </div>

        <ul class="task-list">
          <transition-group name="list">
            <li v-for="task in tasks" :key="task.id" class="task-item" :class="{ completed: task.completed }">
              <div v-if="editingId === task.id" class="edit-mode">
                <input v-model="editText" @keyup.enter="saveEdit" autofocus />
                <button @click="saveEdit" class="btn-save">✓</button>
              </div>
              <div v-else class="view-mode">
                <div class="task-content" @click="toggleTask(task)">
                  <div class="checkbox"><div v-if="task.completed" class="check"></div></div>
                  <span>{{ task.text }}</span>
                </div>
                <div class="actions">
                  <button @click="startEdit(task)" class="btn-icon">✎</button>
                  <button @click="deleteTask(task.id)" class="btn-icon delete">🗑</button>
                </div>
              </div>
            </li>
          </transition-group>
        </ul>
        <div v-if="tasks.length === 0" class="empty-state">No hay tareas pendientes.</div>
      </div>

      <div v-else class="view-content">
        <div class="note-form input-group">
          <input v-model="newNoteTitle" placeholder="Título (opcional)" />
          <textarea v-model="newNoteContent" placeholder="Escribe tu nota aquí..."></textarea>
          <button @click="addNote" class="btn-primary">Guardar Nota</button>
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
                    <button @click="deleteNote(note.id)" class="btn-icon delete">🗑</button>
                  </div>
                </div>
                <p>{{ note.content }}</p>
              </div>
            </div>
          </transition-group>
        </div>
        <div v-if="notes.length === 0" class="empty-state">No hay notas guardadas.</div>
      </div>
    </div>
    
    <footer class="app-footer">
      ZenTask v1.0 • Preparado para Supabase 🚀
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
.btn-primary { background: var(--primary); color: white; padding: 0.75rem; border-radius: 0.75rem; font-weight: 600; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.task-list { list-style: none; display: flex; flex-direction: column; gap: 1rem; }
.task-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: 1rem; padding: 1rem;
  transition: all 0.3s ease;
}
.task-content { display: flex; align-items: center; gap: 1rem; cursor: pointer; flex: 1; }
.checkbox { width: 1.25rem; height: 1.25rem; border: 2px solid var(--primary); border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; }
.check { width: 0.6rem; height: 0.6rem; background: var(--primary); border-radius: 0.1rem; }
.completed span { text-decoration: line-through; color: var(--text-muted); }

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
