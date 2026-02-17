// src/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

const Footer = () => (
  <footer className="footer">
    <div className="footer-container">
      <div className="footer-col">
        <h4 className="footer-logo">ProgrammingPost</h4>
        <p className="footer-about">
          A place for developers to share their blogs, project stories, and connect with a community of coders.
        </p>
      </div>
      
      <div className="footer-col">
        <h4>Quick Links</h4>
        <ul className="footer-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/blogs">Blogs</Link></li>
          <li><Link to="/stories">Project Stories</Link></li>
          <li><Link to="/write">Start Writing</Link></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Legal</h4>
        <ul className="footer-links">
          <li><Link to="/privacy">Privacy Policy</Link></li>
          <li><Link to="/terms">Terms of Service</Link></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Follow Us</h4>
        <div className="footer-socials">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"><FaGithub /></a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <p>&copy; {new Date().getFullYear()} ProgrammingPost.com. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;