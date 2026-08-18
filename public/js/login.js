document.getElementById('btnEntrar').addEventListener('click', async () => {
  const error = document.getElementById('error');
  error.style.display = 'none';
  try {
    const respuesta = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
      }),
    });
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo.error || 'No fue posible iniciar sesión');
    localStorage.setItem('token', cuerpo.data.token);
    localStorage.setItem('usuario', JSON.stringify(cuerpo.data.usuario));
    window.location.href = 'usuarios.html';
  } catch (e) {
    error.textContent = e.message;
    error.style.display = 'block';
  }
});