import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">agoat-ui-toolkit Demos</h1>
      <nav>
        <ul className="space-y-4">
          <li>
            <Link 
              to="/daterangepicker" 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg"
            >
              Date Range Picker Demo
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default HomePage;