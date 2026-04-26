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
      <div class="card stat-card"><div class="stat-icon">👦</div><div class="stat-num">${total}</div><div class="stat-label">Kul Talaba</div></div>
      <div class="card stat-card green-card"><div class="stat-icon">✅</div><div class="stat-num">${present}</div><div class="stat-label">Aaj Haazir</div></div>
      <div class="card stat-card red-card"><div class="stat-icon">❌</div><div class="stat-num">${absent}</div><div class="stat-label">Aaj Ghaib</div></div>
      <div class="card stat-card blue-card"><div class="stat-icon">📊</div><div class="stat-num">${percent}%</div><div class="stat-label">Haazri %</div></div>
    </div>
    <div class="card" style="text-align:center; margin:10px;">
      <p style="color:#666; font-size:13px;">📅 ${today}</p>
      <p style="color:#1a3d2b; font-weight:bold; font-size:18px;">بسم الله الرحمن الرحيم</p>
      <p style="color:#555; font-size:13px;">Maktab Darul Huda Nagothane</p>
    </div>`;
}

// ===== TALABA =====
async function loadTalaba() {
  document.getElementById("app").innerHTML = '<div class="loading">⏳ Loading...</div>';
  let { data: students } = await db.from('students').select('*').order('name');
  let html = `<div style="padding:10px;"><button class="btn-primary" onclick="showAddStudentForm()">+ Talib Add Karo</button></div><div id="formArea"></div>`;
  if (students && students.length > 0) {
    students.forEach(s => {
      html += `
        <div class="card student-card" onclick="loadProfile(${s.id})" style="cursor:pointer;">
          <div class="student-info">
            <div class="student-avatar">${s.name.charAt(0).toUpperCase()}</div>
            <div>
              <b>${s.name}</b><br>
              <small>Walid: ${s.father_name || '-'}</small><br>
              <span class="batch-badge">${s.batch || '-'}</span>
              ${s.phone ? `<br><small>📞 ${s.phone}</small>` : ''}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:5px;align-items:center;">
            <button class="btn-delete" onclick="event.stopPropagation();deleteStudent(${s.id},'${s.name}')">🗑</button>
            <span style="font-size:11px;color:#2d6a4f;">Profile ›</span>
          </div>
        </div>`;
    });
  } else {
    html += '<div class="card" style="text-align:center;color:#666;padding:30px;">Koi talib nahi.<br>Upar + button se add karo.</div>';
  }
  document.getElementById("app").innerHTML = html;
}

function showAddStudentForm() {
  document.getElementById("formArea").innerHTML = `
    <div class="card form-card">
      <h3 style="color:#1a3d2b;margin-top:0;">Naya Talib Add Karo</h3>
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
    </div>`;
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

// ===== STUDENT PROFILE =====
async function loadProfile(studentId) {
  document.getElementById("app").innerHTML = '<div class="loading">⏳ Loading...</div>';
  let { data: s } = await db.from('students').select('*').eq('id', studentId).single();
  let { data: att } = await db.from('attendance').select('*').eq('student_id', studentId);
  let year = new Date().getFullYear();
  let { data: fees } = await db.from('fees').select('*').eq('student_id', studentId).eq('year', year);

  let present = att ? att.filter(a => a.status === 'present').length : 0;
  let total = att ? att.length : 0;
  let percent = total > 0 ? Math.round((present / total) * 100) : 0;
  let color = percent >= 75 ? '#2ecc71' : percent >= 50 ? '#f39c12' : '#e74c3c';

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let feesPaid = fees ? fees.filter(f => f.paid).length : 0;

  let feesHtml = '';
  months.forEach((m, i) => {
    let paid = fees && fees.find(f => f.month === i+1 && f.paid);
    feesHtml += `<span class="fee-month ${paid ? 'paid' : 'unpaid'}">${m}</span>`;
  });

  let attHtml = '';
  if (att && att.length > 0) {
    let sorted = [...att].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    sorted.forEach(a => {
      attHtml += `<div class="att-row">
        <span>${a.date}</span>
        <span class="${a.status === 'present' ? 'status-present' : 'status-absent'}">
          ${a.status === 'present' ? '✅ Haazir' : '❌ Ghaib'}
        </span>
      </div>`;
    });
  } else {
    attHtml = '<p style="color:#aaa;text-align:center;">Koi haazri nahi mili</p>';
  }

  let shareText = `*Maktab Darul Huda Nagothane*\n\n*Talib:* ${s.name}\n*Walid:* ${s.father_name || '-'}\n*Batch:* ${s.batch || '-'}\n\n*Haazri:* ${present}/${total} din (${percent}%)\n*Fees ${year}:* ${feesPaid}/12 mahine\n\nJazakAllah`;

  document.getElementById("app").innerHTML = `
    <div style="padding:10px;">
      <button class="btn-cancel" onclick="loadTalaba()" style="width:auto;padding:8px 16px;">← Wapas</button>
    </div>
    <div class="card profile-card" id="profileCard">
      <div style="text-align:center;padding:10px 0;">
        <div class="profile-avatar">${s.name.charAt(0).toUpperCase()}</div>
        <h2 style="color:#1a3d2b;margin:8px 0 4px;">${s.name}</h2>
        <p style="color:#666;margin:2px 0;">Walid: ${s.father_name || '-'}</p>
        ${s.phone ? `<p style="color:#666;margin:2px 0;">📞 ${s.phone}</p>` : ''}
        <span class="batch-badge" style="font-size:13px;padding:4px 14px;">${s.batch || '-'}</span>
      </div>
      <div class="profile-stats">
        <div class="pstat" style="border-color:${color}">
          <div class="pstat-num" style="color:${color}">${percent}%</div>
          <div class="pstat-label">Haazri</div>
        </div>
        <div class="pstat" style="border-color:#3498db">
          <div class="pstat-num" style="color:#3498db">${present}/${total}</div>
          <div class="pstat-label">Din</div>
        </div>
        <div class="pstat" style="border-color:#e9c46a">
          <div class="pstat-num" style="color:#e9c46a">${feesPaid}/12</div>
          <div class="pstat-label">Fees</div>
        </div>
      </div>
      <div class="progress-bar" style="margin:10px 0;">
        <div class="progress-fill" style="width:${percent}%;background:${color};min-width:${percent>0?'30px':'0'}">
          ${percent > 0 ? percent + '%' : ''}
        </div>
      </div>
      <h4 style="color:#1a3d2b;margin:15px 0 8px;">💰 Fees ${year}</h4>
      <div class="fee-months-row">${feesHtml}</div>
      <h4 style="color:#1a3d2b;margin:15px 0 8px;">📅 Haazri (Aakhri 10 din)</h4>
      ${attHtml}
    </div>
    <div style="padding:10px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn-share" onclick="shareProfile('${encodeURIComponent(shareText)}')">📤 WhatsApp</button>
      <button class="btn-print" onclick="window.print()">🖨 Print</button>
      <button class="btn-monthly" onclick="loadMonthlyReport(${studentId},'${s.name}')">📊 Monthly</button>
    </div>`;
}

function shareProfile(encodedText) {
  let text = decodeURIComponent(encodedText);
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
}

// ===== MONTHLY REPORT =====
async function loadMonthlyReport(studentId, name) {
  document.getElementById("app").innerHTML = '<div class="loading">⏳ Loading...</div>';
  let { data: att } = await db.from('attendance').select('*').eq('student_id', studentId);
  let year = new Date().getFullYear();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  let html = `
    <div style="padding:10px;">
      <button class="btn-cancel" onclick="loadProfile(${studentId})" style="width:auto;padding:8px 16px;">← Wapas</button>
    </div>
    <div class="date-banner">📊 ${name} - Monthly ${year}</div>`;

  months.forEach((month, i) => {
    let monthAtt = att ? att.filter(a => {
      let d = new Date(a.date);
      return d.getMonth() === i && d.getFullYear() === year;
    }) : [];
    let present = monthAtt.filter(a => a.status === 'present').length;
    let total = monthAtt.length;
    let percent = total > 0 ? Math.round((present / total) * 100) : 0;
    let color = total === 0 ? '#ccc' : percent >= 75 ? '#2ecc71' : percent >= 50 ? '#f39c12' : '#e74c3c';
    html += `
      <div class="card" style="margin:6px 10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div><b>${month}</b><br><small style="color:#888;">${total === 0 ? 'Data nahi' : present + ' haazir, ' + (total-present) + ' ghaib'}</small></div>
          <div style="font-size:20px;font-weight:bold;color:${color}">${total === 0 ? '--' : percent + '%'}</div>
        </div>
        ${total > 0 ? `<div class="progress-bar" style="margin-top:6px;"><div class="progress-fill" style="width:${percent}%;background:${color};min-width:${percent>0?'30px':'0'}">${percent > 0 ? percent+'%' : ''}</div></div>` : ''}
      </div>`;
  });

  html += `<div style="padding:10px;"><button class="btn-share" onclick="shareMonthlyReport(${studentId},'${name}')">📤 WhatsApp Share</button></div>`;
  document.getElementById("app").innerHTML = html;
}

async function shareMonthlyReport(studentId, name) {
  let { data: att } = await db.from('attendance').select('*').eq('student_id', studentId);
  let year = new Date().getFullYear();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let text = `*Maktab Darul Huda Nagothane*\n*Monthly Report ${year}*\n*Talib: ${name}*\n\n`;
  months.forEach((m, i) => {
    let monthAtt = att ? att.filter(a => { let d = new Date(a.date); return d.getMonth()===i && d.getFullYear()===year; }) : [];
    let present = monthAtt.filter(a => a.status === 'present').length;
    let total = monthAtt.length;
    let percent = total > 0 ? Math.round((present/total)*100) : 0;
    text += `${m}: ${total === 0 ? 'Data nahi' : present+'/'+total+' ('+percent+'%)'}\n`;
  });
  text += '\nJazakAllah Khair';
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
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
    html += '<div class="card" style="text-align:center;color:#666;">Koi talib nahi.</div>';
    document.getElementById("app").innerHTML = html;
    return;
  }
  let batches = [...new Set(students.map(s => s.batch).filter(Boolean))];
  batches.forEach(batch => {
    html += `<div class="batch-header">${batch}</div>`;
    students.filter(s => s.batch === batch).forEach(s => {
      let status = attMap[s.id] || '';
      html += `
        <div class="card haazri-card">
          <div class="student-name">${s.name}</div>
          <div class="att-buttons">
            <button class="btn-present ${status==='present'?'active-green':''}" onclick="mark(${s.id},'present',this)">✔ Haazir</button>
            <button class="btn-absent ${status==='absent'?'active-red':''}" onclick="mark(${s.id},'absent',this)">✖ Ghaib</button>
          </div>
        </div>`;
    });
  });
  document.getElementById("app").innerHTML = html;
}

async function mark(studentId, status, btn) {
  let today = new Date().toISOString().slice(0, 10);
  let { data: existing } = await db.from('attendance').select('*').eq('student_id', studentId).eq('date', today);
  if (existing && existing.length > 0) {
    await db.from('attendance').update({ status }).eq('id', existing[0].id);
  } else {
    await db.from('attendance').insert([{ student_id: studentId, date: today, status }]);
  }
  let card = btn.closest('.haazri-card');
  card.querySelectorAll('.btn-present,.btn-absent').forEach(b => b.classList.remove('active-green','active-red'));
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
  if (fees) fees.forEach(f => { if(!feeMap[f.student_id]) feeMap[f.student_id]={}; feeMap[f.student_id][f.month]=f.paid; });
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let html = `<div class="date-banner">💰 Fees ${year}</div>`;
  if (!students || students.length === 0) {
    html += '<div class="card" style="text-align:center;color:#666;">Koi talib nahi.</div>';
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
      monthBtns += `<button class="month-btn ${paid?'paid':'unpaid'}" onclick="toggleFee(${s.id},${month},this)">${m}</button>`;
    });
    html += `
      <div class="card fees-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div><b>${s.name}</b><br><small>${s.batch||''}</small></div>
          <div style="background:#e9f5ee;color:#1a3d2b;padding:4px 10px;border-radius:10px;font-size:13px;">${paidCount}/12 ✅</div>
        </div>
        <div class="months-grid">${monthBtns}</div>
      </div>`;
  });
  document.getElementById("app").innerHTML = html;
}

async function toggleFee(studentId, month, btn) {
  let year = new Date().getFullYear();
  let newStatus = !btn.classList.contains('paid');
  let { data: existing } = await db.from('fees').select('*').eq('student_id', studentId).eq('month', month).eq('year', year);
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
  let html = `<div style="padding:10px;"><button class="btn-primary" onclick="window.print()">🖨 Print</button></div><div class="date-banner">📊 Haazri Report</div>`;
  if (!students || students.length === 0) {
    html += '<div class="card" style="text-align:center;color:#666;">Koi talib nahi.</div>';
    document.getElementById("app").innerHTML = html;
    return;
  }
  students.forEach(s => {
    let studentAtt = att ? att.filter(a => a.student_id === s.id) : [];
    let present = studentAtt.filter(a => a.status === 'present').length;
    let total = studentAtt.length;
    let percent = total > 0 ? Math.round((present/total)*100) : 0;
    let color = percent >= 75 ? '#2ecc71' : percent >= 50 ? '#f39c12' : '#e74c3c';
    html += `
      <div class="card" onclick="loadProfile(${s.id})" style="cursor:pointer;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div><b>${s.name}</b><br><small style="color:#666;">${s.batch||''}</small></div>
          <div style="font-size:22px;font-weight:bold;color:${color}">${percent}%</div>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${percent}%;background:${color};min-width:${percent>0?'30px':'0'}">${percent>0?percent+'%':''}</div></div>
        <small style="color:#888;">Haazir: ${present} | Kul: ${total} din</small>
      </div>`;
  });
  document.getElementById("app").innerHTML = html;
}

// ===== PWA =====
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("installBtn").style.display = "block";
});
document.getElementById("installBtn").onclick = async () => { if (deferredPrompt) deferredPrompt.prompt(); };
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(() => {}); }

loadDashboard();
