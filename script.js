// ===== SUPABASE CONFIG =====
const SUPABASE_URL = 'https://ajpeeftziwwmnlzekxbr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcGVlZnR6aXd3bW5semVreGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMDQzMjMsImV4cCI6MjA5MjU4MDMyM30.T5QoLwrqSUViCg73nT1lDjpmKisV50dFcQd9Yi5cvuw';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== TOAST =====
function showToast(msg) {
  let t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

// ===== DASHBOARD =====
async function loadDashboard() {
  document.getElementById("app").innerHTML = '<div class="loading">⏳ Loading...</div>';

  let { data: students } = await db.from('students').select('*');
  let today = new Date().toISOString().slice(0, 10);
  let { data: att } = await db.from('attendance').select('*').eq('date', today);

  let total = students ? students.length : 0;
  let present = att ? att.filter(a => a.status === 'present').length : 0;
  let absent = att ? att.filter(a => a.status === 'absent').length : 0;
  let percent = total > 0 ? Math.round((present / total) * 100) : 0;

  document.getElementById("app").innerHTML = `
    <div class="grid">
      <div class="card stat-card">
        <div class="stat-icon">👦</div>
        <div class="stat-num">${total}</div>
        <div class="stat-label">Kul Talaba</div>
      </div>
      <div class="card stat-card green-card">
        <div class="stat-icon">✅</div>
        <div class="stat-num">${present}</div>
        <div class="stat-label">Aaj Haazir</div>
      </div>
      <div class="card stat-card red-card">
        <div class="stat-icon">❌</div>
        <div class="stat-num">${absent}</div>
        <div class="stat-label">Aaj Ghaib</div>
      </div>
      <div class="card stat-card blue-card">
        <div class="stat-icon">📊</div>
        <div class="stat-num">${percent}%</div>
        <div class="stat-label">Haazri %</div>
      </div>
    </div>
    <div class="card" style="text-align:center; margin:10px;">
      <p style="color:#666; font-size:13px;">📅 ${today}</p>
      <p style="color:#1a3d2b; font-weight:bold; font-size:18px;">بسم الله الرحمن الرحيم</p>
      <p style="color:#555; font-size:13px;">Maktab Darul Huda Nagothane</p>
    </div>
  `;
}

// ===== TALABA =====
async function loadTalaba() {
  document.getElementById("app").innerHTML = '<div class="loading">⏳ Loading...</div>';
  let { data: students } = await db.from('students').select('*').order('name');

  let html = `
    <div style="padding:10px;">
      <button class="btn-primary" onclick="showAddStudentForm()">+ Talib Add Karo</button>
    </div>
    <div id="formArea"></div>
  `;

  if (students && students.length > 0) {
    students.forEach(s => {
      html += `
        <div class="card student-card">
          <div class="student-info">
            <div class="student-avatar">${s.name.charAt(0).toUpperCase()}</div>
            <div>
              <b>${s.name}</b><br>
              <small>Walid: ${s.father_name || '-'}</small><br>
              <span class="batch-badge">${s.batch || '-'}</span>
              ${s.phone ? `<br><small>📞 ${s.phone}</small>` : ''}
            </div>
          </div>
          <button class="btn-delete" onclick="deleteStudent(${s.id}, '${s.name}')">🗑</button>
        </div>`;
    });
  } else {
    html += '<div class="card" style="text-align:center; color:#666; padding:30px;">Koi talib nahi mila.<br>Upar + button se add karo.</div>';
  }

  document.getElementById("app").innerHTML = html;
}

function showAddStudentForm() {
  document.getElementById("formArea").innerHTML = `
    <div class="card form-card">
      <h3 style="color:#1a3d2b; margin-top:0;">Naya Talib Add Karo</h3>
      <input type="text" id="sName" placeholder="Talib ka naam *" class="input-field">
      <input type="text" id="sFather" placeholder="Walid ka naam" class="input-field">
      <input type="tel" id="sPhone" placeholder="Phone number" class="input-field">
      <select id="sBatch" class="input-field">
        <option value="">Batch select karo *</option>
        <option value="Pehli (7-8 AM)">Pehli (7-8 AM)</option>
        <option value="Doosri (2-3 PM)">Doosri (2-3 PM)</option>
        <option value="Teesri (Maghrib-Isha)">Teesri (Maghrib-Isha)</option>
      </select>
      <button class="btn-primary" onclick="addStudent()">✅ Save Karo</button>
      <button class="btn-cancel" onclick="loadTalaba()">Cancel</button>
    </div>
  `;
  document.getElementById("sName").focus();
}

async function addStudent() {
  let name = document.getElementById("sName").value.trim();
  let father_name = document.getElementById("sFather").value.trim();
  let phone = document.getElementById("sPhone").value.trim();
  let batch = document.getElementById("sBatch").value;

  if (!name) { showToast("⚠ Naam zaruri hai!"); return; }
  if (!batch) { showToast("⚠ Batch select karo!"); return; }

  let { error } = await db.from('students').insert([{ name, father_name, phone, batch }]);

  if (error) { showToast("Error: " + error.message); return; }
  showToast("✅ Talib add ho gaya!");
  loadTalaba();
}

async function deleteStudent(id, name) {
  if (!confirm(name + " ko delete karna chahte ho?")) return;
  await db.from('attendance').delete().eq('student_id', id);
  await db.from('fees').delete().eq('student_id', id);
  await db.from('students').delete().eq('id', id);
  showToast("🗑 Delete ho gaya");
  loadTalaba();
}

// ===== HAAZRI =====
async function loadHaazri() {
  document.getElementById("app").innerHTML = '<div class="loading">⏳ Loading...</div>';

  let { data: students } = await db.from('students').select('*').order('batch').order('name');
  let today = new Date().toISOString().slice(0, 10);
  let { data: todayAtt } = await db.from('attendance').select('*').eq('date', today);

  let attMap = {};
  if (todayAtt) todayAtt.forEach(a => attMap[a.student_id] = a.status);

  let html = `<div class="date-banner">📅 ${today}</div>`;

  if (!students || students.length === 0) {
    html += '<div class="card" style="text-align:center; color:#666;">Koi talib nahi. Pehle Talaba mein add karo.</div>';
    document.getElementById("app").innerHTML = html;
    return;
  }

  let batches = [...new Set(students.map(s => s.batch).filter(Boolean))];

  batches.forEach(batch => {
    html += `<div class="batch-header">${batch}</div>`;
    students.filter(s => s.batch === batch).forEach(s => {
      let status = attMap[s.id] || '';
      let pClass = status === 'present' ? 'active-green' : '';
      let aClass = status === 'absent' ? 'active-red' : '';
      html += `
        <div class="card haazri-card">
          <div class="student-name">${s.name}</div>
          <div class="att-buttons">
            <button class="btn-present ${pClass}" onclick="mark(${s.id}, 'present', this)">✔ Haazir</button>
            <button class="btn-absent ${aClass}" onclick="mark(${s.id}, 'absent', this)">✖ Ghaib</button>
          </div>
        </div>`;
    });
  });

  document.getElementById("app").innerHTML = html;
}

async function mark(studentId, status, btn) {
  let today = new Date().toISOString().slice(0, 10);

  let { data: existing } = await db.from('attendance')
    .select('*').eq('student_id', studentId).eq('date', today);

  if (existing && existing.length > 0) {
    await db.from('attendance').update({ status }).eq('id', existing[0].id);
  } else {
    await db.from('attendance').insert([{ student_id: studentId, date: today, status }]);
  }

  let card = btn.closest('.haazri-card');
  card.querySelectorAll('.btn-present, .btn-absent').forEach(b => {
    b.classList.remove('active-green', 'active-red');
  });
  btn.classList.add(status === 'present' ? 'active-green' : 'active-red');
  showToast(status === 'present' ? "✅ Haazir" : "❌ Ghaib");
}

// ===== FEES =====
async function loadFees() {
  document.getElementById("app").innerHTML = '<div class="loading">⏳ Loading...</div>';

  let { data: students } = await db.from('students').select('*').order('name');
  let year = new Date().getFullYear();
  let { data: fees } = await db.from('fees').select('*').eq('year', year);

  let feeMap = {};
  if (fees) fees.forEach(f => {
    if (!feeMap[f.student_id]) feeMap[f.student_id] = {};
    feeMap[f.student_id][f.month] = f.paid;
  });

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  let html = `<div class="date-banner">💰 Fees ${year}</div>`;

  if (!students || students.length === 0) {
    html += '<div class="card" style="text-align:center; color:#666;">Koi talib nahi.</div>';
    document.getElementById("app").innerHTML = html;
    return;
  }

  students.forEach(s => {
    let paidCount = 0;
    let monthBtns = '';
    months.forEach((m, i) => {
      let month = i + 1;
      let paid = feeMap[s.id] && feeMap[s.id][month];
      if (paid) paidCount++;
      monthBtns += `<button class="month-btn ${paid ? 'paid' : 'unpaid'}"
        onclick="toggleFee(${s.id}, ${month}, this)">${m}</button>`;
    });

    html += `
      <div class="card fees-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div><b>${s.name}</b><br><small>${s.batch || ''}</small></div>
          <div style="background:#e9f5ee; color:#1a3d2b; padding:4px 10px; border-radius:10px; font-size:13px;">
            ${paidCount}/12 ✅
          </div>
        </div>
        <div class="months-grid">${monthBtns}</div>
      </div>`;
  });

  document.getElementById("app").innerHTML = html;
}

async function toggleFee(studentId, month, btn) {
  let year = new Date().getFullYear();
  let isPaid = btn.classList.contains('paid');
  let newStatus = !isPaid;

  let { data: existing } = await db.from('fees')
    .select('*').eq('student_id', studentId).eq('month', month).eq('year', year);

  if (existing && existing.length > 0) {
    await db.from('fees').update({ paid: newStatus }).eq('id', existing[0].id);
  } else {
    await db.from('fees').insert([{ student_id: studentId, month, year, paid: newStatus }]);
  }

  btn.classList.toggle('paid', newStatus);
  btn.classList.toggle('unpaid', !newStatus);
  showToast(newStatus ? "💰 Fees mili ✅" : "Fees wapas ki");
}

// ===== REPORT =====
async function loadReport() {
  document.getElementById("app").innerHTML = '<div class="loading">⏳ Loading...</div>';

  let { data: students } = await db.from('students').select('*').order('name');
  let { data: att } = await db.from('attendance').select('*');

  let html = `
    <div style="padding:10px;">
      <button class="btn-primary" onclick="window.print()">🖨 Print Report</button>
    </div>
    <div class="date-banner">📊 Haazri Report</div>
  `;

  if (!students || students.length === 0) {
    html += '<div class="card" style="text-align:center; color:#666;">Koi talib nahi.</div>';
    document.getElementById("app").innerHTML = html;
    return;
  }

  students.forEach(s => {
    let studentAtt = att ? att.filter(a => a.student_id === s.id) : [];
    let present = studentAtt.filter(a => a.status === 'present').length;
    let total = studentAtt.length;
    let percent = total > 0 ? Math.round((present / total) * 100) : 0;
    let color = percent >= 75 ? '#2ecc71' : percent >= 50 ? '#f39c12' : '#e74c3c';

    html += `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <b>${s.name}</b><br>
            <small style="color:#666;">${s.batch || ''}</small>
          </div>
          <div style="font-size:22px; font-weight:bold; color:${color}">${percent}%</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${percent}%; background:${color}; min-width: ${percent > 0 ? '30px' : '0'}">
            ${percent > 0 ? percent + '%' : ''}
          </div>
        </div>
        <small style="color:#888;">Haazir: ${present} din | Kul: ${total} din</small>
      </div>`;
  });

  document.getElementById("app").innerHTML = html;
}

// ===== PWA INSTALL =====
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("installBtn").style.display = "block";
});

document.getElementById("installBtn").onclick = async () => {
  if (deferredPrompt) deferredPrompt.prompt();
};

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ===== START =====
loadDashboard();
