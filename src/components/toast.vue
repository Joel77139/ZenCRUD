<template>
  <div :class="['toast', type]">
    {{ message }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  type: 'success' | 'error'
}>()
</script>

<style scoped>
.toast {
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
  font-weight: bold;
  color: white;
}
.success {
  background-color: #28a745;
}
.error {
  background-color: #dc3545;
}
</style>
