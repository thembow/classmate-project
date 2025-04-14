// public/js/authHeader.js

(function() {
  // This function updates the header based on the login status.
  function updateHeader() {
    const authLinks = document.getElementById('authLinks');
    if (!authLinks) return;
    
    // Retrieve the stored token (if any)
    const token = localStorage.getItem("token");

    if (token) {
      // If a token exists, the user is logged in.
      authLinks.innerHTML = '<a href="#" id="logout">Logout</a>';

      // Attach the logout event after updating the content.
      const logoutLink = document.getElementById('logout');
      if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
          e.preventDefault();
          localStorage.removeItem("token");
          // Optionally, refresh the page or redirect the user on logout.
          window.location.href = '/login';
        });
      }
    } else {
      // Otherwise, show login and register options.
      authLinks.innerHTML = '<a href="/login">Login</a> | <a href="/register">Register</a>';
    }
  }

  // Run the function immediately.
  updateHeader();

  // Optional: If you want to update the header on every page load:
  document.addEventListener("DOMContentLoaded", updateHeader);
})();
