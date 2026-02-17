// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  console.log("PROTECTED ROUTE useAuth:", { session, loading });
  // Show a loading indicator while checking authentication status
  if (loading) {
    // You can replace this with a more sophisticated loading spinner component
    return <div className="full-page-loader">Checking authentication...</div>;
  }
  console.log('session '+JSON.stringify(session));
  // If there's no active session, redirect the user to the login page
  if (!session) {
    // 'replace' prevents the user from going back to the protected route via the back button
    return <Navigate to="/login" replace />;
  }

  // If the user is authenticated (session exists), render the child components
  return children;
};

export default ProtectedRoute;