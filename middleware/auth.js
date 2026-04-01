const jwt = require('jsonwebtoken');

// Middleware to verify JWT token for user authentication
const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    console.log('🔐 Authenticating user, token:', token ? 'present' : 'missing');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded:', decoded);
    
    req.userId = decoded.userId;
    req.userType = decoded.type;
    
    next();
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to verify admin authentication
const authenticateAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    req.adminId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired admin token' });
  }
};

module.exports = { authenticateUser, authenticateAdmin };
