<!-- HelloWorld.vue -->
<template>
  {{ data }}
  <div>
    <h1>{{ message }}</h1>
    <DataTable
      filterDisplay="row"
      :globalFilterFields="['day','time','name']"
      :value="products"
      tableStyle="min-width: 50rem"
      @row-click="console.log"
      size="small"
    >
      <Column v-for="col of columns" :key="col" :field="col" :header="col">
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue"
import moment from 'moment'

const message = ref("Hello World")

const products = ref([])

const columns = ['day', 'time', 'name']

const columns1 = [
    { field: 'day', header: 'Name' },
    { field: 'time', header: 'Category' },
    { field: 'name', header: 'Quantity' }
]

onMounted(async () => {
  const data = await fetch('https://api.github.com/repos/drewkenjo/GK-fits/contents/fits').then(res => res.json())
  products.value = data.filter(it=>it.name.startsWith('20') && it.name.endsWith('.pars')).map(it=>{
    const [_day, _time] = it.name.split('_').slice(0,2)
    const date = moment(`${_day} ${_time}`)
    const day = date.format('ll')
    const time = date.format('HH:mm')

    return Object.assign({day, time}, it)
  })
})

</script>

<style scoped>
</style>
