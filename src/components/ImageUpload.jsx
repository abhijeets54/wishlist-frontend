import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudArrowUpIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { uploadAPI } from '../services/api';

const ImageUpload = ({
  onUpload,
  onRemove,
  currentImage,
  uploadType = 'product-image', // 'avatar' or 'product-image'
  className = '',
  disabled = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some(e => e.code === 'file-too-large')) {
        setError(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
      } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
        setError('Only image files are allowed');
      } else {
        setError('Invalid file');
      }
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    setError('');
    setSuccess(false);
    setUploading(true);
    setUploadProgress(0);

    try {
      let response;

      if (uploadType === 'avatar') {
        response = await uploadAPI.uploadAvatar(file);
      } else {
        response = await uploadAPI.uploadProductImage(file);
      }

      const data = response.data;
      setSuccess(true);
      setUploadProgress(100);

      if (onUpload) {
        onUpload(data.imageUrl || data.avatarUrl, data);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      let errorMessage = 'Upload failed';

      if (err.response) {
        // Server responded with error status
        errorMessage = err.response.data?.message || err.response.statusText || errorMessage;

        if (err.response.status === 503) {
          errorMessage = 'Image upload service not configured. Please check server configuration.';
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
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [onUpload, uploadType, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize,
    multiple: false,
    disabled: disabled || uploading,
  });

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
    setError('');
    setSuccess(false);
  };

  const isAvatar = uploadType === 'avatar';
  const containerClasses = isAvatar 
    ? 'w-32 h-32 rounded-full' 
    : 'w-full h-48 rounded-lg';

  return (
    <div className={`relative ${className}`}>
      {/* Current Image Display */}
      {currentImage && !uploading && (
        <div className={`relative ${containerClasses} mb-4`}>
          <img
            src={currentImage}
            alt="Current"
            className={`w-full h-full object-cover ${isAvatar ? 'rounded-full' : 'rounded-lg'} border-2 border-gray-200`}
          />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            type="button"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed transition-all duration-200 cursor-pointer
          ${containerClasses}
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${success ? 'border-green-300 bg-green-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Uploading...</p>
                {uploadProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                    <motion.div
                      className="bg-blue-600 h-1 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </motion.div>
            ) : success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-green-600"
              >
                <CheckCircleIcon className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Upload successful!</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-red-600"
              >
                <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-gray-500"
              >
                {isDragActive ? (
                  <>
                    <CloudArrowUpIcon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Drop image here</p>
                  </>
                ) : (
                  <>
                    <PhotoIcon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">
                      {isAvatar ? 'Upload avatar' : 'Upload image'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Click or drag to upload
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* File Info */}
      <p className="text-xs text-gray-500 mt-2 text-center">
        Max size: {Math.round(maxSize / 1024 / 1024)}MB • JPG, PNG, GIF, WebP
      </p>
    </div>
  );
};

export default ImageUpload;
