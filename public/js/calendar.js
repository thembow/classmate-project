let selectedInfo = null;
      let editEventId = null;
      const modal = document.getElementById('eventModal');

      // Open modal and populate inputs if provided
      function openModal(titleText, startValue = '', endValue = '') {
        document.getElementById('modalTitle').innerText = titleText;
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventStart').value = startValue;
        document.getElementById('eventEnd').value = endValue;
        const deleteBtn = document.getElementById('deleteEvent');
        deleteBtn.style.display = editEventId ? 'block' : 'none';
        modal.style.display = 'flex';
      }

      // Close modal and reset temporary state
      function closeModal() {
        modal.style.display = 'none';
        selectedInfo = null;
        editEventId = null;
      }

      // Prevent clicks inside the modal from propagating to underlying elements
      document.getElementById('modalContent').addEventListener('click', function(e) {
        e.stopPropagation();
      });
      // Also prevent the overlay from closing unintentionally if clicked outside
      modal.addEventListener('click', function(e) {
        // Optionally: if you want clicking outside modal content to close it, uncomment below:
        closeModal();
        e.stopPropagation();
      });

      document.addEventListener('DOMContentLoaded', function () {
        const calendarEl = document.getElementById('calendar');

        const calendar = new FullCalendar.Calendar(calendarEl, {
          initialView: 'dayGridMonth',
          selectable: true,
          events: async function(fetchInfo, successCallback, failureCallback) {
          try {
            const res = await fetch('/events');
            const events = await res.json();

            const now = new Date();
            const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

            const styledEvents = events.map(e => {
              const startDate = new Date(e.start);
              if (e.type === 'task' && startDate <= in48Hours && startDate > now) {
                return { ...e, className: 'urgent-task' };
              }
              return e;
            });

            successCallback(styledEvents);
          } catch (err) {
            failureCallback(err);
          }
        },

          select: function (info) {
            selectedInfo = info;
            // Create a new Date from the clicked date and set time to 10:00 AM
            let defaultStartDate = new Date(info.start);
            defaultStartDate.setHours(10, 0, 0, 0);

            // For the end date, if info.end is provided, use it; otherwise, duplicate start date.
            let defaultEndDate = info.end ? new Date(info.end) : new Date(info.start);
            defaultEndDate.setHours(10, 0, 0, 0);

            // Format the dates to match the native datetime-local input format: YYYY-MM-DDTHH:mm
            const startVal = defaultStartDate.toISOString().slice(0, 16);
            const endVal = defaultEndDate.toISOString().slice(0, 16);

            openModal('Add to Calendar', startVal, endVal);
          },

          eventClick: function (info) {
            editEventId = info.event.id;
            const startVal = info.event.start.toISOString().slice(0, 16);
            const endVal = info.event.end ? info.event.end.toISOString().slice(0, 16) : '';
            openModal('Edit Event', startVal, endVal);
            document.getElementById('eventTitle').value = info.event.title;
            document.getElementById('entryType').value = info.event.extendedProps.type || 'event';
          }
        });

        calendar.render();


        async function fetchAndDisplayTasks() {
          const res = await fetch('/events');
          const data = await res.json();

          const now = new Date();
          const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

          const upcomingTasks = data
            .filter(e => e.type === 'task' && new Date(e.start) > now)
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .slice(0, 5);

          const taskList = document.getElementById('taskList');
          taskList.innerHTML = upcomingTasks.map(task => {
            const taskStart = new Date(task.start);
            const isUrgent = taskStart <= in48Hours;

            return `<li style="${isUrgent ? 'font-weight: bold; color: red;' : ''}">
                      ${isUrgent ? '⚠️ ' : ''}<strong>${task.title}</strong> - due ${taskStart.toLocaleString()}
                    </li>`;
          }).join('');
        }

        fetchAndDisplayTasks();

        // Save button handler in modal
        document.getElementById('saveEvent').addEventListener('click', async function () {
          const title = document.getElementById('eventTitle').value;
          const start = document.getElementById('eventStart').value;
          const end = document.getElementById('eventEnd').value;

          if (!title || !start) {
            alert('Title and Start Time are required!');
            return;
          }
          
          const type = document.getElementById('entryType').value;

          const payload = { title, start, end: end || null, type };

          if (editEventId) {
            payload.id = editEventId;
            await fetch('/events', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          } else {
            await fetch('/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          }

          

          calendar.refetchEvents();
          fetchAndDisplayTasks();
          closeModal();
        });

        // Cancel button handler in modal
        document.getElementById('cancelEvent').addEventListener('click', function () {
          closeModal();
        });

        document.getElementById('deleteEvent').addEventListener('click', async function () {
          if (!editEventId) return;

          const confirmDelete = confirm("Are you sure you want to delete this entry?");
          if (!confirmDelete) return;

          await fetch(`/events/${editEventId}`, {
            method: 'DELETE'
          });

          calendar.refetchEvents();
          fetchAndDisplayTasks();
          closeModal();
        });
        
      
      });