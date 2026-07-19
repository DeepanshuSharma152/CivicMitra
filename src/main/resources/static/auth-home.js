(() => {
  const el = (id) => document.getElementById(id);
  const roleDescriptions = {
    CITIZEN: ['Citizen services', 'Manage household waste updates and pickup readiness.'],
    WORKER: ['Collection team', 'Confirm doorstep collections and manage your assigned route.'],
    AUTHORITY: ['Authority services', 'Review neighbourhood reports and monitor service updates.'],
    MUNICIPAL_ADMIN: ['Municipal operations', 'Coordinate city services and municipal workflows.']
  };
  const message = (id, value = '') => { el(id).textContent = value; };
  const readBody = async (response) => {
    const text = await response.text();
    try { return text ? JSON.parse(text) : {}; } catch { return { message: text }; }
  };
  const setLoading = (button, loading, label) => { button.disabled = loading; button.textContent = loading ? 'Please wait…' : label; };
  const selectedRole = () => el('registerRole').value;

  function updateRoleDetail() {
    const role = selectedRole();
    const content = roleDescriptions[role];
    const detail = el('roleDetail');
    const ward = el('wardField');
    if (!content) {
      detail.innerHTML = '<span class="role-icon" aria-hidden="true">⌂</span><div><strong>Select your role above</strong><p>We will tailor CivicMitra to the services you use.</p></div>';
      ward.classList.add('hidden');
      return;
    }
    detail.innerHTML = `<span class="role-icon" aria-hidden="true">✓</span><div><strong>${content[0]}</strong><p>${content[1]}</p></div>`;
    ward.classList.toggle('hidden', !['CITIZEN', 'WORKER'].includes(role));
  }

  el('registerRole').addEventListener('change', updateRoleDetail);
  el('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = el('loginSubmit');
    message('loginError');
    setLoading(button, true, 'Login');
    try {
      const response = await fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: el('loginEmail').value.trim(), password: el('loginPassword').value }) });
      const data = await readBody(response);
      if (!response.ok) throw new Error(data.error || data.message || 'Unable to sign in. Please check your details.');
      const storage = el('rememberLogin').checked ? localStorage : sessionStorage;
      storage.setItem('civicmitra.token', data.token);
      storage.setItem('civicmitra.user', JSON.stringify(data));
      window.location.assign('/dashboard');
    } catch (error) { message('loginError', error.message); }
    finally { setLoading(button, false, 'Login'); }
  });
  el('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = el('registerSubmit');
    const role = selectedRole();
    const wardInput = el('registerWard').value.trim();
    message('registerError');
    if (!role) { message('registerError', 'Please select the account type that fits you.'); return; }
    if (['CITIZEN', 'WORKER'].includes(role) && !wardInput) { message('registerError', 'Please enter your ward reference.'); return; }
    setLoading(button, true, 'Create account');
    try {
      const response = await fetch('/api/v1/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: el('registerName').value.trim(), email: el('registerEmail').value.trim(), phoneNumber: el('registerPhone').value.trim(), password: el('registerPassword').value, role, municipalityId: Number(el('registerMunicipality').value), wardId: wardInput ? Number(wardInput) : null }) });
      const data = await readBody(response);
      if (!response.ok) throw new Error(data.error || data.message || 'Unable to create your account.');
      el('loginEmail').value = el('registerEmail').value.trim();
      el('loginPassword').focus();
      el('registerForm').reset();
      updateRoleDetail();
      message('registerError', 'Account created. Sign in using the form on the left.');
      el('registerError').style.color = '#087a42';
    } catch (error) { el('registerError').style.color = ''; message('registerError', error.message); }
    finally { setLoading(button, false, 'Create account'); }
  });
  updateRoleDetail();
})();
