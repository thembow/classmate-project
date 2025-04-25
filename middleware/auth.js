const jwt = require('jsonwebtoken');
const authenticateJWT = (req, res, next) => {
  const token = req.cookies.auth_token; 
  console.log('Cookies:', req.cookies); 

  if (!token) {
    return res.status(401).json({ error: 'Access denied, no token provided' });
  }

  jwt.verify(token, 'yourJWTSecret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};


module.exports = authenticateJWT;
