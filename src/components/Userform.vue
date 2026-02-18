<template>
      <form @submit.prevent="onSubmit" class="form">
    <div class="form-group">
      <label>Nombre:</label>
      <input v-model="form.name" type="text" />
      <p v-if="errors.name" class="error">{{ errors.name }}</p>
    </div>

    <div class="form-group">
      <label>Email:</label>
      <input v-model="form.email" type="email" />
      <p v-if="errors.email" class="error">{{ errors.email }}</p>
    </div>

    <button type="submit">
      {{ form.id ? 'Actualizar' : 'Agregar' }} Usuario

    </button> 
  
  </form>

</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

type User = {
  id: number
  name: string
  email: string
}

const emit = defineEmits<{
  (e: 'submit', user: User): void
}>()

const props = defineProps<{
  userToEdit: User | null
  users: User[]
}>()



const form = ref<User>({
  id: 0,
  name: '',
  email: ''
  
})

const errors = ref<{ name: string; email: string }>({ name: '', email: '' })

watch(() => props.userToEdit, (newVal) => {
  if (newVal) {
    form.value = { ...newVal }
  } else {
    form.value = { id: 0, name: '', email: '' }
  }
})

function validate(): boolean {
  errors.value = { name: '', email: '' }

  const name = form.value.name.trim()
  const email = form.value.email.trim().toLowerCase()

  // Validar nombre
  if (!name) {
    errors.value.name = 'El nombre es obligatorio.'
  }

  // Validar email
  if (!email) {
    errors.value.email = 'El email es obligatorio.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.value.email = 'El email no es válido.'
  } else {
    // Validar email duplicado
    const emailExists = props.users.some(
      (u) => u.email.toLowerCase() === email && u.id !== form.value.id
    )

  if (emailExists) {
  errors.value.email = 'Este email ya está registrado.'
  alert(errors.value.email) // solo para pruebas
}
  }

  return !errors.value.name && !errors.value.email
}


function onSubmit() {
  if (!validate()) return

  if (!form.value.id) {
    form.value.id = Date.now()
  }

  console.log('Emitir submit con:', form.value) //Esto es para Confirmar si se recibe "submit correctamente"
  emit('submit', { ...form.value })
  form.value = { id: 0, name: '', email: '' }
}
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

button {
  background-color: #2e7d32;
  color: white;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
}

button:hover {
  background-color: #1b5e20;
}

.error {
  color: red;
  font-size: 0.875rem;
  margin-top: 4px;
}

</style>

