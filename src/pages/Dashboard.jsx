import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { wishlistsAPI } from '../services/api';
import {
  PlusIcon,
  HeartIcon,
  UsersIcon,
  EyeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ShareIcon,
  TrashIcon,
  PencilIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatRelativeTime, generateAvatarUrl, copyToClipboard } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateWishlistModal from '../components/CreateWishlistModal';
import EditWishlistModal from '../components/EditWishlistModal';
import JoinWishlistModal from '../components/JoinWishlistModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [wishlists, setWishlists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWishlist, setEditingWishlist] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    fetchWishlists();
  }, []);

  const fetchWishlists = async () => {
    try {
      setIsLoading(true);
      const response = await wishlistsAPI.getAll();
      setWishlists(response.data);
    } catch (error) {
      console.error('Error fetching wishlists:', error);
      setError('Failed to load wishlists');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWishlist = async (wishlistData) => {
    try {
      const response = await wishlistsAPI.create(wishlistData);
      setWishlists([response.data, ...wishlists]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating wishlist:', error);
      throw new Error(error.response?.data?.message || 'Failed to create wishlist');
    }
  };

  const handleDeleteWishlist = async (wishlistId) => {
    if (!window.confirm('Are you sure you want to delete this wishlist?')) {
      return;
    }

    try {
      await wishlistsAPI.delete(wishlistId);
      setWishlists(wishlists.filter(w => w._id !== wishlistId));
    } catch (error) {
      console.error('Error deleting wishlist:', error);
      alert('Failed to delete wishlist');
    }
  };

  const handleEditWishlist = (wishlist) => {
    setEditingWishlist(wishlist);
    setShowEditModal(true);
  };

  const handleUpdateWishlist = async (wishlistData) => {
    try {
      const response = await wishlistsAPI.update(editingWishlist._id, wishlistData);
      setWishlists(prev => prev.map(w => w._id === editingWishlist._id ? response.data : w));
      setShowEditModal(false);
      setEditingWishlist(null);
    } catch (error) {
      console.error('Error updating wishlist:', error);
      throw new Error(error.response?.data?.message || 'Failed to update wishlist');
    }
  };

  const handleShareWishlist = async (wishlist) => {
    if (!wishlist?.inviteCode) {
      // Generate invite code first if it doesn't exist
      try {
        const response = await wishlistsAPI.generateInvite(wishlist._id);
        const newInviteCode = response.data.inviteCode;

        // Update the wishlist in state
        setWishlists(prev => prev.map(w =>
          w._id === wishlist._id
            ? { ...w, inviteCode: newInviteCode }
            : w
        ));

        // Then copy it
        const success = await copyToClipboard(newInviteCode);
        if (success) {
          setShareMessage('Invite code generated and copied!');
        } else {
          setShareMessage('Invite code generated but failed to copy');
        }
      } catch (error) {
        setShareMessage('Failed to generate invite code');
      }
    } else {
      // Just copy existing invite code
      const success = await copyToClipboard(wishlist.inviteCode);
      if (success) {
        setShareMessage('Invite code copied to clipboard!');
      } else {
        setShareMessage('Failed to copy invite code');
      }
    }
    setTimeout(() => setShareMessage(''), 3000);
  };

  const handleJoinWishlist = (newWishlist) => {
    setWishlists(prev => [newWishlist, ...prev]);
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading your wishlists..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your wishlists and discover amazing products
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center space-x-2">
                <HeartIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Total Wishlists</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{wishlists.length}</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center space-x-2">
                <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Total Value</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(wishlists.reduce((sum, w) => sum + (w.totalValue || 0), 0))}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowJoinModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all shadow-lg"
            >
              <UsersIcon className="w-5 h-5" />
              <span>Join Wishlist</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Create Wishlist</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
        >
          {error}
        </motion.div>
      )}

      {/* Wishlists Grid */}
      {wishlists.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <HeartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No wishlists yet</h3>
          <p className="text-gray-600 mb-6">Create your first wishlist to get started!</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Your First Wishlist</span>
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {wishlists.map((wishlist, index) => (
              <motion.div
                key={wishlist._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {wishlist.title}
                      </h3>
                      {wishlist.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {wishlist.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      {wishlist.owner._id === user?.id && (
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          onClick={() => handleEditWishlist(wishlist)}
                          className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-transparent hover:border-blue-200"
                          title="Edit wishlist"
                        >
                          <PencilIcon className="w-5 h-5 stroke-2" />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleShareWishlist(wishlist)}
                        className="p-2.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-transparent hover:border-green-200"
                        title="Copy invite code to clipboard"
                      >
                        <ClipboardIcon className="w-5 h-5 stroke-2" />
                      </motion.button>
                      {wishlist.owner._id === user?.id && (
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          onClick={() => handleDeleteWishlist(wishlist._id)}
                          className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-transparent hover:border-red-200"
                          title="Delete wishlist"
                        >
                          <TrashIcon className="w-5 h-5 stroke-2" />
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <HeartIcon className="w-4 h-4" />
                      <span>{wishlist.products?.length || 0} items</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CurrencyDollarIcon className="w-4 h-4" />
                      <span>{formatCurrency(wishlist.totalValue || 0)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <UsersIcon className="w-4 h-4" />
                      <span>{(wishlist.collaborators?.length || 0) + 1} members</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{formatRelativeTime(wishlist.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Collaborators */}
                  {wishlist.collaborators && wishlist.collaborators.length > 0 && (
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="flex -space-x-2">
                        <img
                          src={wishlist.owner.avatar || generateAvatarUrl(wishlist.owner.username)}
                          alt={wishlist.owner.username}
                          className="w-6 h-6 rounded-full border-2 border-white"
                          title={wishlist.owner.username}
                        />
                        {wishlist.collaborators.slice(0, 3).map((collab) => (
                          <img
                            key={collab.user._id}
                            src={collab.user.avatar || generateAvatarUrl(collab.user.username)}
                            alt={collab.user.username}
                            className="w-6 h-6 rounded-full border-2 border-white"
                            title={collab.user.username}
                          />
                        ))}
                        {wishlist.collaborators.length > 3 && (
                          <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                            +{wishlist.collaborators.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* View Button */}
                  <Link
                    to={`/wishlist/${wishlist._id}`}
                    className="block w-full"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-lg transition-all"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>View Wishlist</span>
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Share Message */}
      <AnimatePresence>
        {shareMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-xl shadow-2xl z-50 border border-green-500"
          >
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-white/20 rounded-lg">
                <ClipboardIcon className="w-5 h-5" />
              </div>
              <span className="font-medium">{shareMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Wishlist Modal */}
      <CreateWishlistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateWishlist}
      />

      {/* Edit Wishlist Modal */}
      <EditWishlistModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingWishlist(null);
        }}
        onSubmit={handleUpdateWishlist}
        wishlist={editingWishlist}
      />

      {/* Join Wishlist Modal */}
      <JoinWishlistModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={handleJoinWishlist}
      />
    </div>
  );
};

export default Dashboard;
