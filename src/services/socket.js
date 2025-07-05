import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: false,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });
    }

    if (!this.isConnected) {
      this.socket.connect();
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Wishlist room management
  joinWishlist(wishlistId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-wishlist', wishlistId);
    }
  }

  leaveWishlist(wishlistId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-wishlist', wishlistId);
    }
  }

  // Product events
  emitProductAdded(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('product-added', data);
    }
  }

  emitProductUpdated(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('product-updated', data);
    }
  }

  emitProductDeleted(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('product-deleted', data);
    }
  }

  // Comment and reaction events
  emitCommentAdded(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('comment-added', data);
    }
  }

  emitReactionAdded(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('reaction-added', data);
    }
  }

  // Event listeners
  onProductAdded(callback) {
    if (this.socket) {
      this.socket.on('product-added', callback);
    }
  }

  onProductUpdated(callback) {
    if (this.socket) {
      this.socket.on('product-updated', callback);
    }
  }

  onProductDeleted(callback) {
    if (this.socket) {
      this.socket.on('product-deleted', callback);
    }
  }

  onCommentAdded(callback) {
    if (this.socket) {
      this.socket.on('comment-added', callback);
    }
  }

  onReactionAdded(callback) {
    if (this.socket) {
      this.socket.on('reaction-added', callback);
    }
  }

  // Remove event listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
