// script.js
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');

  const calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, interactionPlugin], // Ensure plugins are correctly imported
    initialView: 'dayGridMonth',
    selectable: true,
    events: '/events',
    eventClick: async function(info) {
      const title = prompt("Edit event title:", info.event.title);
      if (title) {
        await fetch('/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: info.event.id, title }),
        });
        calendar.refetchEvents();
      }
    },
  });

  calendar.render();

  const form = document.getElementById('eventForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const date = document.getElementById('date').value;

    if (title && date) {
      await fetch('/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date }),
      });

      calendar.refetchEvents(); 
      form.reset();
    }
  });
});
