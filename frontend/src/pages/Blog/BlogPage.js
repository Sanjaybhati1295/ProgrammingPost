// src/pages/Blog/BlogPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; // Ensure this path is correct
import NavBar from '../../components/NavBar/NavBar';       // Ensure this path is correct
import Footer from '../../components/Footer/Footer';       // Ensure this path is correct
import FadeInSection from '../../components/FadeInSection/FadeInSection'; // Ensure this path is correct
import '../../ContentPage.css'; // Ensure this path is correct

const BlogPage = () => {
  // State for posts, loading status, and errors
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Async function to fetch blogs
    const fetchBlogs = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch public blogs from Supabase, joining with profiles for username
        const { data, error: dbError } = await supabase
          .from('Blogs') // Your table name
          .select(`
            id,
            title,
            category,
            content,
            image_url,
            created_at,
            profiles (
              username,
              full_name
            )
          `) // Select needed fields + username from related profiles table
          .eq('visibility', 'public') 
          .eq('content_type', 'blog') // Only fetch public posts
          .order('created_at', { ascending: false }); // Show newest first

        if (dbError) {
          // If Supabase returns an error, throw it
          throw dbError;
        }

        // Update state with fetched posts (or empty array if none)
        setPosts(data || []);

      } catch (err) {
        // Catch any error during the fetch
        console.error('Error fetching blogs:', err.message);
        setError(err.message); // Store the error message
      } finally {
        // Stop loading, whether successful or not
        setLoading(false);
      }
    };

    // Call the function when the component mounts
    fetchBlogs();
  }, []); // Empty array means run once on mount

  // Function to render the main content based on state
  const renderContent = () => {
    if (loading) {
      return <p className="loading-text">Loading blogs... ⏳</p>;
    }

    if (error) {
      return <p className="error-text">Failed to load blogs: {error} 😞</p>;
    }

    if (posts.length === 0) {
      return <p className="loading-text">No public blogs found yet. Be the first to post! ✨</p>;
    }

    // Map over the posts and display each in a card
    return (
      <div className="post-card-grid">
        {posts.map((post, index) => (
          <FadeInSection key={post.id}>
            <Link
              to={`/blog/${post.id}`} // Link to the detail page
              className="post-card-link"
              style={{ transitionDelay: `${index * 100}ms` }} // Stagger animation
            >
              <div className="post-card">
                {/* Display image if available */}
                {post.image_url && (
                  <img src={post.image_url} alt={post.title} className="post-card-image" />
                )}
                <div className="post-card-content">
                  <span className="post-card-category">{post.category || 'Blog'}</span>
                  <h3 className="post-card-title">{post.title}</h3>
                  {/* Generate excerpt if needed */}
                  <p className="post-card-excerpt">
                    {post.excerpt || (post.content ? post.content.substring(0, 100).replace(/<[^>]+>/g, '') + '...' : 'No excerpt.')}
                  </p>
                  {/* Display author username */}
                  <div className="post-card-author">By {post.profiles?.full_name || 'User'}</div>
                </div>
              </div>
            </Link>
          </FadeInSection>
        ))}
      </div>
    );
  };

  // Main page structure
  return (
    <div className="page-wrapper light-theme">
      <NavBar />
      <div className="page-container">
        <FadeInSection>
          <h1 className="page-title">Blog Posts ✍️</h1>
          <p className="page-subtitle">
            Explore the latest articles, tutorials, and insights from the community.
          </p>
        </FadeInSection>
        {renderContent()} {/* Render the cards, loading, or error message */}
      </div>
      <Footer />
    </div>
  );
};

export default BlogPage;