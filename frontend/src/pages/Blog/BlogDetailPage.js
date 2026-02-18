import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import NavBar from '../../components/NavBar/NavBar';
import Footer from '../../components/Footer/Footer';
import DOMPurify from 'dompurify';
import './BlogPage.css'; 
import { FaCalendarAlt,FaPencilAlt, FaTrash } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css'; // MUST include a theme CSS

const BlogDetailPage = () => {
  const [post, setPost] = useState(null);
  const [authorUsername, setAuthorUsername] = useState('User');
  const [authorUserId, setAuthorUserId] = useState('User'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id: postId } = useParams();
  const { user } = useAuth(); 
  const [showConfirm, setShowConfirm] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!postId) {
        setError('No post ID provided.');
        setLoading(false);
        return;
      }
      try {
        const { data, error: fetchError } = await supabase
          .from('Blogs')
          .select(`*, profiles (id, username, full_name, profile_pic_url)`)
          .eq('id', postId)         
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Blog post not found.');
        if (data.tags && typeof data.tags === 'string') {
          try { data.tags = JSON.parse(data.tags); } catch (e) { data.tags = []; }
        }
        
        setPost(data);
        setAuthorUsername(data.profiles?.full_name || 'User'); 
        setAuthorUserId(data.profiles?.username || 'User'); 
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPostDetails();
  }, [postId]);

  const handleDeletePost = async () => {
    try {
      const { error } = await supabase
        .from('Blogs')
        .delete()
        .eq('id', postId); 
      if (error) throw error;

      toast.success("Post deleted successfully!");
      setTimeout(() => {
        window.location.href = '/blogs'; 
      }, 1000);
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Failed to delete the post.");
    }
  };

  const triggerPopup = (title, message, action) => {
      setModalConfig({
          title: title,
          message: message,
          onConfirm: () => {
              action(); 
              setShowConfirm(false);
          }
      });
      setShowConfirm(true);
  };

  const sanitizedContent = React.useMemo(() => {
  if (!post?.content) return '';

  const safeHTML = DOMPurify.sanitize(post.content, {
    ALLOWED_ATTR: ['style', 'class', 'src', 'alt', 'href', 'target'],
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'code', 'pre', 'ul', 'ol', 'li', 'img', 'span']
  });

  
  return safeHTML
      .replace(/\n/g, "") 
      .replace(/<p><br><\/p>/g, "<br />") 
      .replace(/(<br \/>)+$/g, "")
      .trim();
  }, [post?.content]);

  useEffect(() => {
    if (!loading && post) {
      const nodes = document.querySelectorAll('.blog-content-body pre code');
      nodes.forEach((node) => {
        hljs.highlightElement(node);
      });
    }
  }, [loading, post, sanitizedContent]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  // --- 4. Unified Conditional Rendering ---
  if (loading) return <div className="full-page-loader">Loading post...</div>;

  if (error || !post) {
    return (
      <div className="page-wrapper light-theme">
        <NavBar />
        <div className="page-container error-container">
          <h2>Post Not Found</h2>
          <p>{error || 'The requested blog post could not be found.'}</p>
          <Link to="/feed" className="button button-secondary">Back to Feed</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwner = user && user.id === post.user_id;
  const authorPic = post.profiles?.profile_pic_url || '';

  return (
    <div className="page-wrapper light-theme">
      <Toaster />
      <NavBar />
      <div className="blog-detail-container">
        {post.image_url && (
          <div className="blog-cover-image">
            <img src={post.image_url} alt={post.title} />
          </div>
        )}

        <header className="blog-header">
          <h1 className="blog-title">{post.title}</h1>
          <div className="blog-meta">
            <span>
              <img src={authorPic} alt={authorUsername} className='auther-profile-image'/>
              <Link to={`/profile/${authorUserId}`} className="author-link">{authorUsername}</Link> 
            </span>
            <span>
              <FaCalendarAlt /> Published : {formatDate(post.created_at)}
            </span>

            {isOwner && (
                <div className="owner-actions">
                  <Link to={`/write/${post.id}`}>
                    <button className="icon-button edit edit-delete-btn">
                      <FaPencilAlt style={{ marginRight: '8px', fontSize: '0.9em' }} />
                      Edit
                    </button>
                  </Link>
                  <button className="icon-button delete edit-delete-btn" 
                      onClick={() => triggerPopup(
                        "Delete Blog Post", 
                        "Are you sure? This action cannot be undone.", 
                        handleDeletePost
                      )}
                  >
                    <FaTrash style={{ marginRight: '8px' }} /> Delete
                  </button>
                </div>
              )}
          </div>
        </header>

        <div 
          className="blog-content-body blog-content-display" 
          dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
        />

        {post.tags && post.tags.length > 0 && (
            <div className="blog-tags">
                <strong>Tags:</strong> 
                {post.tags.map(tag => (
                    <span key={tag} className="tag-link">#{tag}</span>
                ))}
            </div>
        )}

        <hr className="content-divider" />
        <Link to="/blogs" className="button button-secondary back-link">&larr; Back to Blogs</Link>
      </div>
      <Footer />
      {showConfirm && (
          <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
              {/* e.stopPropagation prevents the modal from closing when you click inside the white box */}
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>{modalConfig.title}</h3>
                  <p>{modalConfig.message}</p>
                  <div className="modal-actions">
                      <button 
                          className="button button-secondary" 
                          onClick={() => setShowConfirm(false)}
                      >
                          Cancel
                      </button>
                      <button 
                          className="button button-danger" 
                          onClick={modalConfig.onConfirm}
                      >
                          Confirm Delete
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default BlogDetailPage;