// src/pages/HomePage/HomePage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; // Adjusted path
import NavBar from '../../components/NavBar/NavBar'; // Adjusted path
import Footer from '../../components/Footer/Footer'; // Adjusted path
import FadeInSection from '../../components/FadeInSection/FadeInSection'; // Adjusted path
import './HomePage.css';
import { FaPenSquare, FaCodeBranch, FaRocket, FaArrowRight, FaRss } from 'react-icons/fa';

// --- Card Components (Simplified - Reuse from FeedPage or ContentPage styles) ---
// You might want to create these as separate reusable components later
const PublicBlogCard = ({ post }) => (
    <div className="content-card blog-card">
        {post.image_url && <img src={post.image_url} alt={post.title} className="card-image-preview-sm" />}
        <div className="card-content">
            <span className="card-category">{post.category || 'Blog'}</span>
            <h4 className="card-title"><Link to={`/blog/${post.id}`}>{post.title}</Link></h4>
            <p className="card-excerpt-sm">{post.excerpt || (post.content ? post.content.substring(0, 80).replace(/<[^>]+>/g, '') + '...' : '')}</p>
            <span className="card-author">by {post.profiles?.username || 'User'}</span>
        </div>
    </div>
);

const PublicCodeReviewCard = ({ review }) => (
     <div className="content-card review-card">
         {/* Icon or visual cue for code */}
         <div className="card-content">
            <span className="card-category">{review.language || 'Code Review'}</span>
            <h4 className="card-title"><Link to={`/code-review/${review.id}`}>{review.title}</Link></h4>
            <p className="card-excerpt-sm">{review.description?.substring(0, 80) + '...' || 'Snippet for review'}</p>
             <span className="card-author">by {review.profiles?.username || 'User'}</span>
        </div>
    </div>
);

const PublicProjectCard = ({ project }) => (
     <div className="content-card project-card">
        {/* Project specific icon/visual */}
        <div className="card-content">
            {/* Maybe add project tags */}
            <h4 className="card-title"><Link to={`/project/${project.id}`}>{project.title}</Link></h4>
            <p className="card-excerpt-sm">{project.description?.substring(0, 80) + '...' || 'Project Overview'}</p>
             <span className="card-author">by {project.profiles?.username || 'User'}</span>
        </div>
    </div>
);
// --- End Card Components ---


const HomePage = () => {
    const [activeTab, setActiveTab] = useState('blogs'); // 'blogs', 'reviews', 'projects'
    const [publicContent, setPublicContent] = useState({ blogs: [], projects: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPublicContent = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch latest public items for each category
                const [blogsRes, projectsRes] = await Promise.all([
                    supabase.from('Blogs').select('*, profiles(username)').eq('content_type', 'blog').order('created_at', { ascending: false }).limit(6),
                    supabase.from('Blogs').select('*, profiles(username)').eq('content_type', 'story').order('created_at', { ascending: false }).limit(6)
                ]);

                // Basic error check (improve as needed)
                if (blogsRes.error) throw blogsRes.error;
                if (projectsRes.error) throw projectsRes.error;

                setPublicContent({
                    blogs: blogsRes.data || [],
                    projects: projectsRes.data || []
                });

            } catch (err) {
                console.error("Error fetching public content:", err);
                setError("Could not load public content.");
            } finally {
                setLoading(false);
            }
        };

        fetchPublicContent();
    }, []); // Fetch once on mount

    const renderTabContent = () => {
        if (loading) return <p className="loading-text">Loading content...</p>;
        if (error) return <p className="error-text">{error}</p>;

        let items = [];
        let CardComponent;

        switch (activeTab) {
            case 'projects':
                items = publicContent.projects;
                CardComponent = PublicProjectCard;
                break;
            case 'blogs':
            default:
                items = publicContent.blogs;
                CardComponent = PublicBlogCard;
                break;
        }

        if (items.length === 0) {
            return <p className="loading-text">No public {activeTab} found yet.</p>;
        }

        return (
            <div className="tab-content-grid">
                {items.map(item => <CardComponent key={item.id} {...{[activeTab === 'blogs' ? 'post' :  'project']: item}} />)}
            </div>
        );
    };


    return (
        <div className="page-wrapper light-theme">
            <NavBar />

            {/* --- Hero Section --- */}
            <header className="hero-section homepage-hero"> {/* Add specific class */}
                <div className="hero-content page-container">
                    <FadeInSection>
                        <h1 className="hero-title">
                            The <span className="highlight-primary">Developer Hub</span> for
                            <br/>Sharing, Learning & Building.
                        </h1>
                    </FadeInSection>
                    <FadeInSection>
                        <p className="hero-subtitle">
                           Publish blogs, get code reviews, document projects, and connect.
                           Explore the latest from the ProgrammingPost community below.
                        </p>
                    </FadeInSection>
                    <FadeInSection>
                         {/* Simplified CTA */}
                        <Link to="/signup" className="button button-primary hero-button large">
                            Join the Community <FaArrowRight />
                        </Link>
                    </FadeInSection>
                </div>
            </header>

            {/* --- Tabbed Content Section --- */}
            <section className="tabbed-section page-container">
                <FadeInSection>
                    <div className="tabs-container">
                        <button
                            className={`tab-button ${activeTab === 'blogs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('blogs')}
                        >
                            <FaPenSquare /> Latest Blogs
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
                            onClick={() => setActiveTab('projects')}
                        >
                            <FaRocket /> Public Projects
                        </button>
                    </div>
                </FadeInSection>

                <FadeInSection>
                    <div className="tab-content">
                        {renderTabContent()}
                    </div>
                     {/* Link to see more */}
                     <div className="view-more-link">
                         <Link to={`/${activeTab}`} className="button button-secondary">
                             View All {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} <FaRss />
                         </Link>
                     </div>
                </FadeInSection>
            </section>

            {/* You can add other sections back if desired */}

            <Footer />
        </div>
    );
};

export default HomePage;