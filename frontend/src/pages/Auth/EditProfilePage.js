// src/pages/Auth/EditProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import NavBar from '../../components/NavBar/NavBar';
import Footer from '../../components/Footer/Footer';
import './AuthPage.css'; // Reuses the Auth CSS
import { FaSave } from 'react-icons/fa';
import ProfilePicUploader from '../../components/ProfilePicUploader/ProfilePicUploader';

const EditProfilePage = () => {
    const { user} = useAuth();
    const navigate = useNavigate();
    
    // Form state
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [phone, setPhone] = useState(''); // Added phone

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [currentProfileUrl, setProfileUrl] = useState('');

    // Fetch existing profile data
    useEffect(() => {
        if (user) {
            setLoading(true);
            const fetchProfile = async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (data) {
                    setUsername(data.username || '');
                    setFullName(data.full_name || '');
                    setBio(data.bio || '');
                    setGithubUrl(data.github_url || '');
                    setLinkedinUrl(data.linkedin_url || '');
                    setPhone(data.phone || ''); // Load phone
                    setProfileUrl(data.profile_pic_url);
                } else if (error) {
                    setError('Could not load profile. ' + error.message);
                }
                setLoading(false);
            };
            fetchProfile();
        }
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        // --- Username Validation (Simple) ---
        if (username.length < 3) {
            setError('Username must be at least 3 characters long.');
            setSaving(false);
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setError('Username can only contain letters, numbers, and underscores.');
            setSaving(false);
            return;
        }

        const profileData = {
            id: user.id,
            username,
            full_name: fullName,
            bio,
            github_url: githubUrl,
            linkedin_url: linkedinUrl,
            phone: phone === '' ? null : phone, // <-- CORRECTED LINE
            updated_at: new Date(),
        };

        try {
            // Upsert profile data
            const { error } = await supabase
                .from('profiles')
                .upsert(profileData, { onConflict: 'id' });

            if (error) {
                // Handle Supabase error (e.g., unique username constraint)
                if (error.code === '23505') {
                    throw new Error('This username is already taken.');
                }
                throw error;
            }
            
            setSuccess('Profile updated successfully!');
            setTimeout(() => navigate(`/profile/${username}`), 1500); // Redirect to profile

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const profileUrl = `${currentProfileUrl}?t=${Date.now()}`
    
    if (loading) { return <div className="full-page-loader">Loading Profile...</div>; }

    return (
        <div className="page-wrapper light-theme auth-page">
            <NavBar />
            <div className="auth-content">
                <div className="auth-container" style={{maxWidth: '700px'}}>
                    <h1 className="auth-title">Edit Your Profile</h1>
                    
                    {error && <p className="auth-error">{error}</p>}
                    {success && <p className="auth-success">{success}</p>}
                    <div className='profile-section'>
                        <div className='profile-preview-section'>
                            <img 
                                src={profileUrl} 
                                alt="Current Profile" 
                                className="user-profile-img"
                            />
                        </div>
                        <div className='edit-profile-section'>
                            <ProfilePicUploader />
                        </div>
                    </div>
                    <form onSubmit={handleSave} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input type="email" id="email" value={user.email} disabled />
                            <small>Email cannot be changed here.</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input type="text" id="username" value={username} 
                                onChange={(e) => setUsername(e.target.value)} required disabled={saving} />
                            <small>Must be unique. (e.g., @{username})</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="fullName">Full Name</label>
                            <input type="text" id="fullName" value={fullName} 
                                onChange={(e) => setFullName(e.target.value)} disabled={saving} />
                        </div>
                         <div className="form-group">
                            <label htmlFor="bio">Bio</label>
                            <textarea id="bio" rows="4" value={bio} 
                                onChange={(e) => setBio(e.target.value)} disabled={saving} 
                                placeholder="Tell the community a bit about yourself..." />
                        </div>
                         <div className="form-group">
                            <label htmlFor="phone">Phone</label>
                            <input type="tel" id="phone" value={phone} 
                                onChange={(e) => setPhone(e.target.value)} disabled={saving} />
                        </div>
                         <div className="form-group">
                            <label htmlFor="githubUrl">GitHub URL</label>
                            <input type="url" id="githubUrl" value={githubUrl} 
                                onChange={(e) => setGithubUrl(e.target.value)} disabled={saving} 
                                placeholder="https://github.com/your-username" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="linkedinUrl">LinkedIn URL</label>
                            <input type="url" id="linkedinUrl" value={linkedinUrl} 
                                onChange={(e) => setLinkedinUrl(e.target.value)} disabled={saving} 
                                placeholder="https://linkedin.com/in/your-username" />
                        </div>
                        
                        <button type="submit" className="button button-primary auth-button" disabled={saving}>
                            <FaSave /> {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default EditProfilePage;