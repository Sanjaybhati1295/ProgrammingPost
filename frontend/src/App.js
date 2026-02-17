// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import FeedPage from './pages/FeedPage/FeedPage';
import WriteBlogPage from './pages/Blog/WriteBlogPage';
import BlogDetailPage from './pages/Blog/BlogDetailPage';
import ProjectDetailPage from './pages/Project/ProjectDetailPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import BlogPage from './pages/Blog/BlogPage'; 
import StoriesPage from './pages/StoriesPage/StoriesPage';
import EditProfilePage from './pages/Auth/EditProfilePage';
import NotificationsPage from './pages/NotificationsPage/NotificationsPage'; 
import DiscoverPage from './pages/DiscoverPage/DiscoverPage';
import { AuthProvider } from './context/AuthContext';


function App() {
  return (
    <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/blog/:id" element={<BlogDetailPage />} />
        <Route path="/project/:id" element={<ProjectDetailPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/write" element={<ProtectedRoute><WriteBlogPage /></ProtectedRoute>} />
        <Route path="/write/:id" element={<WriteBlogPage />} />
        <Route path="/blogs" element={<BlogPage/>} />
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/projects" element={<StoriesPage />} />
        <Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/discover" element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
      </Routes>
    </Router>
    </AuthProvider>
  );
}



export default App;