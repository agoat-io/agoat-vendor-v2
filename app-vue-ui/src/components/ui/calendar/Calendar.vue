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
    <CalendarHeader>
      <CalendarPrev />
      <CalendarHeading />
      <CalendarNext />
    </CalendarHeader>

    <div class="flex flex-col gap-y-4 mt-4 sm:flex-row sm:gap-x-4 sm:gap-y-0">
      <CalendarGrid v-for="month in grid" :key="month.value.toString()">
        <CalendarGridHead>
          <CalendarGridRow>
            <CalendarHeadCell
              v-for="day in weekDays"
              :key="day"
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
            >
              <CalendarCellTrigger
                :day="weekDate"
                :month="month.value"
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  </CalendarRoot>
</template>
