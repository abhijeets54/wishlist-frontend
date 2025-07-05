import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { wishlistsAPI, productsAPI } from '../services/api';
import socketService from '../services/socket';
import {
  ArrowLeftIcon,
  PlusIcon,
  UsersIcon,
  HeartIcon,
  CurrencyDollarIcon,
  LinkIcon,
  CheckIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatRelativeTime, generateAvatarUrl, copyToClipboard } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import AddProductModal from '../components/AddProductModal';
import ProductCard from '../components/ProductCard';

const WishlistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    fetchWishlistData();
    
    // Connect to socket and join wishlist room
    const socket = socketService.connect();
    socketService.joinWishlist(id);

    // Listen for real-time updates
    socketService.onProductAdded(handleProductAdded);
    socketService.onProductUpdated(handleProductUpdated);
    socketService.onProductDeleted(handleProductDeleted);

    return () => {
      socketService.leaveWishlist(id);
      socketService.off('product-added', handleProductAdded);
      socketService.off('product-updated', handleProductUpdated);
      socketService.off('product-deleted', handleProductDeleted);
    };
  }, [id]);

  const fetchWishlistData = async () => {
    try {
      setIsLoading(true);
      const [wishlistResponse, productsResponse] = await Promise.all([
        wishlistsAPI.getById(id),
        productsAPI.getByWishlist(id)
      ]);
      
      setWishlist(wishlistResponse.data);
      setProducts(productsResponse.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setError('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductAdded = (data) => {
    if (data.wishlistId === id) {
      setProducts(prev => [data.product, ...prev]);
    }
  };

  const handleProductUpdated = (data) => {
    if (data.wishlistId === id) {
      setProducts(prev => prev.map(p => p._id === data.product._id ? data.product : p));
    }
  };

  const handleProductDeleted = (data) => {
    if (data.wishlistId === id) {
      setProducts(prev => prev.filter(p => p._id !== data.productId));
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      const response = await productsAPI.create(productData);
      setProducts(prev => [response.data, ...prev]);
      setShowAddProduct(false);

      // Emit socket event
      socketService.emitProductAdded({
        wishlistId: id,
        product: response.data
      });
    } catch (error) {
      console.error('Error adding product:', error);
      throw new Error(error.response?.data?.message || 'Failed to add product');
    }
  };

  const handleDeleteProduct = (productId) => {
    setProducts(prev => prev.filter(p => p._id !== productId));
  };

  const handleCopyInviteCode = async () => {
    if (!wishlist?.inviteCode) {
      // Generate invite code first if it doesn't exist
      try {
        const response = await wishlistsAPI.generateInvite(id);
        const newInviteCode = response.data.inviteCode;
        setWishlist(prev => ({
          ...prev,
          inviteCode: newInviteCode
        }));

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

  const handleGenerateNewInviteCode = async () => {
    try {
      const response = await wishlistsAPI.generateInvite(id);
      setWishlist(prev => ({
        ...prev,
        inviteCode: response.data.inviteCode
      }));
      setShareMessage('New invite code generated!');
      setTimeout(() => setShareMessage(''), 3000);
    } catch (error) {
      setShareMessage('Failed to generate invite code');
      setTimeout(() => setShareMessage(''), 3000);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading wishlist..." />;
  }

  if (error || !wishlist) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Wishlist Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The wishlist you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  const isOwner = wishlist.owner._id === user?.id;
  const isCollaborator = wishlist.collaborators?.some(c => c.user._id === user?.id);
  const canEdit = isOwner || isCollaborator;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-3">
            {canEdit && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddProduct(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Product</span>
              </motion.button>
            )}

            {/* Invite Code Section - Only show for owners/admins */}
            {canEdit && (
              <div className="relative flex items-center space-x-2">
                {wishlist?.inviteCode ? (
                  <>
                    {/* Copy Invite Code Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCopyInviteCode}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      title="Copy invite code to clipboard"
                    >
                      <ClipboardIcon className="w-4 h-4" />
                      <span>Copy Code: {wishlist.inviteCode}</span>
                    </motion.button>

                    {/* Generate New Code Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGenerateNewInviteCode}
                      className="px-3 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                      title="Generate new invite code"
                    >
                      New Code
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCopyInviteCode}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Generate and copy invite code"
                  >
                    <ClipboardIcon className="w-4 h-4" />
                    <span>Copy Invite Code</span>
                  </motion.button>
                )}

                {/* Success/Error Message */}
                <AnimatePresence>
                  {shareMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-12 right-0 bg-green-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-10"
                    >
                      <div className="flex items-center space-x-1">
                        <CheckIcon className="w-4 h-4" />
                        <span>{shareMessage}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{wishlist.title}</h1>
              {wishlist.description && (
                <p className="text-gray-600 text-lg">{wishlist.description}</p>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-500">Created by</p>
              <div className="flex items-center space-x-2">
                <img
                  src={wishlist.owner.avatar || generateAvatarUrl(wishlist.owner.username)}
                  alt={wishlist.owner.username}
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium text-gray-900">{wishlist.owner.username}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <HeartIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">{products.length} items</span>
            </div>
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">
                {formatCurrency(products.reduce((sum, p) => sum + (p.price || 0), 0))}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <UsersIcon className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">
                {(wishlist.collaborators?.length || 0) + 1} members
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Updated {formatRelativeTime(wishlist.updatedAt)}
            </div>
          </div>

          {/* Members Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Members ({(wishlist.collaborators?.length || 0) + 1})
            </h3>

            <div className="space-y-3">
              {/* Owner */}
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img
                    src={wishlist.owner.avatar || generateAvatarUrl(wishlist.owner.username)}
                    alt={wishlist.owner.username}
                    className="w-10 h-10 rounded-full border-2 border-amber-300"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{wishlist.owner.username}</p>
                    <p className="text-sm text-amber-700">Owner</p>
                  </div>
                </div>
                <div className="text-sm text-amber-600 font-medium">👑</div>
              </div>

              {/* Collaborators */}
              {wishlist.collaborators && wishlist.collaborators.length > 0 && (
                <>
                  {wishlist.collaborators.map((collab) => (
                    <div key={collab.user._id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img
                          src={collab.user.avatar || generateAvatarUrl(collab.user.username)}
                          alt={collab.user.username}
                          className="w-10 h-10 rounded-full border-2 border-blue-300"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{collab.user.username}</p>
                          <p className="text-sm text-blue-700 capitalize">{collab.role}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Joined {formatRelativeTime(collab.joinedAt)}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Products */}
      <div className="space-y-6">
        {products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-xl shadow-sm border"
          >
            <HeartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-600 mb-6">Start adding products to this wishlist!</p>
            {canEdit && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddProduct(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Add First Product</span>
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onUpdate={(updatedProduct) => {
                    setProducts(prev => prev.map(p => p._id === updatedProduct._id ? updatedProduct : p));
                  }}
                  onDelete={handleDeleteProduct}
                  canEdit={canEdit}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onSubmit={handleAddProduct}
        wishlistId={id}
      />
    </div>
  );
};

export default WishlistDetail;
