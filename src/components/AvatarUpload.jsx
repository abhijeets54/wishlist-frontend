import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CameraIcon } from '@heroicons/react/24/outline';
import { generateAvatarUrl } from '../utils/helpers';
import { uploadAPI } from '../services/api';

const AvatarUpload = ({ 
  currentAvatar, 
  username, 
  onUpload, 
  size = 'large', // 'small', 'medium', 'large'
  disabled = false 
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20',
    large: 'w-24 h-24'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-4 h-4'
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    // Validate file size (5MB limit for avatars)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const response = await uploadAPI.uploadAvatar(file);
      const data = response.data;

      if (onUpload) {
        onUpload(data.avatarUrl, data.user);
      }
    } catch (err) {
      let errorMessage = 'Upload failed';

      if (err.response) {
        // Server responded with error status
        errorMessage = err.response.data?.message || err.response.statusText || errorMessage;

        if (err.response.status === 503) {
          errorMessage = 'Avatar upload service not configured. Please check server configuration.';
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else {
        // Something else happened
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const avatarSrc = currentAvatar || generateAvatarUrl(username);

  return (
    <div className="relative inline-block">
      <div className={`relative ${sizeClasses[size]} group`}>
        {/* Avatar Image */}
        <motion.img
          src={avatarSrc}
          alt={username}
          className={`
            ${sizeClasses[size]} rounded-full border-4 border-gray-200 object-cover
            ${!disabled && !uploading ? 'cursor-pointer' : ''}
            ${uploading ? 'opacity-50' : ''}
          `}
          onClick={handleClick}
          whileHover={!disabled && !uploading ? { scale: 1.05 } : {}}
          whileTap={!disabled && !uploading ? { scale: 0.95 } : {}}
        />

        {/* Upload Button Overlay */}
        <motion.button
          type="button"
          onClick={handleClick}
          disabled={disabled || uploading}
          className={`
            absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full 
            hover:bg-blue-700 transition-colors shadow-lg
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          whileHover={!disabled && !uploading ? { scale: 1.1 } : {}}
          whileTap={!disabled && !uploading ? { scale: 0.9 } : {}}
        >
          {uploading ? (
            <div className={`${iconSizes[size]} border border-white border-t-transparent rounded-full animate-spin`} />
          ) : (
            <CameraIcon className={iconSizes[size]} />
          )}
        </motion.button>

        {/* Loading Overlay */}
        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center"
          >
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-xs text-red-600 bg-white px-2 py-1 rounded shadow-lg whitespace-nowrap z-10"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default AvatarUpload;
