// src/pages/ProfilePage/ProfilePage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import NavBar from '../../components/NavBar/NavBar';
import Footer from '../../components/Footer/Footer';
import PostCard from '../../components/PostCard/PostCard'; 
import './ProfilePage.css';
import { FaGithub, FaLinkedin, FaUserCircle, FaEdit, FaPlus, FaCheck, FaTimes, FaHourglassHalf } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

const ProfilePage = () => {
    const { user } = useAuth();
    const { username } = useParams();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('loading');
    const [connectionId, setConnectionId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [confirmationTitle, setConfirmationTitle] = useState('');
    const [confirmationMessage, setConfirmationMessage] = useState('');

    const triggerConfirm = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            if (!username) {
                setError("No profile username provided.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            setConnectionStatus('loading');

            try {
                const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('username', username)
                        .single(); 
                if (profileError || !profileData) {
                    throw new Error('Profile not found.');
                }
                setProfile(profileData);

                const isOwn = currentUser && profileData.id === currentUser.id;
                setIsOwnProfile(isOwn);

                const { data: postData, error: postError } = await supabase
                    .from('Blogs')
                    .select('*, profiles(username, avatar_url, profile_pic_url)') // Join for author info
                    .eq('user_id', profileData.id)
                    .eq('visibility', 'public') // Only show public posts on profile
                    .order('created_at', { ascending: false });
                if (postError) throw postError;
                setPosts(postData || []);

                // 4. Check connection status if not viewing own profile
                if (currentUser && !isOwn) {
                    const { data: conn, error: connError } = await supabase
                        .from('connections')
                        .select('id, status, requester_id')
                        .or(`and(requester_id.eq.${currentUser.id},receiver_id.eq.${profileData.id}),and(requester_id.eq.${profileData.id},receiver_id.eq.${currentUser.id})`)
                        .maybeSingle();
                    if (connError) throw connError;
                    console.log('conn '+ JSON.stringify(conn));
                    if (!conn) {
                        setConnectionStatus('not_connected');
                    } else {
                        setConnectionId(conn.id);
                        if (conn.status === 'accepted') {
                            setConnectionStatus('connected');
                        } else if (conn.status === 'pending') {
                            if (conn.requester_id === currentUser.id) {
                                setConnectionStatus('pending_sent'); // I sent it
                            } else {
                                setConnectionStatus('pending_received'); // They sent it
                            }
                        } else {
                            setConnectionStatus('not_connected');
                        }
                    }
                } else if (isOwn) {
                    setConnectionStatus('own_profile');
                }

            } catch (err) {
                console.error(err.message);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username, currentUser]);

    // --- Action Handler to Send Friend Request ---
    const handleAddFriend = async () => {
        if (!currentUser) { 
            toast.error('Please log in to add a connection.', {
                duration: 4000,
                position: 'top-center',
            });
            return;
        }
        
        setConnectionStatus('loading');
        try {
            const { data, error } = await supabase
                .from('connections')
                .insert({ 
                    requester_id: currentUser.id, 
                    receiver_id: profile.id, 
                    status: 'pending' 
                })
                .select()
                .single();
            if (error) throw error;
            setConnectionStatus('pending_sent');
            setConnectionId(data.id);
        } catch (err) { 
            console.error("Error sending request:", err);
            setConnectionStatus('not_connected');
        }
    };
    
    // --- Other handlers (accept, decline, etc.) ---
    const handleAccept = async () => {
        if (!connectionId) return; // Safety check
        setConnectionStatus('loading');
         try {
            const { error } = await supabase
                .from('connections')
                .update({ status: 'accepted', updated_at: new Date() })
                .eq('id', connectionId);
            if (error) throw error;
            setConnectionStatus('connected');
        } catch (err) { 
            console.error("Error accepting request:", err);
            setConnectionStatus('pending_received'); 
        }
    };
    
    const handleDeclineOrCancel = async () => {
        if (!connectionId) return;
        setConnectionStatus('loading');
        try {
            const { error } = await supabase
                .from('connections')
                .delete()
                .eq('id', connectionId);
            if (error) throw error;
            setConnectionStatus('not_connected');
            setConnectionId(null);
        } catch (err) { 
            console.error("Error deleting connection:", err);
        }
    };

    const triggerPopup = (title, message) => {
        setConfirmationMessage(message);
        setConfirmationTitle(title);
        triggerConfirm(user);
    }

     const handleConfirm = () => {
        if(confirmationTitle === 'not_connected'){
            handleAddFriend();
            setConfirmationTitle('Connection Request');
        }else if(confirmationTitle === 'pending_sent'){
            handleDeclineOrCancel();
            setConfirmationTitle('Pending Request');
        }else if(confirmationTitle === 'pending_received'){
            handleDeclineOrCancel();
        }else if(confirmationTitle === 'connected'){
            handleDeclineOrCancel();
            setConfirmationTitle('Connection');
        }
        setIsModalOpen(false);
    };

    // --- Dynamic Button Logic ---
    const renderConnectionButton = () => {
        if (isOwnProfile) {
            return (
                <Link to="/profile/edit" className="button button-secondary profile-action-button">
                    <FaEdit /> Edit Profile
                </Link>
            );
        }
        
        // This is the button you're looking for!
        switch (connectionStatus) {
            case 'not_connected':
                return (
                    <button onClick={() => triggerPopup('not_connected',`Want to send a connection request?`)} 
                            className="button button-primary profile-action-button">
                            <FaPlus /> Add Connection
                    </button>
                );
            case 'pending_sent':
                return <button onClick={() => triggerPopup('pending_sent',`Want to remove a connection request?`)} 
                        className="button button-secondary profile-action-button">
                        <FaHourglassHalf /> Request Sent
                        </button>;
            case 'pending_received':
                return (
                    <div className="profile-request-actions">
                        <button onClick={handleDeclineOrCancel} className="button button-secondary decline"><FaTimes /> Decline</button>
                        <button onClick={handleAccept} className="button button-primary accept"><FaCheck /> Accept</button>
                    </div>
                );
            case 'connected':
                return <button onClick={() => triggerPopup('connected',`Want to remove connection? `)} className="button button-secondary profile-action-button"><FaCheck /> Connected</button>;
            case 'loading':
                return <button className="button button-secondary profile-action-button" disabled>Loading...</button>;
            default:
                return null;
        }
    };

    if (loading) { return <div className="full-page-loader">Loading Profile...</div>; }
    
    if (error || !profile) {
        return (
            <div className="page-wrapper light-theme">
                <NavBar />
                <div className="page-container error-container">
                    <h2>Profile Not Found</h2>
                    <p>{error || "The user you're looking for doesn't exist."}</p>
                    <Link to="/feed" className="button button-secondary">Back to Feed</Link>
                </div>
                <Footer />
            </div>
        );
    }

    const currentPic = profile?.profile_pic_url 
    ? `${profile.profile_pic_url}?t=${new Date().getTime()}`
    : 'default-avatar-url.png';
    
    return (
        <div className="page-wrapper light-theme">
            <Toaster />
            <NavBar />
            <div className="profile-page-container">
                <header className="profile-header-card">
                    <div className="current-pic-display" style={{ marginBottom: '20px' }}>
                    <img 
                        src={currentPic} 
                        alt="Current profile" 
                        style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    </div>
                    <div className="profile-details">
                        <div className="profile-name-row">
                            <h1 className="profile-full-name">{profile.full_name || profile.username}</h1>
                            {renderConnectionButton()}
                        </div>
                        <span className="profile-username">@{profile.username}</span>
                        <div className="profile-links">
                            {profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer"><FaGithub /> GitHub</a>}
                            {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"><FaLinkedin /> LinkedIn</a>}
                        </div>
                    </div>
                </header>
                
                <main className="profile-content-area">
                    <h2 className="profile-section-title">Public Posts</h2>
                    <div className="profile-posts-grid">
                        {posts.length > 0 ? (
                            posts.map(post => <PostCard key={post.id} post={post} />)
                        ) : (
                            <p className="placeholder-text">{profile.username} hasn't posted anything public yet.</p>
                        )}
                    </div>
                </main>
            </div>
            
            <Footer />
            <ConfirmModal 
                isOpen={isModalOpen}
                message={confirmationMessage}
                onConfirm={handleConfirm}
                onCancel={() => setIsModalOpen(false)}
            />
        </div>
        
    );
};

export default ProfilePage;