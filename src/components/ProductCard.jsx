import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../services/api';
import socketService from '../services/socket';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import {
  formatCurrency,
  formatRelativeTime,
  generateAvatarUrl,
  getPriorityColor,
  getStatusColor,
  ensureUrlProtocol
} from '../utils/helpers';

const ProductCard = ({ product, onUpdate, onDelete, canEdit }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const reactions = ['❤️', '👍', '👎', '😍', '🤔', '💰', '🔥', '⭐'];

  const userReaction = product.reactions?.find(r => r.user._id === user?.id);
  const reactionCounts = product.reactions?.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {}) || {};

  const handleReaction = async (emoji) => {
    try {
      if (userReaction) {
        // Remove existing reaction
        await productsAPI.removeReaction(product._id);
        socketService.emitReactionAdded({
          wishlistId: product.wishlist,
          productId: product._id,
          action: 'remove',
          userId: user.id
        });
      }
      
      if (!userReaction || userReaction.emoji !== emoji) {
        // Add new reaction
        const response = await productsAPI.addReaction(product._id, { emoji });
        socketService.emitReactionAdded({
          wishlistId: product.wishlist,
          productId: product._id,
          reaction: response.data,
          action: 'add'
        });
      }
      
      setShowReactions(false);
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await productsAPI.addComment(product._id, { text: newComment });
      socketService.emitCommentAdded({
        wishlistId: product.wishlist,
        productId: product._id,
        comment: response.data
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleProductLinkClick = () => {
    // Track product link clicks for analytics
    console.log('Product link clicked:', {
      productId: product._id,
      productName: product.name,
      productUrl: product.productUrl,
      timestamp: new Date().toISOString()
    });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(product._id);
        onDelete(product._id);
        socketService.emitProductDeleted({
          wishlistId: product.wishlist,
          productId: product._id
        });
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 overflow-hidden group"
    >
      {/* Image */}
      {product.imageUrl && (
        <div className="relative">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
          {product.productUrl && (
            <a
              href={ensureUrlProtocol(product.productUrl)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleProductLinkClick}
              className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-600" />
            </a>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
              {product.priority && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(product.priority)}`}>
                  {product.priority}
                </span>
              )}
            </div>
            
            {product.brand && (
              <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
            )}
            
            {product.description && (
              <p className="text-gray-600 text-sm line-clamp-2 mb-2">{product.description}</p>
            )}
          </div>

          {/* Menu */}
          {canEdit && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"
              >
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[120px]"
                  >
                    <button
                      onClick={() => {/* TODO: Edit product */}}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Price and Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(product.price || 0, product.currency)}
            </span>
            {product.status && product.status !== 'wanted' && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                {product.status}
              </span>
            )}
          </div>
          
          {product.category && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {product.category}
            </span>
          )}
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{product.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Reactions */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center space-x-1">
            {Object.entries(reactionCounts).slice(0, 3).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                  userReaction?.emoji === emoji
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <span className="emoji">{emoji}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaceSmileIcon className="w-4 h-4" />
            </button>
            
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-8 left-0 bg-white rounded-lg shadow-lg border p-2 z-10"
                >
                  <div className="grid grid-cols-4 gap-1">
                    {reactions.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="p-2 hover:bg-gray-100 rounded text-lg transition-colors"
                      >
                        <span className="emoji">{emoji}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ChatBubbleLeftIcon className="w-4 h-4" />
              <span className="text-sm">{product.comments?.length || 0}</span>
            </button>

            {product.productUrl && (
              <a
                href={ensureUrlProtocol(product.productUrl)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleProductLinkClick}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                title="Visit product page"
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Visit Product</span>
                <span className="sm:hidden">Visit</span>
              </a>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <img
              src={product.addedBy.avatar || generateAvatarUrl(product.addedBy.username)}
              alt={product.addedBy.username}
              className="w-5 h-5 rounded-full"
            />
            <span>by {product.addedBy.username}</span>
            <span>•</span>
            <span>{formatRelativeTime(product.createdAt)}</span>
          </div>
        </div>

        {/* Comments */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-100"
            >
              {/* Comment Form */}
              <form onSubmit={handleComment} className="mb-3">
                <div className="flex space-x-2">
                  <img
                    src={user?.avatar || generateAvatarUrl(user?.username || 'User')}
                    alt={user?.username}
                    className="w-6 h-6 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      disabled={isSubmittingComment}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isSubmittingComment ? '...' : 'Post'}
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {product.comments?.map((comment) => (
                  <div key={comment._id} className="flex space-x-2">
                    <img
                      src={comment.user.avatar || generateAvatarUrl(comment.user.username)}
                      alt={comment.user.username}
                      className="w-5 h-5 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {comment.user.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ProductCard;
