(() => {
  const byId = (id) => document.getElementById(id);
  const token = () => localStorage.getItem('civicmitra.token');
  const user = () => JSON.parse(localStorage.getItem('civicmitra.user') || 'null');
  const toast = (message, error = false) => {
    const element = byId('toast');
    element.textContent = message;
    element.className = `toast show${error ? ' error' : ''}`;
    window.clearTimeout(window.civicMitraToast);
    window.civicMitraToast = window.setTimeout(() => element.className = 'toast', 4200);
  };
  const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const request = async (url, options = {}) => {
    const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token()}`, ...(options.headers || {}) } });
    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) throw new Error(typeof body === 'string' ? body : body.error || body.message || 'Something went wrong.');
    return body;
  };
  const formatDate = (value) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value)) : 'Recently added';
  const currentLocation = () => new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ reportedLat: coords.latitude, reportedLng: coords.longitude, deviceLat: coords.latitude, deviceLng: coords.longitude }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
  const state = { reports: [], mode: 'mine' };

  function reportCard(report) {
    const ownsReport = user()?.email === report.citizenEmail;
    const authority = user()?.role === 'AUTHORITY';
    const image = report.imagePath ? `<img src="/uploads/${encodeURIComponent(report.imagePath)}" alt="Report photo">` : '<div class="report-image-placeholder">⌂</div>';
    const authorityControl = authority ? `<label class="status-select">Status<select data-status-id="${report.id}"><option value="PENDING" ${report.status === 'PENDING' ? 'selected' : ''}>Pending</option><option value="UNDER_REVIEW" ${report.status === 'UNDER_REVIEW' ? 'selected' : ''}>Under review</option><option value="RESOLVED" ${report.status === 'RESOLVED' ? 'selected' : ''}>Resolved</option><option value="REJECTED" ${report.status === 'REJECTED' ? 'selected' : ''}>Not accepted</option></select></label>` : '';
    return `<article class="report-card"><button class="report-open" data-view-id="${report.id}" type="button">${image}<div class="report-copy"><span class="status-chip ${report.status === 'REJECTED' ? 'failed' : ''}">${escapeHtml((report.status || 'PENDING').replaceAll('_', ' ').toLowerCase())}</span><h3>${escapeHtml(report.title)}</h3><p>${escapeHtml(report.description)}</p><small>${escapeHtml(report.location || 'Your neighbourhood')} · ${formatDate(report.createdAt)}</small></div></button><div class="report-footer"><span>♡ ${report.upvotes || 0} support</span><div class="report-card-actions"><button data-support-id="${report.id}" class="text-button" type="button">Support</button>${ownsReport ? `<button data-edit-id="${report.id}" class="text-button" type="button">Edit</button>` : ''}${authorityControl}</div></div></article>`;
  }
  function renderReports(reports) {
    const list = byId('reportList');
    state.reports = reports;
    list.innerHTML = reports.length ? reports.map(reportCard).join('') : '<p class="empty-reports">No reports to show yet.</p>';
  }
  async function loadReports(mode = state.mode) {
    if (!token()) { byId('loginDialog').showModal(); toast('Please sign in to view reports.', true); return; }
    state.mode = mode;
    byId('reportList').innerHTML = '<p class="empty-reports">Loading reports…</p>';
    try { renderReports(await request(mode === 'community' ? '/api/v1/complaints' : '/api/v1/complaints/my-complaints')); }
    catch (error) { byId('reportList').innerHTML = `<p class="empty-reports">${escapeHtml(error.message)}</p>`; toast(error.message, true); }
  }
  function resetReportForm() {
    byId('reportForm').reset();
    byId('reportId').value = '';
    byId('reportDialogTitle').textContent = 'Report an issue';
    byId('deleteReportButton').classList.add('hidden');
    byId('reportError').textContent = '';
  }
  async function openReport(id, editable = false) {
    try {
      const report = await request(`/api/v1/complaints/${id}`);
      resetReportForm();
      byId('reportId').value = report.id;
      byId('reportTitle').value = report.title || '';
      byId('reportDescription').value = report.description || '';
      byId('reportWard').value = report.wardId || '';
      byId('reportCategory').value = report.category || '';
      byId('reportDialogTitle').textContent = editable ? 'Update your report' : 'Report details';
      byId('reportImage').required = false;
      const canEdit = editable && user()?.email === report.citizenEmail;
      byId('reportTitle').readOnly = !canEdit;
      byId('reportDescription').readOnly = !canEdit;
      byId('reportCategory').readOnly = !canEdit;
      byId('reportWard').required = canEdit;
      byId('reportImage').parentElement.classList.toggle('hidden', !canEdit);
      byId('deleteReportButton').classList.toggle('hidden', !canEdit);
      byId('reportForm').querySelector('[type=submit]').classList.toggle('hidden', !canEdit);
      byId('reportDialog').showModal();
    } catch (error) { toast(error.message, true); }
  }
  async function saveReport(event) {
    event.preventDefault();
    if (!token()) { byId('loginDialog').showModal(); return; }
    const id = byId('reportId').value;
    const payload = { title: byId('reportTitle').value.trim(), description: byId('reportDescription').value.trim(), wardId: Number(byId('reportWard').value), category: byId('reportCategory').value.trim(), ...(await currentLocation()) };
    const errorElement = byId('reportError');
    errorElement.textContent = '';
    try {
      if (id) {
        await request(`/api/v1/complaints/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        const image = byId('reportImage').files[0];
        if (!image) throw new Error('Please add a photo so the team can understand the issue.');
        const formData = new FormData();
        formData.append('image', image);
        formData.append('complaint', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
        await request('/api/v1/complaints', { method: 'POST', body: formData });
      }
      byId('reportDialog').close();
      toast(id ? 'Your report has been updated.' : 'Your report has been shared.');
      loadReports('mine');
    } catch (error) { errorElement.textContent = error.message; }
  }
  async function deleteReport() {
    const id = byId('reportId').value;
    if (!id) return;
    try { await request(`/api/v1/complaints/${id}`, { method: 'DELETE' }); byId('reportDialog').close(); toast('Your report has been removed.'); loadReports('mine'); }
    catch (error) { byId('reportError').textContent = error.message; }
  }
  async function supportReport(id) {
    try { await request(`/api/v1/complaints/${id}/upvote`, { method: 'PATCH' }); toast('Thanks for supporting this report.'); loadReports(state.mode); }
    catch (error) { toast(error.message, true); }
  }
  async function updateStatus(id, status) {
    try { await request(`/api/v1/complaints/${id}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH' }); toast('Report status updated.'); loadReports(state.mode); }
    catch (error) { toast(error.message, true); }
  }
  async function register(event) {
    event.preventDefault();
    const municipalityId = byId('registerMunicipality').value.trim();
    const wardId = byId('registerWard').value.trim();
    const data = { fullName: byId('registerName').value.trim(), email: byId('registerEmail').value.trim(), phoneNumber: byId('registerPhone').value.trim(), password: byId('registerPassword').value, role: byId('registerRole').value, municipalityId: municipalityId ? Number(municipalityId) : null, wardId: wardId ? Number(wardId) : null };
    try {
      const response = await fetch('/api/v1/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'We could not create your account.');
      byId('registerDialog').close();
      byId('loginDialog').showModal();
      byId('loginEmail').value = data.email;
      toast('Account created. Please sign in.');
    } catch (error) { byId('registerError').textContent = error.message; }
  }

  byId('communityReportsButton').addEventListener('click', () => loadReports('community'));
  byId('myReportsButton').addEventListener('click', () => loadReports('mine'));
  byId('newReportButton').addEventListener('click', () => { if (!token()) return byId('loginDialog').showModal(); resetReportForm(); byId('reportImage').required = true; byId('reportImage').parentElement.classList.remove('hidden'); byId('reportForm').querySelector('[type=submit]').classList.remove('hidden'); byId('reportDialog').showModal(); });
  byId('reportForm').addEventListener('submit', saveReport);
  byId('deleteReportButton').addEventListener('click', deleteReport);
  byId('openRegisterButton').addEventListener('click', () => { byId('loginDialog').close(); byId('registerDialog').showModal(); });
  byId('registerForm').addEventListener('submit', register);
  document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => byId(button.dataset.closeDialog).close()));
  byId('reportList').addEventListener('click', (event) => { const target = event.target.closest('button'); if (!target) return; if (target.dataset.viewId) openReport(target.dataset.viewId); if (target.dataset.editId) openReport(target.dataset.editId, true); if (target.dataset.supportId) supportReport(target.dataset.supportId); });
  byId('reportList').addEventListener('change', (event) => { if (event.target.dataset.statusId) updateStatus(event.target.dataset.statusId, event.target.value); });
})();
