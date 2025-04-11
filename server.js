const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const eventsFile = path.join(__dirname, 'events.json');

app.use(express.json());
app.use(express.static('public'));

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
  const { title, start, end } = req.body;

  if (!title || !start) {
    return res.status(400).json({ error: 'Missing title or start date' });
  }

  const newEvent = {
    id: Date.now().toString(),
    title,
    start,
    end: end || null
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
  const { id, title, start, end } = req.body;

  fs.readFile(eventsFile, (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read events' });

    let events = JSON.parse(data);
    let event = events.find(e => e.id === id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    event.title = title;
    event.start = start;
    event.end = end;

    fs.writeFile(eventsFile, JSON.stringify(events, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update event' });
      res.status(200).json({ message: 'Event updated' });
    });
  });
});



app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
