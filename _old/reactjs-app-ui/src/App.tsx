import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import { AppThemeProvider } from './components/ThemeProvider';
import ErrorBoundary from '../components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewPost from './pages/NewPost';
import PostDetail from './pages/PostDetail';

function App() {
  return (
    <ErrorBoundary>
      <AppThemeProvider>
        <Theme>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/new-post" element={<NewPost />} />
              <Route path="/post/:id" element={<PostDetail />} />
            </Routes>
          </div>
        </Theme>
      </AppThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
