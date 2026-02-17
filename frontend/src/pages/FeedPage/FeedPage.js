// src/pages/FeedPage/FeedPage.js
import React, { useState, useEffect } from 'react'; // Import React, useState, useEffect
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate
import { supabase } from '../../supabaseClient'; // Import supabase
import NavBar from '../../components/NavBar/NavBar'; // Import NavBar
import Footer from '../../components/Footer/Footer'; // Import Footer
import FadeInSection from '../../components/FadeInSection/FadeInSection'; // Import FadeInSection
import PostCard from '../../components/PostCard/PostCard'; // Import PostCard
import { useAuth } from '../../context/AuthContext';
import './FeedPage.css';
import { 
    FaPenSquare, 
    FaCode, 
    FaRocket, 
    FaUserCircle, 
    FaFilter, 
    FaHome, 
    FaUsers 
} from 'react-icons/fa'; // Import all necessary icons

const FeedPage = () => {
    // --- All hooks must be at the top level ---
    const { user, loading: authLoading } = useAuth(); // Define user and authLoading
    const [feedItems, setFeedItems] = useState([]);
    const [loadingFeed, setLoadingFeed] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Define navigate
    const [activeFeedFilter, setActiveFeedFilter] = useState('feed'); // Define activeFeedFilter
    const [connections, setConnections] = useState([]);
    const [loadingConnections, setLoadingConnections] = useState(true);
    const [followSuggestions, setFollowSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    // --- End hooks ---

    // Main useEffect for fetching the feed based on the filter
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
        if (user) {
            const fetchFeed = async () => {
                setLoadingFeed(true);
                setError(null);
                const currentUserId = user.id;

                try {
                    // Start building the query
                    let query = supabase
                        .from('Blogs')
                        .select('*, profiles(username, avatar_url, profile_pic_url)');

                    // Dynamic query logic
                    if (activeFeedFilter === 'feed') {
                        // Get IDs of all accepted connections
                        const { data: connections, error: connectionsError } = await supabase
                            .from('connections')
                            .select('requester_id, receiver_id')
                            .eq('status', 'accepted')
                            .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);
                        
                        if (connectionsError) throw connectionsError;

                        const friendIds = connections.map(conn => 
                            conn.requester_id === currentUserId ? conn.receiver_id : conn.requester_id
                        );
                        
                        const userIdsToFetch = [currentUserId, ...friendIds];

                        // Fetch posts from self and friends, that are not private
                        query = query
                            .in('user_id', userIdsToFetch)
                            .in('content_type', ['blog', 'story'])
                            .in('visibility', ['public', 'connections'])
                            .order('created_at', { ascending: false })
                            .limit(20);

                    } else if (activeFeedFilter === 'my_blogs') {
                        // Fetch only the user's blogs
                        query = query
                            .eq('user_id', currentUserId)
                            .eq('content_type', 'blog')
                            .order('created_at', { ascending: false });

                    } else if (activeFeedFilter === 'my_stories') {
                        // Fetch only the user's project stories
                        query = query
                            .eq('user_id', currentUserId)
                            .eq('content_type', 'story')
                            .order('created_at', { ascending: false });
                    }

                    // Execute the built query
                    const { data, error } = await query;
                    console.log('data :: '+ JSON.stringify(data));
                    if (error) throw error;
                    setFeedItems(data || []);

                } catch (err) {
                    console.error("Error fetching feed:", err);
                    setError(err.message);
                } finally {
                    setLoadingFeed(false);
                }
            };
            fetchFeed();
        }
    }, [user?.id, authLoading, navigate, activeFeedFilter]);

    // useEffect to fetch connections for the sidebar
    useEffect(() => {
        if (user) {
            const currentUserId = user.id;

            const fetchSidebarData = async () => {
                setLoadingConnections(true);
                setLoadingSuggestions(true);
                
                try {
                    // --- NEW: Fetch current user's profile ---
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('username, full_name, profile_pic_url') // Get just what we need
                        .eq('id', currentUserId)
                        .single();

                    if (profileError) throw new Error("Could not fetch your profile.");
                    setCurrentUserProfile(profileData); // Save your profile data

                    // 1. Get ALL my connections (requester or receiver)
                    const { data: connectionsData, error: connectionsError } = await supabase
                        .from('connections')
                        .select('requester_id, receiver_id, status')
                        .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);
                    
                    if (connectionsError) throw connectionsError;

                    // 2. Create a list of ALL user IDs I have a relationship with
                    const connectedIds = connectionsData.map(conn => 
                        conn.requester_id === currentUserId ? conn.receiver_id : conn.requester_id
                    );

                    // 3. Get profiles for "My Connections" list (ONLY accepted friends)
                    const acceptedFriendIds = connectionsData
                        .filter(c => c.status === 'accepted')
                        .map(conn => conn.requester_id === currentUserId ? conn.receiver_id : conn.requester_id);

                    if (acceptedFriendIds.length > 0) {
                        const { data: profilesData, error: profilesError } = await supabase
                            .from('profiles')
                            .select('id, username, full_name, avatar_url, profile_pic_url')
                            .in('id', acceptedFriendIds)
                            .limit(10);
                        if (profilesError) throw profilesError;
                        setConnections(profilesData || []);
                    } else {
                        setConnections([]);
                    }
                    setLoadingConnections(false);

                    // 4. Get profiles for "Who to Follow" list
                    const idsToExclude = [currentUserId, ...connectedIds];
                    
                    const { data: suggestionsData, error: suggestionsError } = await supabase
                        .from('profiles')
                        .select('id, username, full_name, avatar_url')
                        .not('id', 'in', `(${idsToExclude.join(',')})`)
                        .limit(5);
                    
                    if (suggestionsError) throw suggestionsError;
                    setFollowSuggestions(suggestionsData || []);
                    
                } catch (err) {
                    console.error("Error fetching sidebar data:", err.message);
                    // Set a generic error for the sidebar
                } finally {
                    setLoadingConnections(false);
                    setLoadingSuggestions(false);
                }
            };
            fetchSidebarData();
        }
    }, [user]);

    // Helper to render the correct "empty" message
    const renderEmptyMessage = () => {
        if (activeFeedFilter === 'feed') {
            return "Your feed is empty. Connect with other users to see their posts!";
        }
        if (activeFeedFilter === 'my_blogs') {
            return "You haven't posted any blogs yet. Start writing one!";
        }
        if (activeFeedFilter === 'my_stories') {
            return "You haven't posted any project stories yet. Start one!";
        }
        return "No posts found.";
    };

    if (authLoading || !user) {
        return <div className="full-page-loader">Loading...</div>;
    }
    
    const username = currentUserProfile?.username || user?.email?.split('@')[0];
    const displayUserName = currentUserProfile?.full_name || user?.email?.split('@')[0];
    const currentPic = currentUserProfile?.profile_pic_url 
    ? currentUserProfile.profile_pic_url 
    : 'default-avatar-url.png';

    return (
        <div className="page-wrapper light-theme">
            <NavBar />
            <div className="feed-page-container feed-layout">

                 <aside className="feed-sidebar-left">
                    <FadeInSection>
                        <div className="sidebar-card profile-card-mini">
                            <img 
                                src={currentPic} 
                                alt="Current profile" 
                                style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                             <div>
                                <span className="profile-name-mini">{displayUserName}</span>
                                <Link to={`/profile/${username}`} className="view-profile-link">View Profile</Link>
                             </div>
                        </div>
                    </FadeInSection>
                     <FadeInSection>
                         <div className="sidebar-card filter-nav">
                             <h4><FaFilter /> Feed</h4>
                             <button 
                                className={`filter-button ${activeFeedFilter === 'feed' ? 'active' : ''}`}
                                onClick={() => setActiveFeedFilter('feed')}
                             >
                                 <FaHome /> My Feed
                             </button>
                             <button 
                                className={`filter-button ${activeFeedFilter === 'my_blogs' ? 'active' : ''}`}
                                onClick={() => setActiveFeedFilter('my_blogs')}
                             >
                                 <FaPenSquare /> My Blogs
                             </button>
                             <button 
                                className={`filter-button ${activeFeedFilter === 'my_stories' ? 'active' : ''}`}
                                onClick={() => setActiveFeedFilter('my_stories')}
                             >
                                 <FaRocket /> My Project Stories
                             </button>
                         </div>
                     </FadeInSection>
                </aside>

                <main className="feed-main-content">
                    <FadeInSection>
                        <div className="create-post-prompt" onClick={() => navigate('/write')}>
                            <img 
                                src={currentPic} 
                                alt="Current profile" 
                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <span className="prompt-text">What's on your mind, {username}?</span>
                            <button className="prompt-button button button-primary"><FaPenSquare /></button>
                        </div>
                    </FadeInSection>
                    
                    {loadingFeed && <p className="loading-text">Loading...</p>}
                    {error && <p className="error-text">Error loading feed: {error}</p>}
                    {!loadingFeed && feedItems.length === 0 && (
                        <p className="loading-text">{renderEmptyMessage()}</p>
                    )}
                    {!loadingFeed && feedItems.map((item) => (
                        <FadeInSection key={item.id}>
                            <PostCard post={item} />
                        </FadeInSection>
                    ))}
                </main>

                 <aside className="feed-sidebar-right">
                     <FadeInSection>
                        <div className="sidebar-card">
                            <h4><FaUsers /> My Connections</h4>
                            {loadingConnections ? (
                                <p className="placeholder-text">Loading...</p>
                            ) : connections.length > 0 ? (
                                <ul className="connection-list">
                                    {connections.map(profile => (
                                        <li key={profile.id} className="connection-item">
                                            <Link to={`/profile/${profile.username}`}>
                                                {profile.profile_pic_url ? (
                                                    <img src={profile.profile_pic_url} alt={profile.username} className="connection-avatar" />
                                                ) : (
                                                    <FaUserCircle className="connection-avatar-icon" />
                                                )}
                                                <div className="connection-info">
                                                    <span className="connection-name">{profile.full_name || profile.username}</span>
                                                    <span className="connection-username">@{profile.username}</span>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="placeholder-text">You haven't made any connections yet.</p>
                            )}
                        </div>
                    </FadeInSection>
                     
                     <FadeInSection>
                        <div className="sidebar-card">
                            <h4>Who to Follow</h4>
                            {loadingSuggestions ? (
                                <p className="placeholder-text">Finding new users...</p>
                            ) : followSuggestions.length > 0 ? (
                                <ul className="connection-list">
                                    {followSuggestions.map(profile => (
                                        <li key={profile.id} className="connection-item">
                                            <Link to={`/profile/${profile.username}`}>
                                                {profile.avatar_url ? (
                                                    <img src={profile.avatar_url} alt={profile.username} className="connection-avatar" />
                                                ) : (
                                                    <FaUserCircle className="connection-avatar-icon" />
                                                )}
                                                <div className="connection-info">
                                                    <span className="connection-name">{profile.full_name || profile.username}</span>
                                                    <span className="connection-username">@{profile.username}</span>
                                                </div>
                                                <Link to={`/profile/${profile.username}`} className="follow-button-small">
                                                    View
                                                </Link>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="placeholder-text">No new users to suggest.</p>
                            )}
                            <Link to="/discover" className="view-all-link">View All</Link>
                        </div>
                    </FadeInSection>
                 </aside>
            </div>
            <Footer />
        </div>
    );
};

export default FeedPage;