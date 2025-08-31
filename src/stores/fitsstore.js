import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useFitsStore = defineStore('fitsStore', () => {
  const selected = ref([])
  const filters = ref(null)
  return { selected, filters }
}, {
  persist: true
})
