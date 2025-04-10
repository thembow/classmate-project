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
  const { title, date } = req.body;
  console.log("Received new event:", { title, date });

  fs.readFile(eventsFile, (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read events' });

    const events = JSON.parse(data);
    const newEvent = { 
      id: Date.now().toString(), // Generate a unique ID
      title, 
      start: date 
    };
    events.push(newEvent);

    fs.writeFile(eventsFile, JSON.stringify(events, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to save event' });
      res.status(200).json({ message: 'Event added' });
    });
  });
});

// Update event
app.put('/events', (req, res) => {
  const { id, title, start, end } = req.body;

  fs.readFile(eventsFile, (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read events' });

    const events = JSON.parse(data);
    const eventIndex = events.findIndex((event) => event.id === id);

    if (eventIndex !== -1) {
      events[eventIndex] = { id, title, start, end };
      fs.writeFile(eventsFile, JSON.stringify(events, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Failed to update event' });
        res.status(200).json({ message: 'Event updated' });
      });
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
