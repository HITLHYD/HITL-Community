// ══════════════════════════════════════════════════════════
//  HITL PVT LTD — LMS App v2
//  ✅ No Firebase needed — works by opening index.html
//  Admin login: admin@hitl.com / admin123
// ══════════════════════════════════════════════════════════

// ── LocalStorage DB ───────────────────────────────────────
const DB = {
  get: (key) => { try { return JSON.parse(localStorage.getItem('hitl_' + key) || 'null'); } catch(e) { return null; } },
  set: (key, val) => localStorage.setItem('hitl_' + key, JSON.stringify(val)),
  remove: (key) => localStorage.removeItem('hitl_' + key),
};

// ── Admin credentials (change as needed) ─────────────────
const ADMIN = { email: 'admin@hitl.co.in', password: 'HITL@9188@PVTLTD' };

// ── Seed demo data on first load ──────────────────────────
function seedData() {
  if (DB.get('seeded')) return;

  DB.set('classes', [
    { id: 'c1', name: 'Web Development', code: 'HITL-CS-101', instructor: 'Prof. Sharma', schedule: 'Mon, Wed — 10:00 AM', link: 'https://meet.google.com/abc-defg-hij', createdAt: Date.now() },
    { id: 'c2', name: 'Data Structures & Algorithms', code: 'HITL-CS-102', instructor: 'Prof. Reddy', schedule: 'Tue, Thu — 11:00 AM', link: 'https://zoom.us/j/1234567890', createdAt: Date.now() - 1000 },
    { id: 'c3', name: 'Database Management', code: 'HITL-CS-103', instructor: 'Prof. Nair', schedule: 'Fri — 9:00 AM', link: '', createdAt: Date.now() - 2000 },
    { id: 'c4', name: 'Machine Learning Basics', code: 'HITL-AI-201', instructor: 'Prof. Rao', schedule: 'Mon, Wed — 2:00 PM', link: 'https://youtube.com/live/example', createdAt: Date.now() - 3000 },
  ]);

  DB.set('updates', [
    { id: 'u1', title: 'Welcome to HITL LMS!', description: 'The HITL Learning Portal is now live. Click "Join Class" on any class to open the class link.', type: 'info', createdAt: Date.now() },
    { id: 'u2', title: 'Mid-Term Exam Schedule Released', description: 'Mid-term examinations will be held from 15th April. Check with your respective faculty for subject-wise timings.', type: 'notice', createdAt: Date.now() - 86400000 },
    { id: 'u3', title: 'Holiday Notice — Tomorrow', description: 'Classes are suspended tomorrow due to a public holiday. Regular schedule resumes the day after.', type: 'urgent', createdAt: Date.now() - 172800000 },
  ]);

  DB.set('students', {});
  DB.set('seeded', true);
}

// ── Session ───────────────────────────────────────────────
function getSession()      { return DB.get('session'); }
function setSession(data)  { DB.set('session', data); }
function clearSession()    { DB.remove('session'); }

// ══════════════════ BOOT ══════════════════
window.addEventListener('DOMContentLoaded', () => {
  seedData();
  updateLandingStats();

  const sess = getSession();
  if (sess?.role === 'admin') {
    loadAdminDashboard();
    showPage('admin');
  } else if (sess?.role === 'student') {
    loadDashboard(sess);
    showPage('dashboard');
  } else {
    showPage('landing');
  }
});

// ══════════════════ NAVIGATION ══════════════════

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
}

function switchTab(tab, el) {
  if (el) {
    document.querySelectorAll('#page-dashboard .nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
  }
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  const titles = { home:'Home', classes:'My Classes', updates:'Updates', profile:'My Profile' };
  document.getElementById('topbar-title').textContent = titles[tab] || tab;
}

function switchAdminTab(tab, el) {
  if (el) {
    document.querySelectorAll('#page-admin .nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
  }
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('atab-' + tab).classList.add('active');
  const titles = { overview:'Overview', 'manage-classes':'Classes', 'manage-updates':'Announcements', students:'Students' };
  document.getElementById('admin-topbar-title').textContent = titles[tab] || tab;

  // Refresh content when switching tabs
  if (tab === 'manage-classes') renderAdminClasses();
  if (tab === 'manage-updates') renderAdminUpdates();
  if (tab === 'students')       renderAdminStudents();
}

// ══════════════════ LANDING STATS ══════════════════

function updateLandingStats() {
  const students = DB.get('students') || {};
  const classes  = DB.get('classes')  || [];
  document.getElementById('landing-students').textContent = Object.keys(students).length;
  document.getElementById('landing-classes').textContent  = classes.length;
}

// ══════════════════ STUDENT SIGNUP ══════════════════

function handleSignup() {
  const name  = v('signup-name');
  const email = v('signup-email');
  const roll  = v('signup-roll');
  const pass  = document.getElementById('signup-password').value;

  const errEl = document.getElementById('signup-error');
  const sucEl = document.getElementById('signup-success');
  hide(errEl); hide(sucEl);

  if (!name || !email || !roll || !pass) return showErr(errEl, 'Please fill in all fields.');
  if (!email.includes('@'))              return showErr(errEl, 'Please enter a valid email address.');
  if (pass.length < 6)                  return showErr(errEl, 'Password must be at least 6 characters.');

  const students = DB.get('students') || {};
  if (Object.values(students).find(s => s.email === email))
    return showErr(errEl, 'This email is already registered. Try logging in.');

  setBusy('signup-btn', true);
  setTimeout(() => {
    const uid = 'uid_' + Date.now();
    students[uid] = { uid, name, email, roll, password: pass, joinedAt: fmtDate(Date.now()) };
    DB.set('students', students);

    sucEl.textContent = '✅ Account created! Signing you in…';
    show(sucEl);
    setTimeout(() => {
      const user = { ...students[uid], role: 'student' };
      setSession(user);
      loadDashboard(user);
      showPage('dashboard');
      setBusy('signup-btn', false);
      updateLandingStats();
    }, 900);
  }, 700);
}

// ══════════════════ STUDENT LOGIN ══════════════════

function handleLogin() {
  const email = v('login-email');
  const pass  = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  hide(errEl);

  if (!email || !pass) return showErr(errEl, 'Please enter your email and password.');

  setBusy('login-btn', true);
  setTimeout(() => {
    const students = DB.get('students') || {};
    const found    = Object.values(students).find(s => s.email === email && s.password === pass);
    if (!found) {
      showErr(errEl, 'Invalid email or password. Please try again.');
      setBusy('login-btn', false);
      return;
    }
    const user = { ...found, role: 'student' };
    setSession(user);
    loadDashboard(user);
    showPage('dashboard');
    setBusy('login-btn', false);
  }, 700);
}

// ══════════════════ STUDENT LOGOUT ══════════════════

function handleLogout() {
  clearSession();
  showPage('landing');
}

// ══════════════════ ADMIN LOGIN ══════════════════

function handleAdminLogin() {
  const email = v('admin-email');
  const pass  = document.getElementById('admin-password').value;
  const errEl = document.getElementById('admin-login-error');
  hide(errEl);

  if (!email || !pass) return showErr(errEl, 'Please enter admin credentials.');

  setBusy('admin-login-btn', true);
  setTimeout(() => {
    if (email === ADMIN.email && pass === ADMIN.password) {
      setSession({ role: 'admin' });
      loadAdminDashboard();
      showPage('admin');
    } else {
      showErr(errEl, 'Invalid admin credentials.');
    }
    setBusy('admin-login-btn', false);
  }, 600);
}

function handleAdminLogout() {
  clearSession();
  showPage('landing');
}

// ══════════════════ STUDENT DASHBOARD ══════════════════

function loadDashboard(user) {
  const initial = (user.name || 'S')[0].toUpperCase();
  ['user-avatar','profile-avatar'].forEach(id => el(id).textContent = initial);
  el('user-name').textContent      = user.name  || 'Student';
  el('profile-name').textContent   = user.name  || '—';
  el('profile-email').textContent  = user.email || '—';
  el('profile-roll').textContent   = user.roll  || '—';
  el('profile-joined').textContent = user.joinedAt || '—';

  const h = new Date().getHours();
  const g = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  el('welcome-msg').textContent = `${g}, ${(user.name||'Student').split(' ')[0]}! 👋`;
  el('today-date').textContent  = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short' });

  renderStudentClasses();
  renderStudentUpdates();
}

function renderStudentClasses() {
  const classes = DB.get('classes') || [];
  el('class-count').textContent = classes.length;
  const grid = el('classes-grid');

  if (!classes.length) { grid.innerHTML = emptyState('📚','No classes yet. Check back soon!'); return; }

  const emojis = ['📘','📗','📙','🔬','💻','🎨','🧮','🌍','🧬','📐'];
  grid.innerHTML = classes.map((c, i) => {
    const hasLink = c.link && c.link.trim();
    const joinBtn = hasLink
      ? `<a class="btn-join" href="${esc(c.link)}" target="_blank" rel="noopener">🔗 Join Class</a>`
      : `<span class="btn-join no-link">🔗 Link not added yet</span>`;
    return `
      <div class="class-card">
        <div class="class-emoji">${emojis[i % emojis.length]}</div>
        <div class="class-name">${esc(c.name)}</div>
        <div class="class-code">${esc(c.code)}</div>
        <div class="class-instructor">👤 ${esc(c.instructor)}</div>
        <div class="class-schedule">📅 ${esc(c.schedule)}</div>
        <div class="class-actions">${joinBtn}</div>
      </div>`;
  }).join('');
}

function renderStudentUpdates() {
  const updates = DB.get('updates') || [];
  el('update-count').textContent = updates.length;
  if (!updates.length) el('updates-badge').style.display = 'none';
  else el('updates-badge').style.display = 'flex';

  const makeCard = (u) => {
    const t = { urgent:{icon:'🚨',cls:'urgent'}, notice:{icon:'📌',cls:'notice'}, info:{icon:'📢',cls:'info'} }[u.type] || {icon:'📢',cls:'info'};
    return `<div class="update-item ${t.cls}">
      <div class="update-icon">${t.icon}</div>
      <div class="update-body">
        <div class="update-title">${esc(u.title)}</div>
        <div class="update-desc">${esc(u.description||'')}</div>
        <div class="update-meta">Posted: ${fmtDate(u.createdAt)} &nbsp;·&nbsp; HITL PVT LTD</div>
      </div></div>`;
  };

  el('home-updates-list').innerHTML = updates.slice(0,3).map(makeCard).join('') || emptyState('📢','No announcements yet.');
  el('updates-list').innerHTML      = updates.map(makeCard).join('') || emptyState('📢','No announcements yet.');
}

// ══════════════════ ADMIN DASHBOARD ══════════════════

function loadAdminDashboard() {
  renderAdminOverview();
  renderAdminClasses();
  renderAdminUpdates();
  renderAdminStudents();
}

function renderAdminOverview() {
  const classes  = DB.get('classes')  || [];
  const updates  = DB.get('updates')  || [];
  const students = DB.get('students') || {};
  el('admin-class-count').textContent   = classes.length;
  el('admin-student-count').textContent = Object.keys(students).length;
  el('admin-update-count').textContent  = updates.length;
}

function renderAdminClasses() {
  const classes = DB.get('classes') || [];
  const list    = el('admin-classes-list');
  renderAdminOverview();

  if (!classes.length) { list.innerHTML = emptyState('📚','No classes yet. Add one!'); return; }

  const emojis = ['📘','📗','📙','🔬','💻','🎨','🧮','🌍','🧬','📐'];
  list.innerHTML = classes.map((c, i) => `
    <div class="admin-item">
      <div class="admin-item-icon">${emojis[i % emojis.length]}</div>
      <div class="admin-item-info">
        <div class="admin-item-name">${esc(c.name)} <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--teal);margin-left:8px">${esc(c.code)}</span></div>
        <div class="admin-item-meta">👤 ${esc(c.instructor)} &nbsp;·&nbsp; 📅 ${esc(c.schedule)}</div>
        <div class="admin-item-link">${c.link ? '🔗 ' + esc(c.link) : '<span style="color:rgba(176,196,224,.4)">No link added</span>'}</div>
      </div>
      <div class="admin-item-actions">
        <button class="btn-primary btn-sm" onclick="openEditClass('${c.id}')">✏️ Edit</button>
        <button class="btn-danger" onclick="deleteClass('${c.id}')">🗑</button>
      </div>
    </div>`).join('');
}

function renderAdminUpdates() {
  const updates = DB.get('updates') || [];
  const list    = el('admin-updates-list');
  renderAdminOverview();

  if (!updates.length) { list.innerHTML = emptyState('📢','No announcements yet.'); return; }

  const tMap = { urgent:{icon:'🚨',label:'Urgent'}, notice:{icon:'📌',label:'Notice'}, info:{icon:'📢',label:'Info'} };
  list.innerHTML = updates.map(u => {
    const t = tMap[u.type] || tMap.info;
    return `<div class="admin-item">
      <div class="admin-item-icon">${t.icon}</div>
      <div class="admin-item-info">
        <div class="admin-item-name">${esc(u.title)}</div>
        <div class="admin-item-meta">${esc(u.description||'')} &nbsp;·&nbsp; <span style="color:var(--teal)">${t.label}</span></div>
        <div class="update-meta" style="margin-top:6px">Posted: ${fmtDate(u.createdAt)}</div>
      </div>
      <div class="admin-item-actions">
        <button class="btn-danger" onclick="deleteUpdate('${u.id}')">🗑 Delete</button>
      </div>
    </div>`;
  }).join('');
}

function renderAdminStudents() {
  const students = DB.get('students') || {};
  const list     = el('admin-students-list');
  renderAdminOverview();
  const arr = Object.values(students);

  if (!arr.length) { list.innerHTML = emptyState('👥','No students registered yet.'); return; }

  list.innerHTML = `
    <table class="students-table">
      <thead><tr>
        <th>#</th><th>Name</th><th>Email</th><th>Roll No.</th><th>Joined</th>
      </tr></thead>
      <tbody>${arr.map((s,i) => `
        <tr>
          <td style="color:var(--white-dim)">${i+1}</td>
          <td><strong>${esc(s.name)}</strong></td>
          <td style="color:var(--white-dim)">${esc(s.email)}</td>
          <td><span class="s-roll">${esc(s.roll)}</span></td>
          <td style="color:var(--white-dim);font-size:13px">${esc(s.joinedAt||'—')}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

// ══════════════════ MODAL — ADD / EDIT CLASS ══════════════════

function openAddClass() {
  el('modal-title').textContent = '➕ Add New Class';
  el('modal-body').innerHTML = classForm();
  showModal();
}

function openEditClass(id) {
  const classes = DB.get('classes') || [];
  const c = classes.find(x => x.id === id);
  if (!c) return;
  el('modal-title').textContent = '✏️ Edit Class';
  el('modal-body').innerHTML = classForm(c);
  showModal();
}

function classForm(c = {}) {
  return `
    <div class="form-group"><label>Class Name</label><input type="text" id="f-name" placeholder="e.g. Web Development" value="${esc(c.name||'')}"/></div>
    <div class="form-group"><label>Class Code</label><input type="text" id="f-code" placeholder="e.g. HITL-CS-101" value="${esc(c.code||'')}"/></div>
    <div class="form-group"><label>Instructor Name</label><input type="text" id="f-instructor" placeholder="e.g. Prof. Sharma" value="${esc(c.instructor||'')}"/></div>
    <div class="form-group"><label>Schedule / Timing</label><input type="text" id="f-schedule" placeholder="e.g. Mon, Wed — 10:00 AM" value="${esc(c.schedule||'')}"/></div>
    <div class="form-group"><label>Class Link (Google Meet / Zoom / YouTube)</label><input type="url" id="f-link" placeholder="https://meet.google.com/..." value="${esc(c.link||'')}"/></div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveClass('${c.id||''}')"><span>Save Class</span></button>
    </div>`;
}

function saveClass(id) {
  const name       = v('f-name');
  const code       = v('f-code');
  const instructor = v('f-instructor');
  const schedule   = v('f-schedule');
  const link       = v('f-link');

  if (!name || !code) return alert('Class Name and Code are required.');

  const classes = DB.get('classes') || [];
  if (id) {
    const idx = classes.findIndex(c => c.id === id);
    if (idx > -1) classes[idx] = { ...classes[idx], name, code, instructor, schedule, link };
  } else {
    classes.unshift({ id: 'c' + Date.now(), name, code, instructor, schedule, link, createdAt: Date.now() });
  }
  DB.set('classes', classes);
  closeModal();
  renderAdminClasses();
}

function deleteClass(id) {
  if (!confirm('Delete this class?')) return;
  const classes = (DB.get('classes') || []).filter(c => c.id !== id);
  DB.set('classes', classes);
  renderAdminClasses();
}

// ══════════════════ MODAL — ADD UPDATE ══════════════════

function openAddUpdate() {
  el('modal-title').textContent = '📣 Post Announcement';
  el('modal-body').innerHTML = `
    <div class="form-group"><label>Title</label><input type="text" id="u-title" placeholder="e.g. Exam Postponed"/></div>
    <div class="form-group"><label>Message</label><textarea id="u-desc" placeholder="Write your announcement here…"></textarea></div>
    <div class="form-group"><label>Type</label>
      <select id="u-type">
        <option value="info">📢 Info</option>
        <option value="notice">📌 Notice</option>
        <option value="urgent">🚨 Urgent</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveUpdate()"><span>Post Announcement</span></button>
    </div>`;
  showModal();
}

function saveUpdate() {
  const title = v('u-title');
  const desc  = document.getElementById('u-desc').value.trim();
  const type  = document.getElementById('u-type').value;

  if (!title) return alert('Title is required.');

  const updates = DB.get('updates') || [];
  updates.unshift({ id: 'u' + Date.now(), title, description: desc, type, createdAt: Date.now() });
  DB.set('updates', updates);
  closeModal();
  renderAdminUpdates();
}

function deleteUpdate(id) {
  if (!confirm('Delete this announcement?')) return;
  const updates = (DB.get('updates') || []).filter(u => u.id !== id);
  DB.set('updates', updates);
  renderAdminUpdates();
}

// ══════════════════ MODAL HELPERS ══════════════════

function showModal() { el('modal-overlay').classList.remove('hidden'); }
function closeModal(e) {
  if (e && e.target !== el('modal-overlay')) return;
  el('modal-overlay').classList.add('hidden');
}

// ══════════════════ UTILS ══════════════════

function el(id)         { return document.getElementById(id); }
function v(id)          { return (el(id)?.value || '').trim(); }
function show(e)        { e.classList.remove('hidden'); }
function hide(e)        { e.classList.add('hidden'); }

function showErr(el, msg) { el.textContent = '⚠️ ' + msg; show(el); }

function setBusy(btnId, busy) {
  const btn = el(btnId);
  const sp  = btn.querySelector('span');
  const ld  = btn.querySelector('.btn-loader');
  if (busy) { sp.style.display='none'; ld.classList.remove('hidden'); btn.disabled=true; }
  else      { sp.style.display='';     ld.classList.add('hidden');    btn.disabled=false; }
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function emptyState(icon, msg) {
  return `<div class="empty-state"><span class="empty-icon">${icon}</span><p>${msg}</p></div>`;
}
