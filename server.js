// server.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fetch = require('node-fetch');
const EventSource = require('eventsource');
const cheerio = require('cheerio');
const authenticateJWT = require('./middleware/auth'); // Import middleware

const app = express();
const PORT = 3000;

const eventsFile = path.join(__dirname, 'events.json');

// Dummy user store for demonstration
let users = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Ensure your views directory is set properly

// ------------------------------
// PUBLIC ENDPOINTS (do not require JWT)
// ------------------------------

// Render calendar, availability, productivity pages (could also protect these later via client logic)
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

// Login endpoint (returns token if login successful)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Dummy user validation. Replace with real validation.
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  bcrypt.compare(password, user.password, (err, result) => {
    if (err || !result) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    // On successful authentication, sign a JWT
    const payload = { id: user.id, username: user.username };
    const token = jwt.sign(payload, 'yourJWTSecret', { expiresIn: '1h' });
    return res.json({ token });
  });
});

// Registration endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }
  // Check if user already exists
  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.status(409).json({ error: 'Username already exists.' });
  }
  // Hash the password and create a new user
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(),
    username,
    password: hashedPassword
  };
  users.push(newUser);
  // Optionally sign a JWT immediately upon registration
  const payload = { id: newUser.id, username: newUser.username };
  const token = jwt.sign(payload, 'yourJWTSecret', { expiresIn: '1h' });
  res.status(201).json({ message: 'User registered', token });
});

// ------------------------------
// PROTECTED ENDPOINTS (require JWT via authenticateJWT middleware)
// ------------------------------

// Load events filtered by the logged-in user
app.get('/events', authenticateJWT, (req, res) => {
  fs.readFile(eventsFile, (err, data) => {
    if (err) {
      console.error("Error reading events file:", err);
      return res.status(500).json({ error: 'Failed to read events' });
    }
    const events = JSON.parse(data);
    // Filter events to only return those that belong to the authenticated user
    const userEvents = events.filter(e => e.userId === req.user.id);
    res.json(userEvents);
  });
});

// Save new event and attach the user id from the token
app.post('/events', authenticateJWT, (req, res) => {
  const { title, start, end, type = "event" } = req.body;

  if (!title || !start) {
    return res.status(400).json({ error: 'Missing title or start date' });
  }

  const newEvent = {
    id: Date.now().toString(),
    userId: req.user.id, // attach user id
    title,
    start,
    end: end || null,
    type
  };

  fs.readFile(eventsFile, (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read events file' });

    let events = JSON.parse(data);
    events.push(newEvent);

    fs.writeFile(eventsFile, JSON.stringify(events, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to write event' });
      res.status(201).json({ message: 'Event created', event: newEvent });
    });
  });
});

// Update event (ensuring the event belongs to the logged-in user)
app.put('/events', authenticateJWT, (req, res) => {
  const { id, title, start, end, type = "event" } = req.body;

  fs.readFile(eventsFile, (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read events' });

    let events = JSON.parse(data);
    let event = events.find(e => e.id === id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Ensure that the event belongs to the authenticated user
    if (event.userId !== req.user.id) {
      return res.status(403).json({ error: 'You are not allowed to update this event.' });
    }

    event.title = title;
    event.start = start;
    event.end = end;
    event.type = type;

    fs.writeFile(eventsFile, JSON.stringify(events, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update event' });
      res.status(200).json({ message: 'Event updated' });
    });
  });
});

// Delete event (ensuring the event belongs to the logged-in user)
app.delete('/events/:id', authenticateJWT, (req, res) => {
  const id = req.params.id;
  fs.readFile(eventsFile, (err, data) => {
    if (err) {
      console.error("Error reading events file:", err);
      return res.status(500).json({ error: 'Failed to read events' });
    }
    let events = JSON.parse(data);
    const eventToDelete = events.find(e => e.id === id);
    // Check that the event belongs to the user
    if (!eventToDelete || eventToDelete.userId !== req.user.id) {
      return res.status(403).json({ error: 'You are not allowed to delete this event.' });
    }
    // Filter out the event with matching id:
    events = events.filter(e => e.id !== id);
    fs.writeFile(eventsFile, JSON.stringify(events, null, 2), (err) => {
      if (err) {
        console.error("Error writing events file:", err);
        return res.status(500).json({ error: 'Failed to delete event' });
      }
      res.sendStatus(200);
    });
  });
});

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
