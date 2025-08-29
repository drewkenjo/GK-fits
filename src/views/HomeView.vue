<!-- HelloWorld.vue -->
<template>
  {{ data }}
  <div>
    <h1>{{ message }}</h1>

    <DataTable :value="products" tableStyle="min-width: 50rem">
      <Column v-for="col of columns" :key="col.field" :field="col.field" :header="col.header"></Column>
    </DataTable>
  </div>
</template>

<script setup>
import { computed, ref } from "vue"
import { useFetch } from '@vueuse/core'

const message = ref("Hello World")

const products1 = ref([
{
    id: '1000',
    code: 'f230fh0g3',
    name: 'Bamboo Watch',
    description: 'Product Description',
    image: 'bamboo-watch.jpg',
    price: 65,
    category: 'Accessories',
    quantity: 24,
    inventoryStatus: 'INSTOCK',
    rating: 5
},
])

const products = computed(() => JSON.parse(data))

const columns = [
    { field: 'name', header: 'Name' },
    { field: 'download_url', header: 'Category' },
    { field: '_links', header: 'Quantity' }
]

const { data, error, isFetching } = useFetch('https://api.github.com/repos/drewkenjo/GK-fits/contents/fits')

</script>

<style scoped>
</style>
