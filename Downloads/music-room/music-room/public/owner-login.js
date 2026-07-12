document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const passwordInput = document.getElementById('passwordInput');
  const ownerNameInput = document.getElementById('ownerName');
  const statusEl = document.getElementById('status');

  // Room code can come as ?room=ABC123, or from a path like /owner-login/ABC123,
  // or fall back to whatever room the person last joined.
  const params = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const pathRoomId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;
  const roomId = params.get('room') || pathRoomId || localStorage.getItem('roomId') || '';

  loginBtn.addEventListener('click', async () => {
    const password = passwordInput.value.trim();
    const ownerName = ownerNameInput.value.trim() || 'Owner';

    if (!password) {
      statusEl.textContent = '❌ Please enter a password';
      return;
    }
    if (!roomId) {
      statusEl.textContent = '❌ No room code found — go back and create/enter a room first';
      return;
    }

    loginBtn.disabled = true;
    statusEl.textContent = 'Checking…';

    try {
      const res = await fetch('/owner-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, roomId })
      });
      const data = await res.json();

      if (data.success) {
        // script.js reads these on room.html to authenticate the socket connection
        localStorage.setItem('username', ownerName);
        localStorage.setItem('roomId', roomId);
        localStorage.setItem('ownerPassword', password);
        window.location.href = `/room/${roomId}?owner=true`;
      } else {
        statusEl.textContent = '❌ Incorrect password';
        loginBtn.disabled = false;
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = '❌ Server error, try again';
      loginBtn.disabled = false;
    }
  });
});
