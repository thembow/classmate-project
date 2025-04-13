const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const fetch = require('node-fetch');
const PORT = 3000;
const EventSource = require('eventsource');
const cheerio = require('cheerio');


const eventsFile = path.join(__dirname, 'events.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Ensure your views directory is set properly



// Load events
app.get('/events', (req, res) => {
  fs.readFile(eventsFile, (err, data) => {
    if (err) {
      console.error("Error reading events file:", err);
      return res.status(500).json({ error: 'Failed to read events' });
    }
    res.json(JSON.parse(data));
  });
});

// Save new event
app.post('/events', (req, res) => {
  const { title, start, end, type = "event" } = req.body;

  if (!title || !start) {
    return res.status(400).json({ error: 'Missing title or start date' });
  }

  const newEvent = {
    id: Date.now().toString(),
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

// Update event
app.put('/events', (req, res) => {
  const { id, title, start, end, type = "event" } = req.body;

  fs.readFile(eventsFile, (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read events' });

    let events = JSON.parse(data);
    let event = events.find(e => e.id === id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

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

// Streaming parking data
app.get('/api/parking', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = 'https://parkingavailability.charlotte.edu/decks/stream';
  const es = new EventSource(url)

  es.onmessage = (e) => {
    const data = JSON.parse(e.data);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

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

app.delete('/events/:id', (req, res) => {
  const id = req.params.id;
  fs.readFile(eventsFile, (err, data) => {
    if (err) {
      console.error("Error reading events file:", err);
      return res.status(500).json({ error: 'Failed to read events' });
    }
    let events = JSON.parse(data);
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

app.get('/calendar', (req, res) => {
  res.render('calendar'); // or whatever your homepage is
});

app.get('/availability', (req, res) => {
  res.render('availability');
});

app.get('/productivity', (req, res) => {
  res.render('productivity');
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


