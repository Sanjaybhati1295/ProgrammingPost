// src/pages/Auth/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; // Adjusted path
import NavBar from '../../components/NavBar/NavBar'; // Adjusted path
import Footer from '../../components/Footer/Footer'; // Adjusted path
import './AuthPage.css'; // Use the shared Auth CSS file
import toast, { Toaster } from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Supabase login function
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw error; // If Supabase returns an error
      }
      
      toast.success('Account created! Please check your email to confirm.', {
        duration: 4000,
        position: 'top-center',
      });
      
      navigate('/feed');

    } catch (error) {
      setError(error.message); // Set the error message to display
      console.error("Login Error:", error.message);
    } finally {
      setLoading(false); // Stop loading state regardless of outcome
    }
  };

  return (
    
    // Add the light-theme wrapper if NavBar/Footer don't handle it
    <div className="page-wrapper light-theme auth-page">
      <Toaster />
      <NavBar />
      
      <div className="auth-content">
        <div className="auth-container">
          <h1 className="auth-title">Welcome Back!</h1>
          <p className="auth-subtitle">
            Log in to your ProgrammingPost account.
          </p>

          {/* Display error message if login fails */}
          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading} // Disable input while loading
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              {/* Optional: Add "Forgot Password?" link here */}
            </div>

            <button type="submit" className="button button-primary auth-button" disabled={loading}>
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </form>

          <div className="auth-footer-link">
            Don't have an account?{' '}
            <Link to="/signup" className="link">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;