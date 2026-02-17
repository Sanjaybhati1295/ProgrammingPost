// src/pages/StoriesPage/StoriesPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; // Adjusted path
import NavBar from '../../components/NavBar/NavBar';       // Adjusted path
import Footer from '../../components/Footer/Footer';       // Adjusted path
import FadeInSection from '../../components/FadeInSection/FadeInSection'; // Adjusted path
import '../../ContentPage.css'; // Uses the shared CSS for cards and layout

const StoriesPage = () => {
  const [projectDocs, setProjectDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch project documents/stories
    const fetchProjectStories = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch public project docs, joining with projects for title and profiles for username
        // Adjust the select query based on your needs and relationships
        const { data, error } = await supabase
          .from('Blogs')
          .select(`
            id,
            title,
            content, 
            created_at
          `)
          .eq('is_public', true) 
          .eq('content_type', 'story') // Only fetch public docs
          .order('created_at', { ascending: false }) // Latest first
          .limit(12); // Fetch a reasonable number for the page

        if (error) {
          throw error;
        }

        setProjectDocs(data || []);

      } catch (err) {
        console.error('Error fetching project stories:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectStories();
  }, []); // Run once on mount

  // Helper function to render content
  const renderContent = () => {
    if (loading) {
      return <p className="loading-text">Loading project stories...</p>;
    }

    if (error) {
      return <p className="error-text">Failed to load stories: {error}</p>;
    }

    if (projectDocs.length === 0) {
      return <p className="loading-text">No public project stories or updates found yet.</p>;
    }

    // Map over the fetched project documents
    return (
      <div className="post-card-grid">
        {projectDocs.map((doc, index) => (
          <FadeInSection key={doc.id}>
            {/* Adjust link as needed - maybe to the project detail page first? */}
            <Link
              to={`/project-update/${doc.id}`} // Or /project/:projectId/update/:docId
              className="post-card-link"
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="post-card"> 
                {/* No image assumed for project docs by default */}
                <div className="post-card-content">
                  {/* Display Project Title as category or primary info */}
                  <span className="post-card-category">{doc.projects?.title || 'Project Update'}</span>
                  <h3 className="post-card-title">{doc.title}</h3>
                  <p className="post-card-excerpt">
                    {/* Excerpt from the document content */}
                    {doc.content ? doc.content.substring(0, 100).replace(/<[^>]+>/g, '') + '...' : 'No details.'}
                  </p>
                  <div className="post-card-author">By {doc.profiles?.username || 'User'}</div>
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
      
      <div className="page-container"> 
        <FadeInSection>
          <h1 className="page-title">Project Stories & Updates</h1> 
          <p className="page-subtitle">
            Follow the journey and progress of projects shared by the community.
          </p>
        </FadeInSection>
        
        {renderContent()}
        
      </div>
      
      <Footer />
    </div>
  );
};

export default StoriesPage;