import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DateRangePickerDemo from './pages/DateRangePickerDemo';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/daterangepicker" element={<DateRangePickerDemo />} />
      </Routes>
    </Router>
  );
}

export default App;