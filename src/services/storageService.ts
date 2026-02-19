import { supabase } from '../supabase'

export interface Task {
  id: number
  text: string
  status: 'pendiente' | 'en progreso' | 'completada'
  created_at: string
  due_date?: string
  priority: 'Alta' | 'Media' | 'Baja'
}

export interface Note {
  id?: number
  title: string
  content: string
  color: string
}

export const storageService = {
  // --- Tasks ---
  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('id', { ascending: false })

    if (error) throw error
    return data || []
  },

  async addTask(task: { text: string; due_date?: string; priority?: Task['priority'] }): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...task, status: 'pendiente', priority: task.priority || 'Media' }])
      .select()

    if (error) throw error
    return data[0] as Task
  },

  async updateTask(id: number, updates: Partial<Task>) {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  },

  async deleteTask(id: number) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // --- Notes ---
  async getNotes(): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('id', { ascending: false })

    if (error) throw error
    return data || []
  },

  async addNote(note: Omit<Note, 'id'>) {
    const { data, error } = await supabase
      .from('notes')
      .insert([note])
      .select()

    if (error) throw error
    return data[0]
  },

  async updateNote(id: number, updates: Partial<Note>) {
    const { error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  },

  async deleteNote(id: number) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
