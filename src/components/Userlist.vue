<template>
  <div class="mb-4">
    <div class="flex items-center gap-4 mb-4">
      <input
        v-model="searchInput"
        type="text"
        placeholder="Buscar por nombre o email"
        class="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        @click="applySearch"
        class= "btn-buscar"
      >
        Buscar
      </button>

      <!-- Botón Volver para limpiar búsqueda -->
      <button
        v-if="searchTerm"
        @click="clearSearch"
        class="btn-volver"
      >
        Volver
      </button>
    </div>

    <ul>
      <li
        v-for="user in filteredUsers"
        :key="user.id"
        class="py-2 border-b border-gray-300 flex justify-between items-center"
      >
        <div>
          <strong>{{ user.name }}</strong> - {{ user.email }}
        </div>
        <div>
          <button
            @click="$emit('edit', user)"
            class="text-blue-600 hover:underline mr-2"
          >
            Editar
          </button>
          <button
            @click="$emit('delete', user.id)"
            class="text-red-600 hover:underline"
          >
            Eliminar
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

///Estilos botones 
<style scoped>
.btn-buscar,
.btn-volver {
  background-color: #2e7d32;
  color: white;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: background-color 0.2s ease;
  margin-left: 12px
}

.btn-buscar:hover,
.btn-volver:hover {
  background-color: #1b5e20;
}
</style>


<script setup lang="ts">
import { ref, computed } from 'vue'

type User = {
  id: number
  name: string
  email: string
}

const props = defineProps<{
  users: User[]
}>()

defineEmits<{
  (e: 'edit', user: User): void
  (e: 'delete', id: number): void
}>()

const searchInput = ref('')
const searchTerm = ref('')

function applySearch() {
  searchTerm.value = searchInput.value.trim().toLowerCase()
}

function clearSearch() {
  searchTerm.value = ''
  searchInput.value = ''
}

const filteredUsers = computed(() =>
  props.users.filter(
    user =>
      user.name.toLowerCase().includes(searchTerm.value) ||
      user.email.toLowerCase().includes(searchTerm.value)
  )
)

//Estilos botones 

</script>
