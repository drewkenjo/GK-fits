import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useFitsStore = defineStore('fitsStore', () => {
  // state
  const selected = ref([])
  return { selected }
}, {
  persist: true   // 👈 enable persistence
})
