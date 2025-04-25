
(function() {
  function updateHeader() {
    const authLinks = document.getElementById('authLinks');
    if (!authLinks) return;
    
    const token = localStorage.getItem("token");

    if (token) {
      authLinks.innerHTML = '<a href="#" id="logout">Logout</a>';

      const logoutLink = document.getElementById('logout');
      if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
          e.preventDefault();
          localStorage.removeItem("token");
          window.location.href = '/login';
        });
      }
    } else {
      authLinks.innerHTML = '<a href="/login">Login</a> | <a href="/register">Register</a>';
    }
  }

  updateHeader();

  document.addEventListener("DOMContentLoaded", updateHeader);
})();
