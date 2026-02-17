// src/SignupPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import './AuthPage.css';
import NavBar from '../../components/NavBar/NavBar';
import Footer from '../../components/Footer/Footer'; // Correct path
import { supabase } from '../../supabaseClient'; // Import our new client
import toast, { Toaster } from 'react-hot-toast';

const SignupPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // New state for loading and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate(); // For redirecting after success

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // This is the Supabase auth function
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { 
            username: username 
          }
        }
      });

      if (error) {
        throw error; // If Supabase returns an error, throw it
      }

      toast.success('Account created! Please check your email to confirm.', {
        duration: 4000,
        position: 'top-center',
      });
      setTimeout(() => {
        navigate('/login');
      }, 1000);
      

    } catch (error) {
      // If our try block catches an error
      setError(error.message);
    } finally {
      // This runs whether it succeeded or failed
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <NavBar />
      <Toaster/>
      <div className="auth-content">
        <div className="auth-container">
          <h1 className="auth-title">Create Your Account</h1>
          <p className="auth-subtitle">
            Join the community and start your first post.
          </p>
          
          <form onSubmit={handleSubmit} className="auth-form">
            
            {/* Show an error message if one exists */}
            {error && <p className="auth-error">{error}</p>}

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading} // Disable form while loading
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <button type="submit" className="auth-button" disabled={loading}>
              {/* Change button text when loading */}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Log In
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SignupPage;