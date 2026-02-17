// src/pages/NotificationsPage/NotificationsPage.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext'; // Correct import
import { Link, useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar/NavBar';
import Footer from '../../components/Footer/Footer';
import './NotificationsPage.css';
import { FaCheck, FaTimes, FaUserCircle } from 'react-icons/fa';

const NotificationsPage = () => {
    // Get the loading state *and* the user
    const { user, loading: authLoading } = useAuth(); 
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchRequests = async () => {
            setLoading(true);
            setError(null);
            console.log('user id '+user.id);
            try {
                const { data, error } = await supabase
                    .from('connections')
                    .select(`
                        id,
                        requester_id,
                        requester_profile:profiles!connections_requester_id_fkey ( username, full_name, avatar_url )
                    `)
                    .eq('receiver_id', user.id)
                    .eq('status', 'pending');
                
                if (error) throw error;
                console.log('data '+JSON.stringify(data));
                const formattedRequests = data.map(req => ({
                    ...req,
                    profile: req.requester_profile // Use the new object name
                }));
                setRequests(formattedRequests || []);

            } catch (err) {
                setError(err.message);
                console.error("Error fetching requests:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [user, navigate]); // Add authLoading to dependency array

    // ... (Your handleAccept and handleDecline functions remain the same) ...
   const handleAccept = async (requestId) => {
        try {
            const { error } = await supabase
                .from('connections')
                .update({ status: 'accepted', updated_at: new Date() })
                .eq('id', requestId);
            
            if (error) throw error;
            // Remove the request from the list locally
            setRequests(requests.filter(req => req.id !== requestId));
        } catch (err) {
            console.error("Error accepting request:", err);
        }
    };

    // Handle Decline Request
    const handleDecline = async (requestId) => {
         try {
            // You can either delete the row or set status to 'declined'
            // Deleting is cleaner for a simple system.
            const { error } = await supabase
                .from('connections')
                .delete()
                .eq('id', requestId);
            
            if (error) throw error;
            setRequests(requests.filter(req => req.id !== requestId));
        } catch (err) {
            console.error("Error declining request:", err);
        }
    };

    // Show a full-page loader while auth is checking
    if (authLoading) {
        return <div className="full-page-loader">Loading...</div>;
    }

    return (
        <div className="page-wrapper light-theme">
            <NavBar />
            <div className="page-container notifications-container">
                <h1 className="page-title">Connection Requests</h1>
                
                {loading && <p className="loading-text">Loading requests...</p>}
                {error && <p className="error-text">{error}</p>}
                
                {!loading && requests.length === 0 && (
                    <p className="loading-text">You have no pending connection requests.</p>
                )}
                
                <div className="request-list">
                    {requests.map(req => (
                        <div className="request-list">
                            {requests.map(req => (
                                <div key={req.id} className="request-card">
                                        <div className="request-profile">
                                            {/* --- ADD '?' HERE --- */}
                                            {req.profile?.avatar_url ? ( 
                                                <img src={req.profile.avatar_url} alt="avatar" className="request-avatar" />
                                            ) : (
                                                <FaUserCircle className="request-avatar-icon" />
                                            )}
                                            <div className="request-info">
                                                {/* --- ADD '?' HERE --- */}
                                                <Link to={`/profile/${req.profile?.username}`} className="request-name">
                                                    {req.profile?.full_name || req.profile?.username || 'Unknown User'}
                                                </Link>
                                                {/* --- ADD '?' HERE --- */}
                                                <span className="request-username">@{req.profile?.username || '...'}</span>
                                            </div>
                                        </div>
                                        <div className="request-actions">
                                            <button onClick={() => handleDecline(req.id)} className="button button-secondary request-button decline">
                                                <FaTimes /> Decline
                                            </button>
                                            <button onClick={() => handleAccept(req.id)} className="button button-primary request-button accept">
                                                <FaCheck /> Accept
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            ))}
                        </div>
            </div>
            <Footer />
        </div>
    );
};

export default NotificationsPage;