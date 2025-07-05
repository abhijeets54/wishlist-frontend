# WishlistApp Frontend

> React frontend application for the collaborative wishlist platform

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API URLs
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Hot reload enabled for development

## 🛠 Tech Stack

- **React 19** - UI library with latest features
- **Vite** - Fast build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **Socket.io Client** - Real-time communication
- **Heroicons** - Beautiful SVG icons
- **React Dropzone** - File upload handling

## 📁 Project Structure

```
wishlist-frontend/
├── index.html              # HTML entry point
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── vercel.json            # Vercel deployment config
├── .env.example           # Environment variables template
├── public/
│   └── vite.svg           # Static assets
└── src/
    ├── main.jsx           # React app entry point
    ├── App.jsx            # Main app component
    ├── index.css          # Global styles
    ├── components/        # Reusable UI components
    ├── pages/             # Page components
    ├── context/           # React context providers
    ├── services/          # API and Socket services
    ├── hooks/             # Custom React hooks
    ├── utils/             # Utility functions
    └── assets/            # Static assets
```

## 🧩 Key Components

### Pages
- **Login.jsx** - User authentication
- **Register.jsx** - User registration
- **Dashboard.jsx** - Main dashboard with wishlists
- **WishlistDetail.jsx** - Individual wishlist view
- **Profile.jsx** - User profile management

### Components
- **Navbar.jsx** - Navigation header
- **ProductCard.jsx** - Product display with interactions
- **AddProductModal.jsx** - Product creation form
- **CreateWishlistModal.jsx** - Wishlist creation form
- **JoinWishlistModal.jsx** - Join wishlist by invite code
- **ImageUpload.jsx** - File upload with drag & drop
- **LoadingSpinner.jsx** - Loading states

### Services
- **api.js** - Centralized API calls with interceptors
- **socket.js** - Socket.io client management

### Context
- **AuthContext.jsx** - Global authentication state

## 🔌 API Integration

### Authentication
```javascript
// Login user
const result = await login({ email, password });

// Register user
const result = await register({ username, email, password });

// Get current user
const user = await authAPI.getProfile();
```

### Wishlists
```javascript
// Get user's wishlists
const wishlists = await wishlistsAPI.getAll();

// Create new wishlist
const wishlist = await wishlistsAPI.create(data);

// Join wishlist by invite code
const result = await wishlistsAPI.joinByInvite(inviteCode);
```

### Products
```javascript
// Get products in wishlist
const products = await productsAPI.getByWishlist(wishlistId);

// Add product
const product = await productsAPI.create(productData);

// Add comment
const comment = await productsAPI.addComment(productId, { text });

// Add reaction
const reaction = await productsAPI.addReaction(productId, { emoji });
```

## 🔄 Real-time Features

Socket.io integration for live updates:

```javascript
// Join wishlist room
socketService.joinWishlist(wishlistId);

// Listen for real-time updates
socketService.onProductAdded((data) => {
  // Update UI with new product
});

socketService.onCommentAdded((data) => {
  // Update UI with new comment
});
```

## 🎨 Styling & UI

### Tailwind CSS Classes
- **Responsive Design**: `sm:`, `md:`, `lg:` breakpoints
- **Animations**: Framer Motion for smooth transitions
- **Color Scheme**: Blue and purple gradients
- **Components**: Custom styled form elements

### Key Design Features
- Mobile-first responsive design
- Smooth page transitions
- Loading states and error handling
- Toast notifications
- Modal dialogs with backdrop blur
- Drag & drop file uploads

## 🔐 Environment Variables

Create `.env.local` file:

```env
# Development
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Production (set in Vercel dashboard)
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
```

## 🚀 Deployment

### Vercel Deployment
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy with these settings:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Root Directory**: `wishlist-frontend`

### Build Optimization
- Code splitting for better performance
- Tree shaking to remove unused code
- Asset optimization with Vite
- Lazy loading for routes

## 📱 Features

### Core Features
- ✅ User authentication (login/register)
- ✅ Create and manage wishlists
- ✅ Add/edit/remove products
- ✅ Real-time collaboration
- ✅ Comments and emoji reactions
- ✅ Invite system with codes
- ✅ Image upload for products and avatars
- ✅ Mobile responsive design

### Advanced Features
- ✅ Smooth animations and transitions
- ✅ Drag & drop file uploads
- ✅ Copy-to-clipboard functionality
- ✅ Real-time notifications
- ✅ Error handling and loading states
- ✅ Form validation
- ✅ Search and filter capabilities

## 📝 Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## 🧪 Development

### Code Quality
- ESLint configuration for code quality
- Prettier for code formatting
- Component-based architecture
- Custom hooks for reusable logic
- Error boundaries for error handling

### Performance
- React 19 features for optimal performance
- Vite for fast development and builds
- Code splitting and lazy loading
- Optimized images with Cloudinary
- Efficient state management

## 🔒 Security

- Environment variables for sensitive data
- Input validation on forms
- XSS protection with proper escaping
- CSRF protection with tokens
- Secure authentication flow

---

**Part of WishlistApp - FlockShop.ai Full Stack Intern Assignment**
