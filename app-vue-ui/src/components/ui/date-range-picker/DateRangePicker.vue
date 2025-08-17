<template>
  <div class="grid gap-2">
    <Popover :open="isOpen" @update:open="isOpen = $event">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          :class="[
            'w-full justify-start text-left font-normal',
            !dateRange && 'text-muted-foreground'
          ]"
        >
          <CalendarIcon class="mr-2 h-4 w-4" />
          <span v-if="dateRange?.from">
            {{ formatDate(dateRange.from) }}
            <span v-if="dateRange?.to">
              - {{ formatDate(dateRange.to) }}
            </span>
          </span>
          <span v-else>Pick a date range</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0" align="start">
        <div class="flex flex-col gap-2 p-3">
          <div class="flex items-center gap-2">
            <Input
              v-model="startDateInput"
              :placeholder="`Start date (${dateFormat})`"
              class="w-32"
              @blur="parseStartDate"
              @keyup.enter="parseStartDate"
            />
            <span class="text-muted-foreground">to</span>
            <Input
              v-model="endDateInput"
              :placeholder="`End date (${dateFormat})`"
              class="w-32"
              @blur="parseEndDate"
              @keyup.enter="parseEndDate"
            />
          </div>
          <div class="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              @click="setDateRange('last7days')"
            >
              Last 7 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="setDateRange('last30days')"
            >
              Last 30 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="setDateRange('last90days')"
            >
              Last 90 days
            </Button>
          </div>
        </div>
        
        <!-- Vue Tailwind Datepicker -->
        <div class="p-3 border-t">
          <VueTailwindDatepicker
            v-model="datepickerValue"
            :config="datepickerConfig"
            @update:modelValue="handleDateSelection"
          />
        </div>
        
        <div class="flex items-center justify-end gap-2 p-3 border-t">
          <Button
            variant="outline"
            size="sm"
            @click="clearDateRange"
          >
            Clear
          </Button>
          <Button
            size="sm"
            @click="applyDateRange"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { format, subDays, startOfDay, endOfDay, parse, isValid } from 'date-fns'
import { CalendarIcon } from 'lucide-vue-next'
import { Button } from '../button'
import { Input } from '../input'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'
import VueTailwindDatepicker from 'vue-tailwind-datepicker'

interface DateRange {
  from: Date
  to: Date
}

interface Props {
  modelValue?: DateRange | null
  placeholder?: string
  dateFormat?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pick a date range',
  dateFormat: 'MM/dd/yyyy'
})

const emit = defineEmits<{
  'update:modelValue': [value: DateRange | null]
}>()

const isOpen = ref(false)
const dateRange = ref<DateRange | null>(props.modelValue || null)
const selectedDate = ref<DateRange | null>(props.modelValue || null)
const startDateInput = ref('')
const endDateInput = ref('')

// Datepicker value for vue-tailwind-datepicker
const datepickerValue = computed({
  get: () => {
    if (!selectedDate.value) return undefined
    return {
      startDate: selectedDate.value.from,
      endDate: selectedDate.value.to
    }
  },
  set: (value: any) => {
    if (value && value.startDate && value.endDate) {
      selectedDate.value = {
        from: new Date(value.startDate),
        to: new Date(value.endDate)
      }
    } else {
      selectedDate.value = null
    }
  }
})

// Vue Tailwind Datepicker configuration
const datepickerConfig = computed(() => ({
  shortcuts: {
    today: 'Today',
    yesterday: 'Yesterday',
    past: (period: number) => `Past ${period} days`,
    currentMonth: 'Current Month',
    pastMonth: 'Past Month'
  },
  footer: {
    applyButton: {
      text: 'Apply',
      class: 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded'
    },
    cancelButton: {
      text: 'Cancel',
      class: 'bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded'
    }
  },
  datepicker: {
    modelType: 'range',
    monthPicker: false,
    yearPicker: false,
    weekStart: 1,
    format: 'yyyy-MM-dd',
    placeholder: 'Select date range',
    inputClasses: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
    calendarClasses: 'bg-white border border-gray-200 rounded-lg shadow-lg',
    headerClasses: 'bg-gray-50 border-b border-gray-200 px-4 py-2',
    weekClasses: 'text-xs text-gray-500 font-medium',
    dayClasses: 'w-8 h-8 text-sm font-medium rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
    selectedDayClasses: 'bg-blue-500 text-white hover:bg-blue-600',
    inRangeDayClasses: 'bg-blue-100 text-blue-700',
    disabledDayClasses: 'text-gray-300 cursor-not-allowed'
  }
}))

// Format date for display
const formatDate = (date: Date): string => {
  return format(date, props.dateFormat)
}

// Parse date from string based on format
const parseDate = (dateString: string): Date | null => {
  if (!dateString.trim()) return null
  
  try {
    // Try parsing with the specified format
    const parsed = parse(dateString, props.dateFormat, new Date())
    if (isValid(parsed)) {
      return parsed
    }
    
    // Fallback: try common formats
    const formats = ['MM/dd/yyyy', 'yyyy-MM-dd', 'MM-dd-yyyy', 'dd/MM/yyyy']
    for (const fmt of formats) {
      const parsed = parse(dateString, fmt, new Date())
      if (isValid(parsed)) {
        return parsed
      }
    }
    
    // Last resort: try native Date parsing
    const native = new Date(dateString)
    if (isValid(native)) {
      return native
    }
  } catch (error) {
    console.error('Invalid date format:', dateString)
  }
  
  return null
}

// Update input fields when date range changes
const updateInputs = () => {
  if (dateRange.value?.from) {
    startDateInput.value = formatDate(dateRange.value.from)
  } else {
    startDateInput.value = ''
  }
  
  if (dateRange.value?.to) {
    endDateInput.value = formatDate(dateRange.value.to)
  } else {
    endDateInput.value = ''
  }
}

// Handle date selection from calendar
const handleDateSelection = (range: any) => {
  if (range && range.startDate && range.endDate) {
    const newRange = {
      from: new Date(range.startDate),
      to: new Date(range.endDate)
    }
    selectedDate.value = newRange
    dateRange.value = newRange
    updateInputs()
  }
}

// Parse start date from input
const parseStartDate = () => {
  const date = parseDate(startDateInput.value)
  if (date) {
    dateRange.value = {
      from: startOfDay(date),
      to: dateRange.value?.to || endOfDay(date)
    }
    selectedDate.value = dateRange.value
  }
}

// Parse end date from input
const parseEndDate = () => {
  const date = parseDate(endDateInput.value)
  if (date) {
    dateRange.value = {
      from: dateRange.value?.from || startOfDay(date),
      to: endOfDay(date)
    }
    selectedDate.value = dateRange.value
  }
}

// Set predefined date ranges
const setDateRange = (range: 'last7days' | 'last30days' | 'last90days') => {
  const today = new Date()
  let from: Date
  
  switch (range) {
    case 'last7days':
      from = subDays(today, 7)
      break
    case 'last30days':
      from = subDays(today, 30)
      break
    case 'last90days':
      from = subDays(today, 90)
      break
  }
  
  const newRange = {
    from: startOfDay(from),
    to: endOfDay(today)
  }
  
  dateRange.value = newRange
  selectedDate.value = newRange
  updateInputs()
}

// Clear date range
const clearDateRange = () => {
  dateRange.value = null
  selectedDate.value = null
  startDateInput.value = ''
  endDateInput.value = ''
  emit('update:modelValue', null)
}

// Apply date range
const applyDateRange = () => {
  emit('update:modelValue', dateRange.value)
  isOpen.value = false
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  dateRange.value = newValue || null
  selectedDate.value = newValue || null
  updateInputs()
}, { immediate: true })

// Watch for internal changes to sync selectedDate with dateRange
watch(dateRange, (newValue) => {
  selectedDate.value = newValue
}, { deep: true })
</script>
