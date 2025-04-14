const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    // Expected format: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    jwt.verify(token, 'yourJWTSecret', (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      // The payload (user) can be attached to the request for later use
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Access token missing' });
  }
};

module.exports = authenticateJWT;
