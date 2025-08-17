<script setup lang="ts">
import { 
  CalendarRoot, 
  CalendarHeader, 
  CalendarHeading, 
  CalendarPrev, 
  CalendarNext, 
  CalendarGrid, 
  CalendarGridHead, 
  CalendarGridBody, 
  CalendarGridRow, 
  CalendarHeadCell, 
  CalendarCell, 
  CalendarCellTrigger 
} from 'radix-vue'
import { cn } from '@/lib/utils'
</script>

<template>
  <CalendarRoot
    v-slot="{ grid, weekDays }"
    v-bind="$attrs"
    :class="cn('p-3', $attrs.class as string)"
  >
    <CalendarHeader class="flex items-center justify-between">
      <CalendarPrev class="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100" />
      <CalendarHeading class="text-sm font-medium" />
      <CalendarNext class="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100" />
    </CalendarHeader>

    <div class="flex flex-col gap-y-4 mt-4 sm:flex-row sm:gap-x-4 sm:gap-y-0">
      <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="w-full">
        <CalendarGridHead>
          <CalendarGridRow>
            <CalendarHeadCell
              v-for="day in weekDays"
              :key="day"
              class="text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]"
            >
              {{ day }}
            </CalendarHeadCell>
          </CalendarGridRow>
        </CalendarGridHead>
        <CalendarGridBody>
          <CalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="`weekDate-${index}`"
            class="mt-2 w-full"
          >
            <CalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :date="weekDate"
              class="relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([data-selected])]:bg-accent first:[&:has([data-selected])]:rounded-l-md last:[&:has([data-selected])]:rounded-r-md"
            >
              <CalendarCellTrigger
                :day="weekDate"
                :month="month.value"
                class="h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:rounded-md"
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  </CalendarRoot>
</template>
