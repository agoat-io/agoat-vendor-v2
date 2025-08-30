import React, { useState } from 'react';
import { Datepicker, Views } from 'flowbite-react';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangePickerProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onDateRangeChange?: (range: DateRange) => void;
  disabledDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
  monthsToShow?: number;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate: initialStartDate,
  endDate: initialEndDate,
  onDateRangeChange,
  disabledDates = [],
  minDate = new Date(2024, 0, 1),
  maxDate = new Date(2025, 11, 31),
  monthsToShow = 1,
}) => {
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(initialStartDate || null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(initialEndDate || null);

  // Filter function to disable specific dates
  const filterDate = (date: Date, _view: Views) => {
    return !disabledDates.some((disabledDate) =>
      disabledDate.getFullYear() === date.getFullYear() &&
      disabledDate.getMonth() === date.getMonth() &&
      disabledDate.getDate() === date.getDate()
    );
  };

  // Handle start date change
  const handleStartDateChange = (date: Date | null) => {
    setSelectedStartDate(date);
    onDateRangeChange?.({ start: date, end: selectedEndDate });
  };

  // Handle end date change
  const handleEndDateChange = (date: Date | null) => {
    setSelectedEndDate(date);
    onDateRangeChange?.({ start: selectedStartDate, end: date });
  };

  // Calculate max allowed end date based on start date
  const getMaxAllowedEndDate = () => {
    if (!selectedStartDate) return maxDate;
    
    // Find the first disabled date after start date
    const nextDisabledDate = disabledDates
      .filter((date) => date > selectedStartDate)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    
    if (nextDisabledDate) {
      const dayBeforeDisabled = new Date(nextDisabledDate);
      dayBeforeDisabled.setDate(dayBeforeDisabled.getDate() - 1);
      return dayBeforeDisabled < maxDate ? dayBeforeDisabled : maxDate;
    }
    
    return maxDate;
  };

  return (
    <div className="relative p-4 bg-white rounded-lg shadow-lg">
      <div className="flex space-x-4 mb-4">
        <div className="flex-1">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <Datepicker
            id="startDate"
            value={selectedStartDate}
            onChange={handleStartDateChange}
            placeholder="Select start date"
            minDate={minDate}
            maxDate={selectedEndDate || maxDate}
            filterDate={filterDate}
            showClearButton={true}
            showTodayButton={true}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <Datepicker
            id="endDate"
            value={selectedEndDate}
            onChange={handleEndDateChange}
            placeholder="Select end date"
            minDate={selectedStartDate || minDate}
            maxDate={getMaxAllowedEndDate()}
            filterDate={filterDate}
            showClearButton={true}
            showTodayButton={true}
            disabled={!selectedStartDate}
          />
        </div>
      </div>

      {selectedStartDate && selectedEndDate && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <span className="font-medium">Selected Range:</span>
            <div className="mt-1">
              <span className="font-semibold">{selectedStartDate.toLocaleDateString()}</span>
              {' → '}
              <span className="font-semibold">{selectedEndDate.toLocaleDateString()}</span>
            </div>
            <div className="text-xs mt-1 text-blue-600">
              {Math.ceil((selectedEndDate.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
            </div>
          </div>
        </div>
      )}

      {selectedStartDate && disabledDates.length > 0 && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">Note: Range will automatically end before any disabled dates.</p>
        </div>
      )}
    </div>
  );
};