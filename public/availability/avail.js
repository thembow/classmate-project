// Set up the EventSource to receive parking data updates
    const eventSource = new EventSource('/api/parking');

    eventSource.onmessage = function(event) {
    try {
        const data = JSON.parse(event.data);  // Define the data variable here
        console.log('Received data:', data);

        // Clear the table before inserting new rows
        const tbody = document.querySelector('#parkingTable tbody');
        tbody.innerHTML = ''; 

        data.forEach(lot => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${lot.lotCode}</td>
                <td>${lot.name}</td>
                <td>
                    ${Math.round(lot.percentAvailable * 100)}%
                    <div class="bar" style="width: ${lot.percentAvailable * 100}%;"></div>
                </td>
                <td>
                    ${lot.mapLink ? `<a href="${lot.mapLink}" target="_blank">Map</a>` : '—'}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Error parsing event data:', err);
    }
};

    eventSource.onerror = function(error) {
      console.error('Error in EventSource:', error);
      alert('Failed to load parking data. Please try again later.');
    };

// New code: Fetch library occupancy data
fetch('/api/libraryoccupancy')
  .then(res => res.json())
  .then(data => {
    const occ = document.createElement('div');
    occ.innerHTML = `<h2>📚 Atkins Library Occupancy: ${data.occupancy} people</h2>`;
    document.body.insertBefore(occ, document.body.firstChild);
  })
  .catch(err => {
    console.error('Failed to fetch library occupancy:', err);
  });