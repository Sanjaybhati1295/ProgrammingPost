// src/components/ProfilePicUploader/ProfilePicUploader.js
import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; // Don't forget the CSS
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import './ProfilePicUploader.css'; // We'll create this file
import toast, { Toaster } from 'react-hot-toast';

// This is a helper function to create the initial crop selection
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const ProfilePicUploader = () => {
  const { user } = useAuth();
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const imgRef = useRef(null);
  const aspect = 1; // 1:1 aspect ratio (a square)

  // --- 1. File Selection ---
  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Reset crop on new image
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || '')
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // --- 2. Image Load ---
  // This sets the initial crop selection when the image loads
  const onImageLoad = (e) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
    setCompletedCrop(centerAspectCrop(width, height, aspect));
  };

  // --- 3. The "Magic" Cropping Function ---
  // This function uses a <canvas> to draw the cropped image
  // and returns it as a file (Blob)
  const getCroppedImageBlob = () => {
    const image = imgRef.current;
    if (!image || !completedCrop) {
      throw new Error('Crop or image not available');
    }

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, 'image/png'); // You can change to 'image/jpeg'
    });
  };

  // --- 4. Upload Function ---
  const handleUpload = async () => {
    if (!completedCrop || !imgRef.current) {
      setError('Please select an image and crop it first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the cropped image as a Blob
      const croppedBlob = await getCroppedImageBlob();
      
      // Create a unique file name for the user
      const fileName = `profile-pics/${user.id}/avatar.png`;
      console.log('Attempting to upload with User ID:', user.id);
      // Upload the *cropped* blob to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images') // Using your 'images' bucket
        .upload(fileName, croppedBlob, {
          cacheControl: '3600',
          upsert: true, // `upsert: true` will overwrite their old photo
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: publicURLData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
      
      if (!publicURLData) throw new Error('Could not get public URL');
      const publicUrl = publicURLData.publicUrl;

      // 2. UPDATE THE PROFILES TABLE (Add this new block!)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ profile_pic_url: publicUrl })
        .eq('id', user.id); // Matches the row to the current user

      if (profileError) throw profileError;

      // Update the user's metadata in auth.users table
      // 1. Update Auth Metadata (Optional, good for current session)
      await supabase.auth.updateUser({
        data: { profile_pic_url: publicUrl },
      });

      // 2. Update the PROFILES table (This is likely where your bug is)
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ profile_pic_url: publicUrl }) 
        .eq('id', user.id); // <--- CRITICAL: Only update the row matching this user's ID

      if (profileUpdateError) throw profileUpdateError;
      
      setLoading(false);
      toast.success('Profile picture updated!', {
        duration: 4000,
        position: 'top-center',
      });
      
      // Instead of reload, it's better to update local state, 
      // but reload works as a quick fix.
      setTimeout(() => window.location.reload(), 1000);

    } catch (err) {
      setLoading(false);
      setError(`Upload failed: ${err.message}`);
    }
  };

  // --- 5. The JSX (The UI) ---
  return (
    <div className="profile-uploader">
      <Toaster />
      <div className="form-group">
        <label htmlFor="profile-pic-input">Update Profile:</label>
        <input
          id="profile-pic-input"
          type="file"
          accept="image/*"
          onChange={onFileChange}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      {imgSrc && (
        <div className="cropper-container">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect} // Enforces 1:1 aspect ratio
          >
            <img ref={imgRef} alt="Crop preview" src={imgSrc} onLoad={onImageLoad} />
          </ReactCrop>
        </div>
      )}

      {imgSrc && (
        <button
          className="button button-primary"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Cropped Image'}
        </button>
      )}
    </div>
  );
};

export default ProfilePicUploader;