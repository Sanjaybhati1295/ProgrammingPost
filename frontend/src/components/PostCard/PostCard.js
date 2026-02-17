// src/components/PostCard/PostCard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import './PostCard.css';
import { FaHeart, FaRegHeart, FaCommentAlt, FaRegCommentAlt, FaPenSquare, FaRocket, FaUserCircle, FaCode } from 'react-icons/fa';

const PostCard = ({ post }) => {
    const { user } = useAuth();
    const [likeCount, setLikeCount] = useState(post.like_count || 0);
    const [hasLiked, setHasLiked] = useState(false);
    
    // ... (Your existing useEffect and handleLike function remain the same) ...
    useEffect(() => { /* ... */ }, [post.id, user]);
    const handleLike = async () => { /* ... */ };

    // --- DYNAMIC LINK AND ICON LOGIC (FIXED) ---
    let postType, PostIcon, postLink;
    
    if (post.content_type === 'blog') {
        postType = 'Blog Post';
        PostIcon = FaPenSquare;
        postLink = `/blog/${post.id}`; // Links to BlogDetailPage
    } else if (post.content_type === 'story') {
        postType = 'Project Story';
        PostIcon = FaRocket;
        postLink = `/blog/${post.id}`; // <-- FIX: ALSO links to BlogDetailPage
    } else {
        // This must be a code review (which doesn't have content_type)
        postType = 'Code Review';
        PostIcon = FaCode;
        postLink = `/code-review/${post.id}`; // Links to CodeReviewDetailPage
    }
    // --- END DYNAMIC LOGIC ---

    return (
        <div className={`post-card-container ${post.content_type || 'review'}`}>
            <div className="post-card-header">
                {post.profiles.profile_pic_url ? (
                    <img src={post.profiles.profile_pic_url} alt="Post cover" className="feed-profile-image" />
                ) : <FaUserCircle className="post-avatar" />}
                <div>
                    <Link to={`/profile/${post.profiles?.username}`} className="post-author-name">
                        {post.profiles?.username || 'User'}
                    </Link>
                    <p className="post-timestamp">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
                <div className="post-type-badge">
                    <PostIcon /> {postType}
                </div>
            </div>

            <div className="post-card-content">
                <Link to={postLink}> {/* Use the corrected postLink */}
                    <h3 className="post-title">{post.title}</h3>
                    {post.image_url && (
                        <img src={post.image_url} alt="Post cover" className="post-cover-image" />
                    )}
                    <p className="post-excerpt">
                         {/* Use description for code review, content for blogs */}
                         {post.description || post.excerpt || (post.content ? post.content.substring(0, 150).replace(/<[^>]+>/g, '') + '...' : '')}
                    </p>
                </Link>
            </div>

        </div>
    );
};

export default PostCard;