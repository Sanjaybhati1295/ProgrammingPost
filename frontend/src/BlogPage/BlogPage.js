// src/pages/Blog/BlogPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; // Adjusted path
import NavBar from '../../components/NavBar/NavBar';       // Adjusted path
import Footer from '../../components/Footer/Footer';       // Adjusted path
import FadeInSection from '../../components/FadeInSection/FadeInSection'; // Adjusted path
import '../../ContentPage.css'; // Uses the shared CSS for cards and layout

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch blogs from Supabase
    const fetchBlogs = async () => {
      setLoading(true);
      setError(null); // Reset error state

      try {
        // Fetch public blogs, joining with profiles to get username
        const { data, error } = await supabase
          .from('Blogs')
          .select(`
            id,
            title,
            category,
            content,
            image_url,
            created_at,
            profiles ( username ) 
          `) // Select necessary fields and author's username
          .eq('is_public', true) // Only fetch public posts
          .order('created_at', { ascending: false }); // Latest first

        if (error) {
          throw error; // Throw error to be caught below
        }

        setPosts(data || []); // Set data or empty array if null

      } catch (err) {
        console.error('Error fetching blogs:', err.message);
        setError(err.message); // Set error message to display
      } finally {
        setLoading(false); // Stop loading state
      }
    };

    fetchBlogs();
  }, []); // Empty array ensures this runs only once on mount

  // Helper function to render the main content area
  const renderContent = () => {
    if (loading) {
      return <p className="loading-text">Loading blogs...</p>;
    }

    if (error) {
      return <p className="error-text">Failed to load blogs: {error}</p>;
    }

    if (posts.length === 0) {
      return <p className="loading-text">No public blogs found yet.</p>;
    }

    // Map over the fetched posts and render a card for each
    return (
      <div className="post-card-grid">
        {posts.map((post, index) => (
          <FadeInSection key={post.id}>
            <Link
              to={`/blog/${post.id}`}
              className="post-card-link"
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="post-card">
                {/* Display cover image if available */}
                {post.image_url && (
                  <img src={post.image_url} alt={post.title} className="post-card-image" />
                )}
                
                <div className="post-card-content">
                  <span className="post-card-category">{post.category || 'Blog'}</span>
                  <h3 className="post-card-title">{post.title}</h3>
                  {/* Generate excerpt from content if needed */}
                  <p className="post-card-excerpt">
                    {post.excerpt || (post.content ? post.content.substring(0, 100).replace(/<[^>]+>/g, '') + '...' : 'No excerpt.')}
                  </p>
                  {/* Display author username from joined profiles table */}
                  <div className="post-card-author">By {post.profiles?.username || 'User'}</div>
                </div>
              </div>
            </Link>
          </FadeInSection>
        ))}
      </div>
    );
  };

  return (
    <div className="page-wrapper light-theme">
      <NavBar />
      
      <div className="page-container"> {/* Uses shared container style */}
        <FadeInSection>
          <h1 className="page-title">Blog Posts</h1> {/* Uses shared title style */}
          <p className="page-subtitle"> {/* Uses shared subtitle style */}
            Explore the latest articles, tutorials, and insights from the community.
          </p>
        </FadeInSection>
        
        {/* Render loading, error, or the grid of posts */}
        {renderContent()}
        
      </div>
      
      <Footer />
    </div>
  );
};

export default BlogPage;