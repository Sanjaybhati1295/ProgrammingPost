// src/pages/Project/CreateProjectPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import NavBar from '../../components/NavBar/NavBar';
import Footer from '../../components/Footer/Footer';
import './ProjectPage.css'; // We'll create/use this shared CSS
import { FaSave, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

const CreateProjectPage = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [repoUrl, setRepoUrl] = useState('');
    const [isPublic, setIsPublic] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Redirect if user is not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setError('You must be logged in to create a project.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('projects')
                .insert([
                    {
                        user_id: user.id,
                        title: title,
                        description: description,
                        repo_url: repoUrl,
                        is_public: isPublic,
                    }
                ])
                .select() // Select the newly created record
                .single(); // Expect a single record back

            if (error) throw error;
            
            setLoading(false);
            toast.success('Project created successfully!', {
                duration: 4000,
                position: 'top-center',
            });
            // Navigate to the new project's detail page
            navigate(`/project/${data.id}`); 

        } catch (err) {
            setError(err.message);
            console.error("Error creating project:", err);
            setLoading(false);
        }
    };

    if (authLoading || !user) {
        return <div className="full-page-loader">Loading...</div>;
    }

    return (
        <div className="page-wrapper light-theme">
            <Toaster />
            <NavBar />
            <div className="project-form-container">
                <h1 className="page-title">Start a New Project</h1>
                <p className="page-subtitle">
                    Create a project to document your journey, share design docs, and track updates.
                </p>

                <form onSubmit={handleSubmit} className="project-form">
                    {error && <p className="form-error">{error}</p>}

                    <div className="form-group">
                        <label htmlFor="title">Project Title</label>
                        <input type="text" id="title" placeholder="My Awesome New App"
                            value={title} onChange={(e) => setTitle(e.target.value)} required disabled={loading} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Short Description</label>
                        <textarea id="description" rows="4" placeholder="What is your project about? (This is public)"
                            value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="repoUrl">GitHub Repository URL (Optional)</label>
                        <input type="url" id="repoUrl" placeholder="https://github.com/user/repo"
                            value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} disabled={loading} />
                    </div>

                    <div className="form-footer">
                        <div className="visibility-toggle">
                            <label>Visibility:</label>
                            <button type="button" onClick={() => setIsPublic(true)} className={`vis-button ${isPublic ? 'active' : ''}`} disabled={loading}>
                                <FaEye /> Public
                            </button>
                            <button type="button" onClick={() => setIsPublic(false)} className={`vis-button ${!isPublic ? 'active' : ''}`} disabled={loading}>
                                <FaEyeSlash /> Private
                            </button>
                        </div>
                        <button type="submit" className="button button-primary submit-button" disabled={loading}>
                            <FaSave /> {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
            <Footer />
        </div>
    );
};

// This is the important part!
export default CreateProjectPage;