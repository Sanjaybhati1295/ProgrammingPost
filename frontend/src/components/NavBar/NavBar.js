// src/components/NavBar/NavBar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './NavBar.css';
import NotificationBadge from '../NotificationBadge/NotificationBadge';
import { 
  FaBars, FaTimes, FaBell, FaSearch, FaUserCircle,
  FaPenSquare, FaRocket, FaCode // Icons for search results
} from 'react-icons/fa';

// --- NEW: Helper Component for Search Results ---
// This component figures out how to display each different result type
const SearchResultItem = ({ item, onClick }) => {
  let icon, typeText;

  switch (item.type) {
    case 'profile':
      icon = item.avatar_url ? <img src={item.avatar_url} alt={item.title} className="search-result-avatar" /> : <FaUserCircle className="search-result-icon profile" />;
      typeText = 'Profile';
      break;
    case 'blog':
      icon = <FaPenSquare className="search-result-icon blog" />;
      typeText = 'Blog';
      break;
    case 'story':
      icon = <FaRocket className="search-result-icon story" />;
      typeText = 'Project';
      break;
    default:
      icon = <FaUserCircle className="search-result-icon" />;
      typeText = 'Result';
  }

  return (
    <li onClick={() => onClick(item.path)}>
      <div className="suggestion-info">
        <span className="suggestion-name">{item.title}</span>
        <span className="suggestion-username">{item.excerpt}</span>
      </div>
      <span className="suggestion-type-badge">{typeText}</span>
    </li>
  );
};
// --- END HELPER ---


const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // --- UPDATED: Debounced search effect ---
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      // --- UPDATED: Call the RPC function ---
      const { data, error } = await supabase.rpc('search_all_content', {
        search_term: searchQuery
      });
      
      if (error) {
        console.error("Search error:", error);
      } else if (data) {
        setSuggestions(data);
        setShowSuggestions(true);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // --- (Click outside handler - unchanged) ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchContainerRef]);


  const handleLogout = async () => {
    closeMobileMenu();
    await supabase.auth.signOut();
    navigate('/');
  };
  
  const closeMobileMenu = () => setIsOpen(false);

  // --- UPDATED: Handle click on any suggestion ---
  const handleSuggestionClick = (path) => {
    setSearchQuery(''); // Clear search
    setSuggestions([]);
    setShowSuggestions(false);
    closeMobileMenu();
    navigate(path); // Navigate to the dynamic path (e.g., /blog/123 or /profile/sanjay)
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          ProgrammingPost
        </Link>

        {/* --- Global Search Bar (Desktop) --- */}
        <div className="nav-search-container desktop-search" ref={searchContainerRef}>
          <div className="nav-search-bar">
            <FaSearch className="nav-search-icon" />
            <input 
              type="text" 
              placeholder="Search posts, projects, users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
            />
          </div>
          {/* --- UPDATED: Search Suggestions Dropdown --- */}
          {showSuggestions && (
            <div className="search-suggestions-dropdown">
              {suggestions.length > 0 ? (
                <ul>
                  {suggestions.map(item => (
                    <SearchResultItem 
                      key={item.type + item.id} 
                      item={item} 
                      onClick={handleSuggestionClick} 
                    />
                  ))}
                </ul>
              ) : (
                <div className="no-suggestions">No results found for "{searchQuery}".</div>
              )}
            </div>
          )}
        </div>
        {/* --- End Search Bar --- */}

        <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>

        {/* --- All Navigation Links --- */}
        <div className={isOpen ? 'nav-menu active' : 'nav-menu'}>
          
          {/* Search Bar (Mobile) - (This logic is simplified for clarity) */}
          <div className="nav-search-container mobile-search">
             <div className="nav-search-bar">
               <FaSearch className="nav-search-icon" />
               <input type="text" placeholder="Search..." />
             </div>
          </div>

          {/* Public Links */}
          <Link to="/blogs" className="nav-link" onClick={closeMobileMenu}>
            Blogs
          </Link>
          <Link to="/stories" className="nav-link" onClick={closeMobileMenu}>
            Project Stories
          </Link>
          
          {/* Conditional Auth Links */}
          {session ? (
            <>
              <Link to="/feed" className="nav-link" onClick={closeMobileMenu}>My Feed</Link>
              <Link to="/notifications" className="nav-link nav-link-icon-wrapper" onClick={closeMobileMenu}>
                <FaBell className="nav-link-icon" />
                <NotificationBadge />
              </Link>
              <button onClick={handleLogout} className="nav-link nav-link-btn">Log Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link nav-link-btn" onClick={closeMobileMenu}>Log In</Link>
              <Link to="/signup" className="nav-link nav-link-btn nav-link-btn-primary" onClick={closeMobileMenu}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;