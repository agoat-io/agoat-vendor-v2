import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DateRangePicker } from '../components/DateRangePicker';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

const DateRangePickerDemo: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null);

  // Example disabled dates (some holidays)
  const disabledDates: Date[] = [
    new Date(2024, 11, 25), // Christmas
    new Date(2024, 11, 26), // Boxing Day
    new Date(2025, 0, 1),   // New Year
  ];

  const handleDateRangeChange = (range: DateRange) => {
    setSelectedRange(range);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="text-blue-600 hover:underline mb-4 block">
          ← Back to Home
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Date Range Picker Demo
          </h1>
          <p className="text-gray-600">
            Basic demo using the Datepicker from local agoat-ui-toolkit.
          </p>
        </div>

        {selectedRange && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Selected Range</h2>
            <div className="text-sm">
              <p><strong>Start Date:</strong> {selectedRange.start?.toLocaleDateString() || 'Not selected'}</p>
              <p><strong>End Date:</strong> {selectedRange.end?.toLocaleDateString() || 'Not selected'}</p>
              {selectedRange.start && selectedRange.end && (
                <p><strong>Duration:</strong> {
                  Math.ceil((selectedRange.end.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                } days</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">DateRangePicker</h2>
          <DateRangePicker
            startDate={selectedRange?.start}
            endDate={selectedRange?.end}
            onDateRangeChange={handleDateRangeChange}
            disabledDates={disabledDates}
            minDate={new Date(2024, 0, 1)}
            maxDate={new Date(2025, 11, 31)}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePickerDemo;