// src/pages/Blog/WriteBlogPage.js
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'highlight.js/styles/atom-one-light.css';
import hljs from 'highlight.js';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import NavBar from '../../components/NavBar/NavBar';
import Footer from '../../components/Footer/Footer';
import './BlogPage.css';
import { v4 as uuidv4 } from 'uuid';
import { FaUpload, FaSave, FaEye, FaLock, FaUsers, FaPenSquare, FaRocket } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

// Configure highlight.js (add more languages as needed)
hljs.configure({
  languages: ['javascript', 'jsx', 'python', 'java', 'sql', 'json', 'css', 'html', 'shell']
});

const WriteBlogPage = () => {
    const { id: postId } = useParams();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // --- State for all form fields ---
    const [contentType, setContentType] = useState('blog');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [coverImageUrl, setCoverImageUrl] = useState(null);
    const [visibility, setVisibility] = useState('public');

    // --- UI State ---
    const [coverImageUploading, setCoverImageUploading] = useState(false);
    const [loading, setLoading] = useState(false); // For saving the post
    const [fetchLoading, setFetchLoading] = useState(!!postId); // For loading existing post
    const [error, setError] = useState(null);

    // --- Ref for Quill Editor ---
    const quillRef = useRef(null);

    // --- Effect for fetching post data if editing ---
    useEffect(() => {
        if (postId && user) {
            if (postId && user && !content) {
                setFetchLoading(true);
                const fetchPost = async () => {
                    try {
                        const { data, error } = await supabase
                            .from('Blogs')
                            .select('*')
                            .eq('id', postId)
                            .eq('user_id', user.id)
                            .single();
                        if (error) throw error;
                        if (data) {
                            console.log("Raw tags from DB:", data.tags);
                            console.log("Transformed tags for state:", Array.isArray(data.tags) ? data.tags.join(', ') : 'Not an array');
                            const cleanContentFromDB = data.content ? data.content.replace(/\n/g, '') : '';
                            setContentType(data.content_type || 'blog');
                            setTitle(data.title);
                            setContent(cleanContentFromDB);
                            setTags(Array.isArray(data.tags) ? data.tags.join(', ') : '');
                            setCoverImageUrl(data.image_url);
                            setVisibility(data.visibility || 'public');
                            if (data.tags) {
                                let tagValue = data.tags;
                                if (Array.isArray(tagValue)) {
                                    setTags(tagValue.join(', '));
                                } 
                                else if (typeof tagValue === 'string' && tagValue.startsWith('[')) {
                                    try {
                                        const parsed = JSON.parse(tagValue);
                                        setTags(parsed.join(', '));
                                    } catch (e) {
                                        setTags(tagValue.replace(/[\[\]"']/g, ''));
                                    }
                                } 
                                else {
                                    setTags(tagValue);
                                }
                            } else {
                                setTags('');
                            }
                        }
                    } catch (err) {
                        setError(err.message);
                    } finally {
                        setFetchLoading(false);
                    }
                };
                fetchPost();
            } else if (!postId) {
                setFetchLoading(false);
            }
        }
    }, [postId, user]);

    // --- Cover Image Upload Function ---
    const handleCoverImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setCoverImageUploading(true);
        setError(null);
        const fileName = `${uuidv4()}-${file.name}`;
        
        try {
            const { data, error } = await supabase.storage
                .from('images')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });
            if (error) throw error;
            const { data: publicURLData } = supabase.storage
                .from('images')
                .getPublicUrl(data.path);
            if (!publicURLData) throw new Error('Could not get public URL');
            setCoverImageUrl(publicURLData.publicUrl);
        } catch (uploadError) {
            console.error('Cover Image Upload Error:', uploadError);
            setError(`Cover image upload failed: ${uploadError.message}`);
        } finally {
            setCoverImageUploading(false);
        }
    };

    // --- Quill Modules & Image Handler (Stable Version) ---
    const modules = useMemo(() => {
        const imageHandler = () => {
            if (!quillRef.current) {
                console.error("Quill Ref is not available");
                return;
            }
            const editor = quillRef.current.getEditor();
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();

            input.onchange = async () => {
                const file = input.files[0];
                if (!file) return;
                const fileName = `${uuidv4()}-${file.name}`;
                
                try {
                    console.log("Uploading editor image to Supabase...");
                    const { data, error } = await supabase.storage
                        .from('images')
                        .upload(fileName, file, { cacheControl: '3600', upsert: false });
                    if (error) throw error;
                    
                    const { data: publicURLData } = supabase.storage
                        .from('images')
                        .getPublicUrl(data.path);
                    if (!publicURLData) throw new Error('Could not get public URL');
                    
                    const publicUrl = publicURLData.publicUrl;
                    const range = editor.getSelection(true);
                    editor.insertEmbed(range.index, 'image', publicUrl);
                    editor.setSelection(range.index + 1);
                } catch (uploadError) {
                    setError(`Editor image upload failed: ${uploadError.message}`);
                }
            };
        };
        

        // Return the full modules configuration
        return {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, false] }, { 'font': [] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'indent': '-1' }, { 'indent': '+1' }],
                    [{ 'align': [] }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['link', 'image', 'video'],
                    ['clean']
                ],
                handlers: {
                    image: imageHandler, // Wire up the stable handler
                }
            },
            syntax: {
                highlight: text => hljs.highlightAuto(text).value,
            },
            clipboard: {
                matchVisual: false,
            },
        };
    }, []); // Empty dependency array ensures this is created only once

    // --- Handle Form Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) { setError('You must be logged in.'); return; }
        setLoading(true);
        setError(null);

        const contentForDB = content.replace(/\n/g, '');
        const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        
        const postData = {
            user_id: user.id,
            title,
            content:contentForDB,
            content_type: contentType,
            tags: tagsArray,
            image_url: coverImageUrl,
            visibility: visibility,
            updated_at: new Date(),
            author_username: user.user_metadata?.username || user.email, 
        };

        // FIX 2: Only set 'created_at' when making a NEW post (when postId is null)
        if (!postId) {
            postData.created_at = new Date();
        }

        try {
            const { data, error } = await supabase
                .from('Blogs')
                .upsert(postId ? { ...postData, id: postId } : postData)
                .select()
                .single();

            if (error) throw error;

            setLoading(false);
            toast.success(`Post ${postId ? 'updated' : 'published'} successfully!`, {
                duration: 4000,
                position: 'top-center',
            });
            navigate(`/blog/${data.id}`); // Navigate to the post detail page
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };
    
    if (authLoading || fetchLoading) {
        return <div className="full-page-loader">Loading editor...</div>;
    }

    const editorPlaceholder = "Start writing your amazing post here... (select text for formatting options)";

    // --- Full JSX Layout ---
    return (
        <div className="page-wrapper light-theme">
            <NavBar />
            <div className="write-page-container-full"> 
                <form onSubmit={handleSubmit} className="write-form-full">
                    {error && <p className="form-error">{error}</p>}

                    {/* --- Form Header / Metadata Bar --- */}
                    <div className="form-header-full">
                        <div className="form-group-full">
                            <label>Content Type</label>
                            <div className="content-type-toggle">
                                 <button type="button" onClick={() => setContentType('blog')} 
                                    className={`type-button ${contentType === 'blog' ? 'active' : ''}`} disabled={loading || !!postId}>
                                     <FaPenSquare /> Blog Post
                                 </button>
                                 <button type="button" onClick={() => setContentType('story')} 
                                    className={`type-button ${contentType === 'story' ? 'active' : ''}`} disabled={loading || !!postId}>
                                     <FaRocket /> Project Story
                                 </button>
                            </div>
                        </div>

                        <div className="form-group-full">
                            <label>Visibility</label>
                            <select 
                                id="visibility" 
                                className="visibility-select" 
                                value={visibility} 
                                onChange={(e) => setVisibility(e.target.value)} 
                                disabled={loading}
                            >
                                <option value="public">🌎 Public</option>
                                <option value="connections">🤝 Connections Only</option>
                                <option value="private">🔒 Private</option>
                            </select>
                        </div>
                        
                        <div className="form-group-full">
                             <label htmlFor="cover-upload" className="cover-upload-button-full button button-secondary">
                                <FaUpload /> {coverImageUploading ? 'Uploading...' : (coverImageUrl ? 'Change Cover' : 'Upload Cover')}
                            </label>
                            <input type="file" id="cover-upload" accept="image/*"
                                onChange={handleCoverImageUpload} disabled={coverImageUploading} />
                        </div>

                        <div className="form-group-full submit-group-full">
                             <button type="submit" className="button button-primary submit-button-full" disabled={loading || coverImageUploading}>
                                <FaSave /> {loading ? 'Saving...' : (postId ? 'Update Post' : 'Publish Post')}
                            </button>
                        </div>
                    </div>
                    
                    {/* Cover image preview */}
                    {coverImageUrl && (
                        <div className="cover-image-preview-full">
                            <img src={coverImageUrl} alt="Cover preview" />
                        </div>
                    )}
                    
                    {/* --- Main Content Fields (Full Width) --- */}
                    <div className="form-group-full">
                        <input type="text" id="title" className="title-input-full" placeholder="Your Post Title"
                            value={title} onChange={(e) => setTitle(e.target.value)} required disabled={loading} />
                    </div>

                    <div className="form-group-full">
                         <input type="text" id="tags" className="tags-input-full" placeholder="Add tags... (e.g., react, supabase, javascript)"
                            value={tags} onChange={(e) => setTags(e.target.value)} disabled={loading} />
                    </div>

                    {/* --- THE LARGE EDITOR --- */}
                    <div className="form-group-full quill-editor-group-full">
                        <ReactQuill 
                            ref={quillRef} 
                            theme="snow" 
                            value={content} 
                            onChange={(value, delta, source, editor) => {
                                if (source === 'user') {
                                    setContent(value);
                                }
                            }}
                            modules={modules} 
                            placeholder={editorPlaceholder} 
                            className="custom-quill-editor-full"
                        />
                    </div>
                </form>
            </div>
            <Footer />
        </div>
    );
};

export default WriteBlogPage;