// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fetch = require('node-fetch');
const EventSource = require('eventsource');
const cheerio = require('cheerio');
const authenticateJWT = require('./middleware/auth'); 
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
require('./db'); 

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



app.get('/', (req, res) => {    
    res.render('index', { currentUser: req.user || null });
});

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


app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password required.' });
  }
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res.status(409).json({ error: 'Email already in use.' });
  }
  
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists.' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    
    const payload = { id: newUser._id, username: newUser.username };
    const token = jwt.sign(payload, 'yourJWTSecret', { expiresIn: '1h' });
    
    res.cookie('auth_token', token, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 24 * 60 * 60 * 1000 
        });
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error registering user.' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const payload = { id: user._id, username: user.username };
    const token = jwt.sign(payload, 'yourJWTSecret', { expiresIn: '1h' });
    
    res.cookie('auth_token', token, { 
      httpOnly: true, 
      maxAge: 3600000, 
      secure: process.env.NODE_ENV === 'production' 
    });
    return res.json({ message: 'Login successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.status(200).json({ message: 'Logged out successfully' });
});


app.get('/events', authenticateJWT, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.user.id });
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

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

app.get('/timer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'timer.htm'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
