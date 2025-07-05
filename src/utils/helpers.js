// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format date
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

// Format relative time
export const formatRelativeTime = (date) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return formatDate(date);
};

// Generate avatar URL
export const generateAvatarUrl = (name, size = 40) => {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=667eea&color=ffffff&bold=true`;
};

// Validate URL
export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Ensure URL has proper protocol
export const ensureUrlProtocol = (url) => {
  if (!url) return url;

  // If URL already has a protocol, return as is
  if (url.match(/^https?:\/\//)) {
    return url;
  }

  // Add https:// if no protocol is present
  return `https://${url}`;
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generate random color
export const generateRandomColor = () => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Get priority color
export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-100';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'low':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

// Get status color
export const getStatusColor = (status) => {
  switch (status) {
    case 'purchased':
      return 'text-green-600 bg-green-100';
    case 'unavailable':
      return 'text-red-600 bg-red-100';
    case 'wanted':
    default:
      return 'text-blue-600 bg-blue-100';
  }
};

// Check if URL is a Cloudinary URL
export const isCloudinaryUrl = (url) => {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
};

// Get optimized Cloudinary URL with transformations
export const getOptimizedImageUrl = (url, options = {}) => {
  if (!isCloudinaryUrl(url)) return url;

  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity = 'auto'
  } = options;

  // Extract the base URL and public ID
  const urlParts = url.split('/upload/');
  if (urlParts.length !== 2) return url;

  const [baseUrl, pathWithPublicId] = urlParts;

  // Build transformation string
  const transformations = [];

  if (width || height) {
    let sizeTransform = '';
    if (width) sizeTransform += `w_${width}`;
    if (height) sizeTransform += (sizeTransform ? ',' : '') + `h_${height}`;
    if (crop) sizeTransform += `,c_${crop}`;
    if (gravity && crop === 'fill') sizeTransform += `,g_${gravity}`;
    transformations.push(sizeTransform);
  }

  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);

  const transformString = transformations.length > 0 ? transformations.join('/') + '/' : '';

  return `${baseUrl}/upload/${transformString}${pathWithPublicId}`;
};

// Get avatar URL with fallback
export const getAvatarUrl = (user, size = 40) => {
  if (user?.avatar && isCloudinaryUrl(user.avatar)) {
    return getOptimizedImageUrl(user.avatar, {
      width: size,
      height: size,
      crop: 'fill',
      gravity: 'face'
    });
  }

  if (user?.avatar) {
    return user.avatar;
  }

  return generateAvatarUrl(user?.username || 'User', size);
};

// Get product image URL with fallback
export const getProductImageUrl = (product, options = {}) => {
  if (product?.imageUrl && isCloudinaryUrl(product.imageUrl)) {
    return getOptimizedImageUrl(product.imageUrl, {
      width: options.width || 400,
      height: options.height || 300,
      crop: 'fill',
      ...options
    });
  }

  return product?.imageUrl || null;
};
