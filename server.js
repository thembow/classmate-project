// server.js

const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fetch = require('node-fetch');
const EventSource = require('eventsource');
const cheerio = require('cheerio');
const authenticateJWT = require('./middleware/auth'); // JWT middleware
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
require('./db'); // Ensure MongoDB connection is established

// Import models
const Event = require('./models/Event');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser()); // Add this line to parse cookies
app.use(express.static(path.join(__dirname, 'public')));
const groupRoutes = require('./routes/groups');
app.use('/groups', groupRoutes);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ------------------------------
// PUBLIC ENDPOINTS
// ------------------------------

app.get('/', (req, res) => {    
    res.render('index', { currentUser: req.user || null });
});

// Render pages
app.get('/calendar', (req, res) => {
  res.render('calendar');
});

app.get('/availability', (req, res) => {
  res.render('availability');
});

app.get('/productivity', (req, res) => {
  res.render('productivity');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/login', (req, res) => {
  res.render('login');
});

// ------------------------------
// AUTHENTICATION ENDPOINTS
// ------------------------------

// Registration endpoint using MongoDB
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists.' });
    }
    
    // Hash the password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    
    // Sign a JWT
    const payload = { id: newUser._id, username: newUser.username };
    const token = jwt.sign(payload, 'yourJWTSecret', { expiresIn: '1h' });
    
    // Set token as a cookie
    res.cookie('auth_token', token, {
        httpOnly: true, // Ensure it's not accessible via JavaScript
        secure: process.env.NODE_ENV === 'production', // Only set cookies over HTTPS in production
        maxAge: 24 * 60 * 60 * 1000 // Cookie expiry (1 day)
        });
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error registering user.' });
  }
});

// Login endpoint using MongoDB
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Compare provided password to stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Sign a JWT if successful
    const payload = { id: user._id, username: user.username };
    const token = jwt.sign(payload, 'yourJWTSecret', { expiresIn: '1h' });
    
    // Set token as a cookie
    res.cookie('auth_token', token, { 
      httpOnly: true, 
      maxAge: 3600000, // 1 hour expiry
      secure: process.env.NODE_ENV === 'production' // Set to true in production
    });
    return res.json({ message: 'Login successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Logout endpoint to clear cookies
app.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// ------------------------------
// PROTECTED ENDPOINTS (EVENTS)
// ------------------------------

// Get events for the logged-in user
app.get('/events', authenticateJWT, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.user.id });
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Save new event and attach the user id from the token
app.post('/events', authenticateJWT, async (req, res) => {
  const { title, start, end, type = "event" } = req.body;
  
  if (!title || !start) {
    return res.status(400).json({ error: 'Missing title or start date' });
  }
  
  try {
    const newEvent = new Event({
      userId: req.user.id,
      title,
      start,
      end: end || null,
      type
    });
    await newEvent.save();
    res.status(201).json({ message: 'Event created', event: newEvent });
  } catch (err) {
    console.error("Error saving event:", err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event (ensuring the event belongs to the logged-in user)
app.put('/events', authenticateJWT, async (req, res) => {
  const { id, title, start, end, type = "event" } = req.body;
  
  try {
    const event = await Event.findOne({ _id: id, userId: req.user.id });
    if (!event) {
      return res.status(404).json({ error: 'Event not found or unauthorized.' });
    }
    
    event.title = title;
    event.start = start;
    event.end = end;
    event.type = type;
    
    await event.save();
    res.status(200).json({ message: 'Event updated' });
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event (ensuring the event belongs to the logged-in user)
app.delete('/events/:id', authenticateJWT, async (req, res) => {
  try {
    const result = await Event.deleteOne({ _id: req.params.id, userId: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(403).json({ error: 'You are not allowed to delete this event.' });
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// ------------------------------
// OTHER PUBLIC ENDPOINTS
// ------------------------------

// Streaming parking data (left public)
app.get('/api/parking', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = 'https://parkingavailability.charlotte.edu/decks/stream';
  const es = new EventSource(url);

  es.onmessage = (e) => {
    const data = JSON.parse(e.data);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  req.on('close', () => {
    console.log('Client disconnected');
  });
});

// Library occupancy (left public)
app.get('/api/libraryoccupancy', async (req, res) => {
  try {
    const response = await fetch('https://atkinsapi.charlotte.edu/occupancy/get/');
    const data = await response.json();

    console.log('Fetched occupancy data:', data); 

    const occupancy = parseInt(data.atkins_current_occupancy) || 0;
    res.json({ occupancy });
  } catch (err) {
    console.error('Error fetching occupancy:', err);
    res.status(500).json({ error: 'Failed to fetch occupancy data' });
  }
});

// Timer
app.get('/timer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'timer.htm'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
