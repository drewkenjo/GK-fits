<!-- HelloWorld.vue -->
<template>
  <Fieldset legend="Table of all fit variants" :toggleable="true" class="my-1 mx-5 my-table-sripes">
    <DataTable
      :value="filteredFits"
      size="small"
      :scrollable="true"
      scrollHeight="30vh"
      :stripedRows="true"
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
      <Column v-for="col of tagColumns" :key="col.field" :field="col.field">
        <template #header>
          <div class="flex flex-col mb-3">
            <div v-for="tag in alltags[col.field]" class="flex items-center">
              <Checkbox v-model="fitsStore.filters" :value="tag" :inputId="`${tag}InputId`" size="small"/>
              <label :for='`${tag}InputId`'>
                <Tag :value="tag" class="text-xs ms-1" :severity="severities[tag]"/>
              </label>
            </div>
          </div>

        </template>
          
        <template #body="{data}">
          <Tag :severity="severities[data[col.field]]" :value="data[col.field]" rounded/>
        </template>
      </Column>
    </DataTable>
  </Fieldset>


  <Fieldset legend="Table of selected parameters" v-show="fitsStore.selected.length>0" :toggleable="true" class="mx-5">
   <div class="max-w-[95vw] my-table-sripes">
    <DataTable
      :value="parsRows"
      size="small"
      tableClass="w-auto"
      :scrollable="true"
      :stripedRows="true"
      :reorderableColumns="true"
      @columnReorder="reorderColumns"
    >
      <Column header="Par name" :frozen="true">
        <template #body="{index}">
          <span class="text-pink-500 font-bold">{{ parsNames[index] }}</span>
        </template>
      </Column>
      <Column v-for="col in fitsStore.selected" :key="col" :field="col" class="w-3">
        <template #header>
          <div class="flex flex-col">
            <Tag v-for="tag in tagColumns" :key="tag.field" :severity="severities[parsData[col]?.[tag.field]]" :value="parsData[col]?.[tag.field]" class='text-xs' rounded/>
          </div>
        </template>
        <template #body="{data, index, field}">
          <div class="flex flex-row">
            <div class="font-bold mt-auto mb-auto">{{ parsData[field]?.pars[index].val }}</div>
            <div class="flex flex-col">
              <div class="font-bold text-sm text-blue-500">+{{ parsData[field]?.pars[index].errU }}</div>
              <div class="font-bold text-sm text-red-500">{{ parsData[field]?.pars[index].errD }}</div>
            </div>
          </div>
        </template>
      </Column>
    </DataTable>
    </div>
  </Fieldset>
</template>

<script setup>
import { computed, onMounted, ref, watchEffect } from "vue"
import moment from 'moment'
import pLimit from 'p-limit'
import { useFitsStore } from '@/stores/fitsstore.js'

const fitsStore = useFitsStore()

const allfits = ref([])

const tagColumns = [
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
  trange: ['all-t', 'lowt'],
  ha21: ['yesHA21','noHA21'],
  clas12: ['yesCLAS12','noCLAS12'],
  neutron: ['yes-neutron', 'noneutron'],
  lattice: ['no-lattice','lattice'],
  xi: ['full-xi','peters-xi'],
  alphastr: ['freeAlphaStr', "positiveHAlphaStr"],
  alpha0: ['freeAlpha0', "positiveAlpha0"]
}

const reorderColumns = ({dragIndex, dropIndex}) => {
  const item = fitsStore.selected.splice(dragIndex-1, 1)[0]
  fitsStore.selected.splice(dropIndex-1, 0, item)
}

const severities = computed(() => {
  const sevs = Object.values(alltags).flat().map((it, idx) => ([it, idx%2==0 ? 'secondary' : 'info']))
  return Object.fromEntries(sevs)
})

const filteredFits = computed(() => allfits.value.filter(it => {
  return tagColumns.every( ({field}) => fitsStore.filters.includes(it[field]) )
}))

onMounted(async () => {
  const data = await fetch('https://api.github.com/repos/drewkenjo/GK-fits/contents/fits').then(res => res.json())
  allfits.value = data.filter(it=>it.name.startsWith('20') && it.name.endsWith('.pars') && it.name.includes('minos')).map(it=>{
    const [_day, _time] = it.name.split('_').slice(0,2)
    const date = moment(`${_day} ${_time}`)
    const day = date.format('ll')
    const time = date.format('HH:mm')

    const tags = Object.entries(alltags).map(([key, vals]) => {
      const ival = vals.findIndex(vv =>it.name.includes(vv))
      return [key,  vals[ival]??vals[0]]
    })

    return Object.assign(Object.fromEntries(tags), {day, time, ...it})
  }).reverse()

  if(fitsStore.filters==null) fitsStore.filters = Object.values(alltags).flat()

})

const selectAll = () => {
  if(fitsStore.selected.length==0)
    fitsStore.selected = allfits.value.map(it=>it.name)
  else
    fitsStore.selected = []
}


const parsRows = computed(() => {
  const row = Object.fromEntries(allfits.value.map(it => ([it.name, it])))
  return Array(16).fill(row)
})

const parsData = ref({})
const parsNames = ref([])

watchEffect( async () => {
  const limit = pLimit(10)
  const gitTxts = await Promise.all(
    allfits.value.map(it => limit(() => fetch(it.download_url).then(r => r.text())).then(txt=>([it, txt])))
  )
  const gitPars = gitTxts.map(([it, txt]) => {
    const lines = txt.trim().split('\n').map(line=>line.trim().split(/[\s,]+/))
    const pars = lines.slice(-16,)
      .map(([parname,val,errD,errU]) => ({parname, val:Math.round(val*1000)/1000, errD:Math.round(errD*1000)/1000, errU:Math.round(errU*1000)/1000}))
    parsNames.value = pars.map(it=>it.parname)
    const [chi2, npoints] = lines[1]
    return [it.name, {pars, chi2, npoints, ...it}]
  })
  parsData.value = Object.fromEntries(gitPars)
})


</script>


<style scoped>
.my-table-sripes {
  --p-datatable-row-striped-background: lightcyan;
}
</style>
