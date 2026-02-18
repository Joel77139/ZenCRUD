<template>
  <div class="confirm-overlay">
    <div class="confirm-box">
      <p>{{ message }}</p>
      <div class="buttons">
        <button @click="$emit('confirm')">Sí</button>
        <button @click="$emit('cancel')">No</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.confirm-box {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  text-align: center;
}
.buttons {
  display: flex;
  justify-content: space-around;
  margin-top: 1rem;
}
button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}
</style>
