// src/pages/DiscoverPage/DiscoverPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import NavBar from '../../components/NavBar/NavBar';
import Footer from '../../components/Footer/Footer';
import './DiscoverPage.css'; // New CSS file
import { FaUserCircle, FaPlus } from 'react-icons/fa';

const PAGE_SIZE = 12; // Number of users per page

const DiscoverPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0); // Current page (0-indexed)
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchUsers = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. Get IDs of current user and all their connections
                const { data: connectionsData, error: connectionsError } = await supabase
                    .from('connections')
                    .select('requester_id, receiver_id')
                    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
                
                if (connectionsError) throw connectionsError;
                
                const connectedIds = connectionsData.map(conn => 
                    conn.requester_id === user.id ? conn.receiver_id : conn.requester_id
                );
                const idsToExclude = [user.id, ...connectedIds];

                // 2. Fetch paginated users, excluding self and connections
                const from = page * PAGE_SIZE;
                const to = from + PAGE_SIZE - 1;

                const { data, error, count } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url, bio', { count: 'exact' })
                    .not('id', 'in', `(${idsToExclude.join(',')})`)
                    .order('created_at', { ascending: false })
                    .range(from, to);
                
                if (error) throw error;

                setUsers(data || []);
                setTotalPages(Math.ceil(count / PAGE_SIZE));

            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [user, navigate, page]); // Re-fetch when page changes

    return (
        <div className="page-wrapper light-theme">
            <NavBar />
            <div className="page-container discover-container">
                <h1 className="page-title">Discover Developers</h1>
                <p className="page-subtitle">Find new users and grow your connections.</p>
                
                {loading && <p className="loading-text">Loading...</p>}
                {error && <p className="error-text">{error}</p>}
                
                {!loading && (
                    <>
                        <div className="discover-grid">
                            {users.map(profile => (
                                <div key={profile.id} className="discover-user-card">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.username} className="discover-avatar" />
                                    ) : (
                                        <FaUserCircle className="discover-avatar-icon" />
                                    )}
                                    <h3 className="discover-name">{profile.full_name || profile.username}</h3>
                                    <span className="discover-username">@{profile.username}</span>
                                    <p className="discover-bio">{profile.bio || 'No bio yet.'}</p>
                                    <Link to={`/profile/${profile.username}`} className="button button-primary discover-button">
                                        <FaPlus /> View Profile
                                    </Link>
                                </div>
                            ))}
                        </div>

                        {/* --- PAGINATION --- */}
                        <div className="pagination-controls">
                            <button 
                                onClick={() => setPage(p => p - 1)} 
                                disabled={page === 0}
                                className="button button-secondary"
                            >
                                &larr; Previous
                            </button>
                            <span>Page {page + 1} of {totalPages}</span>
                            <button 
                                onClick={() => setPage(p => p + 1)} 
                                disabled={page + 1 >= totalPages}
                                className="button button-secondary"
                            >
                                Next &rarr;
                            </button>
                        </div>
                    </>
                )}
                {!loading && users.length === 0 && <p className="loading-text">No more users to show.</p>}
            </div>
            <Footer />
        </div>
    );
};

export default DiscoverPage;