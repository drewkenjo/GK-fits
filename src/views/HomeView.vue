<!-- HelloWorld.vue -->
<template>
  <Fieldset legend="Table of all fit variants" :toggleable="true" class="mx-5">
    <DataTable
      :value="allfits"
      size="small"
      :scrollable="true"
      scrollHeight="30vh"
    >
      <Column field="checkbox">
        <template #header="col">
          <Button class="whitespace-nowrap" size='small' @click="selectAll">
            select {{ fitsStore.selected.length==0 ? 'all' : 'none' }}
          </Button>
        </template>
        <template #body="{data}">
          <Checkbox v-model="fitsStore.selected" name="selected" :value="data.name" />
        </template>
      </Column>
      <Column field="day" header="Date"></Column>
      <Column field="time" header="Time"></Column>
      <Column v-for="col of columns" :key="col.field" :field="col.field" :header="col.header">
        <template #body="{data}">
          <Tag :severity="data[col.field].severity" :value="data[col.field].value"/>
        </template>
      </Column>
    </DataTable>
  </Fieldset>


  <Fieldset legend="Table of selected variants" v-show="fitsStore.selected.length>0" :toggleable="true" class="mx-5">
    <DataTable
      :value="parRows"
      size="small"
      :scrollable="true"
      scrollHeight="30vh"
    >
      <Column field="day" header="Par name"></Column>
      <Column v-for="col of parColumns" :key="col" :field="col" :header="col">
        <template #body="{data, index, field}">
          {{ data[field].pars }}
        </template>
      </Column>
    </DataTable>
  </Fieldset>
  {{ parList }}
</template>

<script setup>
import { computed, onMounted, ref, watch, watchEffect } from "vue"
import moment from 'moment'
import { useFitsStore } from '@/stores/fitsstore.js'

const fitsStore = useFitsStore()

const allfits = ref([])
const selectedFits = computed(() => allfits.value.filter(it=>fitsStore.selected.includes(it.name)))

const columns = [
  {field: 'mix', header: "mixing angle"},
  {field: 'mu', header: '\u03BC value'},
  {field: 'err', header: 'errors'},
  {field: 'trange', header: '-t range'},
  {field: 'ha21', header: 'HA2021 data'},
  {field: 'clas12', header: 'CLAS12 data'},
  {field: 'neutron', header: 'Neutron data'},
  {field: 'lattice', header: 'Lattice-inspired limits'},
  {field: 'xi', header: 'formula for \u03BE'},
  {field: 'alphastr', header: "\u03B1' limits?"},
  {field: 'alpha0', header: '\u03B10 limits?'}
]

const alltags = {
  mix: ['oldmix', 'newmix'],
  mu: ['_200', '_176'],
  err: ['stat-only', 'syst'],
  trange: ['allt', 'lowt'],
  ha21: ['yesHA21','noHA21'],
  clas12: ['yesCLAS12','noCLAS12'],
  neutron: ['yes-neutron', 'noneutron'],
  lattice: ['no-lattice','lattice'],
  xi: ['full-xi','peters-xi'],
  alphastr: ['freeAlphaStr', "positiveHAlphaStr"],
  alpha0: ['freeAlpha0', "positiveAlpha0"]
}

onMounted(async () => {
  const data = await fetch('https://api.github.com/repos/drewkenjo/GK-fits/contents/fits').then(res => res.json())
  allfits.value = data.filter(it=>it.name.startsWith('20') && it.name.endsWith('.pars') && it.name.includes('minos')).map(it=>{
    const [_day, _time] = it.name.split('_').slice(0,2)
    const date = moment(`${_day} ${_time}`)
    const day = date.format('ll')
    const time = date.format('HH:mm')

    const tags = Object.entries(alltags).map(([key, vals]) => {
      const ival = vals.findIndex(vv =>it.name.includes(vv))
      const severity = ival>0 ? 'warn' : 'primary'
      return [key,  {severity, value: vals[ival]??vals[0]}]
    })

    return Object.assign(Object.fromEntries(tags), {day, time, ...it})
  }).reverse()

})

const selectAll = () => {
  if(fitsStore.selected.length==0)
    fitsStore.selected = allfits.value.map(it=>it.name)
  else
    fitsStore.selected = []
}

const fitsDict = computed(() => Object.fromEntries(allfits.value.map(it=>([it.name, it]))))
const parList = ref([])

watchEffect( () => {
  parList.value = parList.value.filter(it => fitsStore.selected.includes(it?.name))
  const namelist = parList.value.map(it => it?.name)
  console.log(namelist)
  fitsStore.selected.forEach(name => {
    if(!namelist.includes(name) && fitsDict.value[name]) {
      const dict = {...fitsDict.value[name]}
      parList.value.push(dict)
      console.log('adding', dict.download_url)
      fetch(dict.download_url).then(res=>res.text())
      .then(txt => {
        const lines = txt.split('\n').map(line=>line.split(/[\s,]+/))
        dict['pars'] = lines.slice(-16,)
        console.log(dict['name'])
        console.log(dict['pars'])
      })
    }
  })
})


const parColumns = computed(() => parList.value.map(it=>it?.name))
const parRows = computed(() => {
  const row = Object.fromEntries(parList.value.map(it => ([it.name, it])))
  return [row, row, row]
})

</script>


<style scoped>
</style>
