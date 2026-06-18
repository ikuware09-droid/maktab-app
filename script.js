// ===== HOME GRID =====
function loadHome() {
  document.getElementById("app").innerHTML = chuttiBanner() + `
    <div class="home-grid">
      <div class="tile tile-green" onclick="loadDashboard()">
        <div class="tile-icon">📊</div>
        <div class="tile-label">ڈیش بورڈ</div>
      </div>
      <div class="tile tile-blue" onclick="loadTalaba()">
        <div class="tile-icon">👦</div>
        <div class="tile-label">طلبہ</div>
      </div>
      <div class="tile tile-orange" onclick="loadHaazri()">
        <div class="tile-icon">✅</div>
        <div class="tile-label">حاضری</div>
      </div>
      <div class="tile tile-gold" onclick="loadFees()">
        <div class="tile-icon">💰</div>
        <div class="tile-label">فیس</div>
      </div>
      <div class="tile tile-purple" onclick="loadReport()">
        <div class="tile-icon">📋</div>
        <div class="tile-label">نتائج</div>
      </div>
      <div class="tile tile-teal" onclick="loadDateHaazri()">
        <div class="tile-icon">📅</div>
        <div class="tile-label">پرانی حاضری</div>
      </div>
    </div>
  `;
}

// ===== SUPABASE CONFIG =====
const SUPABASE_URL = 'https://ajpeeftziwwmnlzekxbr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcGVlZnR6aXd3bW5semVreGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMDQzMjMsImV4cCI6MjA5MjU4MDMyM30.T5QoLwrqSUViCg73nT1lDjpmKisV50dFcQd9Yi5cvuw';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);


// ===== CHUTTI CHECK =====
function isChutti() {
  let today = new Date();
  let month = today.getMonth() + 1; // 1-12
  let day = today.getDate();
  // 1 May to 15 June
  if (month === 5) return true; // Pura May
  if (month === 6 && day <= 14) return true; // June 1-14
  return false;
}

function chuttiBanner() {
  if (!isChutti()) return '';
  return `
    <div style="background:linear-gradient(135deg,#e9c46a,#f4d03f);color:#1a3d2b;padding:14px 15px;margin:10px 15px;border-radius:14px;text-align:center;box-shadow:0 3px 10px rgba(233,196,106,0.4);">
      <div style="font-size:28px;">🌙</div>
      <div style="font-weight:bold;font-size:15px;margin:5px 0;">مکتب میں چھٹیاں جاری ہیں</div>
      <div style="font-size:12px;color:#555;">1 مئی تا 14 جون 2026</div>
    </div>`;
}

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

  // Batch wise breakdown
  let batches = students ? [...new Set(students.map(s => s.batch).filter(Boolean))] : [];
  let batchHtml = '';
  batches.forEach(batch => {
    let batchStudents = students.filter(s => s.batch === batch);
    let batchIds = batchStudents.map(s => s.id);
    let batchAtt = att ? att.filter(a => batchIds.includes(a.student_id)) : [];
    let bPresent = batchAtt.filter(a => a.status === 'present').length;
    let bTotal = batchStudents.length;
    let bAbsent = bTotal - bPresent;
    let bPercent = bTotal > 0 ? Math.round((bPresent / bTotal) * 100) : 0;
    let color = bPercent >= 75 ? '#2ecc71' : bPercent >= 50 ? '#f39c12' : '#e74c3c';
    let bLadke = batchStudents.filter(s => s.gender === 'Ladka' || !s.gender).length;
    let bLadkiyan = batchStudents.filter(s => s.gender === 'Ladki').length;
    batchHtml += `
      <div class="card batch-stat-card">
        <div class="batch-stat-title">${batch}</div>
        <div class="batch-stat-row">
          <span class="batch-total">👥 Kul: ${bTotal}</span>
          <span style="color:#1565c0;">👦 Ladke: ${bLadke}</span>
          <span style="color:#c2185b;">👧 Ladkiyan: ${bLadkiyan}</span>
        </div>
        <div class="batch-stat-row" style="margin-top:6px;">
          <span class="batch-present">✅ Haazir: ${bPresent}</span>
          <span class="batch-absent">❌ Ghaib: ${bAbsent}</span>
        </div>
        <div class="progress-bar" style="margin-top:8px;">
          <div class="progress-fill" style="width:${bPercent}%;background:${color};min-width:${bPercent>0?'30px':'0'}">${bPercent > 0 ? bPercent+'%' : ''}</div>
        </div>
        <small style="color:#888;">${bPercent}% haazri aaj</small>
      </div>`;
  });

  document.getElementById("app").innerHTML = `
    <div class="grid">
      <div class="card stat-card"><div class="stat-icon">👦</div><div class="stat-num">${total}</div><div class="stat-label">Kul Talaba</div></div>
      <div class="card stat-card green-card"><div class="stat-icon">✅</div><div class="stat-num">${present}</div><div class="stat-label">Aaj Haazir</div></div>
      <div class="card stat-card red-card"><div class="stat-icon">❌</div><div class="stat-num">${absent}</div><div class="stat-label">Aaj Ghaib</div></div>
      <div class="card stat-card blue-card"><div class="stat-icon">📊</div><div class="stat-num">${percent}%</div><div class="stat-label">Haazri %</div></div>
    </div>
    ${chuttiBanner()}
    <div class="date-banner">📅 ${today} - Batch Report</div>
    ${batchHtml}
    <div class="card" style="text-align:center; margin:10px;">
      <p style="color:#1a3d2b; font-weight:bold; font-size:18px;">بسم الله الرحمن الرحيم</p>
      <p style="color:#555; font-size:13px;">Maktab Darul Huda Nagothane</p>
    </div>`;
}

// ===== TALABA =====
async function loadTalaba() {
  document.getElementById("app").innerHTML = '<div class="loading">⏳ Loading...</div>';
  let { data: students } = await db.from('students').select('*').order('name');
  
  // Batch counts
  let batches = ['Pehli (7-8 AM)', 'Doosri (2-3 PM)', 'Teesri (Maghrib-Isha)'];
  let batchCounts = '';
  batches.forEach(b => {
    let count = students ? students.filter(s => s.batch === b).length : 0;
    let icon = b.includes('Pehli') ? '🌅' : b.includes('Doosri') ? '☀️' : '🌙';
    batchCounts += `<div style="background:#e9f5ee;border-radius:10px;padding:8px 12px;text-align:center;flex:1;">
      <div style="font-size:18px;">${icon}</div>
      <div style="font-weight:bold;color:#1a3d2b;font-size:16px;">${count}</div>
      <div style="font-size:10px;color:#666;">${b.split(' ')[0]}</div>
    </div>`;
  });

  let html = `
    <div style="padding:10px;">
      <div style="display:flex;gap:8px;margin-bottom:10px;">${batchCounts}</div>
      <input type="text" id="searchBar" class="input-field" placeholder="🔍 Naam search karo..." oninput="filterStudents()" style="margin-bottom:8px;">
      <button class="btn-primary" onclick="showAddStudentForm()">+ Talib Add Karo</button>
    </div>
    <div id="formArea"></div>
    <div id="studentsList">`;
  if (students && students.length > 0) {
    students.forEach(s => {
      html += `
        <div class="card student-item" data-name="${s.name.toLowerCase()}" style="margin:8px 10px;padding:14px;">
          <div class="student-card" onclick="loadProfile(${s.id})" style="cursor:pointer;">
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
          </div>
          <div style="margin-top:10px;display:flex;gap:8px;align-items:center;" onclick="event.stopPropagation()">
            <select onchange="quickBatchChange(${s.id}, this.value, this)" class="input-field" style="margin:0;flex:1;font-size:12px;padding:7px 10px;">
              <option value="">🔄 Batch Badlo</option>
              <option value="Pehli (7-8 AM)" ${s.batch==='Pehli (7-8 AM)'?'selected':''}>🌅 Pehli (7-8 AM)</option>
              <option value="Doosri (2-3 PM)" ${s.batch==='Doosri (2-3 PM)'?'selected':''}>☀️ Doosri (2-3 PM)</option>
              <option value="Teesri (Maghrib-Isha)" ${s.batch==='Teesri (Maghrib-Isha)'?'selected':''}>🌙 Teesri (Maghrib-Isha)</option>
            </select>
            <button id="gbtn-${s.id}" onclick="event.stopPropagation();toggleGender(${s.id},this)" style="padding:7px 12px;border-radius:8px;border:2px solid ${s.gender==='Ladki'?'#c2185b':'#1565c0'};background:${s.gender==='Ladki'?'#fce4ec':'#e3f2fd'};font-size:16px;cursor:pointer;white-space:nowrap;">${s.gender==='Ladki'?'👧 Ladki':'👦 Ladka'}</button>
          </div>
        </div>`;
    });
  } else {
    html += '<div class="card" style="text-align:center;color:#666;padding:30px;">Koi talib nahi.<br>Upar + button se add karo.</div>';
  }
  html += '</div>';
  document.getElementById("app").innerHTML = html;
}

async function toggleGender(id, btn) {
  let isLadki = btn.innerText.includes('Ladki');
  let newGender = isLadki ? 'Ladka' : 'Ladki';
  let { error } = await db.from('students').update({ gender: newGender }).eq('id', id);
  if (error) { showToast("Error: " + error.message); return; }
  if (newGender === 'Ladki') {
    btn.innerText = '👧 Ladki';
    btn.style.border = '2px solid #c2185b';
    btn.style.background = '#fce4ec';
  } else {
    btn.innerText = '👦 Ladka';
    btn.style.border = '2px solid #1565c0';
    btn.style.background = '#e3f2fd';
  }
  showToast("✅ " + newGender + " set ho gaya!");
}


function filterStudents() {
  let query = document.getElementById('searchBar').value.toLowerCase();
  let items = document.querySelectorAll('.student-item');
  items.forEach(item => {
    let name = item.getAttribute('data-name') || '';
    item.style.display = name.includes(query) ? 'block' : 'none';
  });
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
      <select id="sGender" class="input-field">
        <option value="Ladka">👦 Ladka</option>
        <option value="Ladki">👧 Ladki</option>
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
  let gender = document.getElementById("sGender").value || "Ladka";
  if (!name) { showToast("⚠ Naam zaruri hai!"); return; }
  if (!batch) { showToast("⚠ Batch select karo!"); return; }
  let { data: allStudents } = await db.from('students').select('name');
  if (allStudents) {
    let duplicate = allStudents.find(s => s.name.trim().toLowerCase() === name.toLowerCase());
    if (duplicate) { showToast("⚠ Yeh naam pehle se mojood hai!"); return; }
  }
  let { error } = await db.from('students').insert([{ name, father_name, phone, batch, gender }]);
  if (error) { showToast("Error: " + error.message); return; }
  showToast("✅ Talib add ho gaya!");
  loadTalaba();
}

async function deleteStudentFromHaazri(id, name) {
  if (!confirm(name + " ko delete karna chahte ho?")) return;
  await db.from('attendance').delete().eq('student_id', id);
  await db.from('fees').delete().eq('student_id', id);
  await db.from('students').delete().eq('id', id);
  showToast("🗑 " + name + " delete ho gaya");
  let card = document.getElementById('hcard-' + id);
  if (card) card.remove();
  updateHaazriCounter();
}

async function quickBatchChange(studentId, newBatch, select) {
  if (!newBatch) return;
  let { error } = await db.from('students').update({ batch: newBatch }).eq('id', studentId);
  if (error) { showToast("Error: " + error.message); return; }
  showToast("✅ Batch change ho gaya!");
  // Update badge in same card
  let card = select.closest('.card');
  let badge = card.querySelector('.batch-badge');
  if (badge) badge.innerText = newBatch;
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
    </div>
    <div style="padding:0 10px 15px;">
      <button class="btn-batch-change" onclick="showBatchChange(${studentId},'${s.batch}')">🔄 Batch Badlo</button>
    </div>
    <div id="batchChangeArea"></div>`;
}

function showBatchChange(studentId, currentBatch) {
  document.getElementById('batchChangeArea').innerHTML = `
    <div class="card" style="margin:0 10px 15px;">
      <h4 style="color:#1a3d2b;margin-bottom:10px;">Batch Change Karo</h4>
      <p style="color:#888;font-size:12px;margin-bottom:8px;">Abhi: ${currentBatch}</p>
      <select id="newBatch" class="input-field">
        <option value="">Naya batch select karo</option>
        <option value="Pehli (7-8 AM)">Pehli (7-8 AM)</option>
        <option value="Doosri (2-3 PM)">Doosri (2-3 PM)</option>
        <option value="Teesri (Maghrib-Isha)">Teesri (Maghrib-Isha)</option>
      </select>
      <button class="btn-primary" style="margin-top:8px;" onclick="saveBatchChange(${studentId})">✅ Save Karo</button>
      <button class="btn-cancel" onclick="document.getElementById('batchChangeArea').innerHTML=''">Cancel</button>
    </div>`;
}

async function saveBatchChange(studentId) {
  let newBatch = document.getElementById('newBatch').value;
  if (!newBatch) { showToast("⚠ Batch select karo!"); return; }
  let { error } = await db.from('students').update({ batch: newBatch }).eq('id', studentId);
  if (error) { showToast("Error: " + error.message); return; }
  showToast("✅ Batch change ho gaya!");
  loadProfile(studentId);
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
      return d.getMonth() === i && d.getFullYear() === year && d.getDay() !== 0; // Sunday exclude
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
function loadHaazri() {
  let today = new Date().toISOString().slice(0, 10);
  if (isChutti()) {
    document.getElementById("app").innerHTML = `
      <div class="date-banner">📅 ${today}</div>
      <div class="card" style="text-align:center;padding:40px 20px;">
        <div style="font-size:50px;">🌙</div>
        <h2 style="color:#1a3d2b;margin:10px 0;">مکتب میں چھٹیاں ہیں</h2>
        <p style="color:#888;">1 مئی تا 14 جون 2026</p>
      </div>`;
    return;
  }
  if (new Date().getDay() === 0) {
    document.getElementById("app").innerHTML = `
      <div class="date-banner">📅 ${today}</div>
      <div class="card" style="text-align:center;padding:40px 20px;">
        <div style="font-size:50px;">🕌</div>
        <h2 style="color:#1a3d2b;margin:10px 0;">Aaj Chutti Hai</h2>
        <p style="color:#888;">Sunday ko Maktab band rehta hai.</p>
      </div>`;
    return;
  }
  document.getElementById("app").innerHTML = `
    <div class="date-banner">📅 ${today} - Batch Select Karo</div>
    <div style="padding:10px;">
      <div class="tile tile-orange" style="margin:8px 0;" onclick="loadBatchHaazri('Pehli (7-8 AM)')">
        <div class="tile-icon">🌅</div>
        <div class="tile-label" style="font-size:14px;">پہلی بیچ (7-8 AM)</div>
      </div>
      <div class="tile tile-blue" style="margin:8px 0;" onclick="loadBatchHaazri('Doosri (2-3 PM)')">
        <div class="tile-icon">☀️</div>
        <div class="tile-label" style="font-size:14px;">دوسری بیچ (2-3 PM)</div>
      </div>
      <div class="tile tile-purple" style="margin:8px 0;" onclick="loadBatchHaazri('Teesri (Maghrib-Isha)')">
        <div class="tile-icon">🌙</div>
        <div class="tile-label" style="font-size:14px;">تیسری بیچ (مغرب-عشاء)</div>
      </div>
    </div>`;
}

async function loadBatchHaazri(batch) {
  document.getElementById("app").innerHTML = '<div class="loading">⏳ Loading...</div>';
  let { data: students } = await db.from('students').select('*').eq('batch', batch).order('name');
  let today = new Date().toISOString().slice(0, 10);
  let { data: todayAtt } = await db.from('attendance').select('*').eq('date', today);
  let attMap = {};
  if (todayAtt) todayAtt.forEach(a => attMap[a.student_id] = a.status);
  let presentCount = 0, absentCount = 0;
  let ladkeCount = 0, ladkiyanCount = 0;
  students.forEach(s => {
    if (attMap[s.id] === 'present') presentCount++;
    else if (attMap[s.id] === 'absent') absentCount++;
    if (s.gender === 'Ladki') ladkiyanCount++;
    else ladkeCount++;
  });
  let html = `
    <div style="padding:10px;">
      <button class="btn-cancel" onclick="loadHaazri()" style="width:auto;padding:8px 16px;">← Wapas</button>
    </div>
    <div class="date-banner">📅 ${today} - ${batch}</div>
    <div id="haazri-counter" style="position:sticky;top:0;z-index:10;background:#fff8e1;border:2px solid #ffc107;border-radius:10px;margin:8px 10px;padding:10px;text-align:center;font-weight:bold;font-size:13px;">
      ✅ Haazir: ${presentCount} &nbsp;|&nbsp; ❌ Ghaib: ${absentCount} &nbsp;|&nbsp; 👥 Total: ${students.length}<br>
      <span style="color:#1565c0;">👦 Ladke: ${ladkeCount}</span> &nbsp;|&nbsp; <span style="color:#c2185b;">👧 Ladkiyan: ${ladkiyanCount}</span>
    </div>`;
  if (!students || students.length === 0) {
    html += '<div class="card" style="text-align:center;color:#666;padding:30px;">Is batch mein koi talib nahi.</div>';
    document.getElementById("app").innerHTML = html;
    return;
  }
  students.forEach(s => {
    let status = attMap[s.id] || '';
    html += `
      <div class="card" id="hcard-${s.id}" style="margin:5px 10px;padding:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <div class="student-name">${s.name}</div>
          <div style="display:flex;gap:6px;align-items:center;">
            <div class="att-buttons">
              <button class="btn-present ${status==='present'?'active-green':''}" onclick="mark(${s.id},'present',this)">✔ Haazir</button>
              <button class="btn-absent ${status==='absent'?'active-red':''}" onclick="mark(${s.id},'absent',this)">✖ Ghaib</button>
            </div>
            <button class="btn-delete" onclick="deleteStudentFromHaazri(${s.id},'${s.name}')" style="padding:6px 10px;font-size:14px;">🗑</button>
          </div>
        </div>
        <select onchange="quickBatchChange(${s.id}, this.value, this)" class="input-field" style="margin-top:7px;font-size:11px;padding:5px 8px;color:#888;">
          <option value="">🔄 Batch Badlo</option>
          <option value="Pehli (7-8 AM)" ${s.batch==='Pehli (7-8 AM)'?'selected':''}>🌅 Pehli (7-8 AM)</option>
          <option value="Doosri (2-3 PM)" ${s.batch==='Doosri (2-3 PM)'?'selected':''}>☀️ Doosri (2-3 PM)</option>
          <option value="Teesri (Maghrib-Isha)" ${s.batch==='Teesri (Maghrib-Isha)'?'selected':''}>🌙 Teesri (Maghrib-Isha)</option>
        </select>
      </div>`;
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
  let card = btn.closest('.card');
  card.querySelectorAll('.btn-present,.btn-absent').forEach(b => b.classList.remove('active-green','active-red'));
  btn.classList.add(status === 'present' ? 'active-green' : 'active-red');
  showToast(status === 'present' ? "✅ Haazir" : "❌ Ghaib");
  updateHaazriCounter();
}

function updateHaazriCounter() {
  let counterEl = document.getElementById('haazri-counter');
  if (!counterEl) return;
  let presentCount = document.querySelectorAll('.btn-present.active-green').length;
  let absentCount = document.querySelectorAll('.btn-absent.active-red').length;
  let totalCount = document.querySelectorAll('[id^="hcard-"]').length;
  counterEl.innerHTML = `✅ Haazir: ${presentCount} &nbsp;|&nbsp; ❌ Ghaib: ${absentCount} &nbsp;|&nbsp; 👥 Total: ${totalCount}`;
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
    let studentAtt = att ? att.filter(a => {
      let d = new Date(a.date);
      return a.student_id === s.id && d.getDay() !== 0; // Sunday exclude
    }) : [];
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

// ===== DATE WISE HAAZRI =====
async function loadDateHaazri() {
  let today = new Date().toISOString().slice(0, 10);
  document.getElementById("app").innerHTML = `
    <div style="padding:10px;">
      <div class="date-banner" style="margin:0 0 10px;">📅 Kisi Bhi Din Ki Haazri Dekho</div>
      <input type="date" id="dateInput" class="input-field" value="${today}" max="${today}">
      <button class="btn-primary" style="margin-top:8px;" onclick="showDateHaazri()">🔍 Haazri Dekho</button>
    </div>
    <div id="dateHaazriResult"></div>`;
}

async function showDateHaazri() {
  let date = document.getElementById('dateInput').value;
  if (!date) { showToast("⚠ Date select karo!"); return; }
  
  document.getElementById("dateHaazriResult").innerHTML = '<div class="loading">⏳ Loading...</div>';
  
  let { data: students } = await db.from('students').select('*').order('batch').order('name');
  let { data: att } = await db.from('attendance').select('*').eq('date', date);
  
  let attMap = {};
  if (att) att.forEach(a => attMap[a.student_id] = a.status);
  
  let total = students ? students.length : 0;
  let present = att ? att.filter(a => a.status === 'present').length : 0;
  let absent = total - present;
  
  let html = `
    <div class="card" style="margin:8px 10px;background:#1a3d2b;color:white;text-align:center;">
      <b style="font-size:15px;">📅 ${date}</b><br>
      <span style="color:#2ecc71;">✅ Haazir: ${present}</span> &nbsp;
      <span style="color:#e74c3c;">❌ Ghaib: ${absent}</span> &nbsp;
      <span style="color:#e9c46a;">👦 Kul: ${total}</span>
    </div>`;
  
  let batches = [...new Set(students.map(s => s.batch).filter(Boolean))];
  batches.forEach(batch => {
    html += `<div class="batch-header">${batch}</div>`;
    students.filter(s => s.batch === batch).forEach(s => {
      let status = attMap[s.id];
      let icon = status === 'present' ? '✅' : status === 'absent' ? '❌' : '➖';
      let color = status === 'present' ? '#e9f7ef' : status === 'absent' ? '#fdedec' : '#f9f9f9';
      let text = status === 'present' ? 'Haazir' : status === 'absent' ? 'Ghaib' : 'Recorded nahi';
      html += `
        <div class="card" style="margin:5px 10px;padding:12px;background:${color};display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:500;">${s.name}</span>
          <span style="font-weight:bold;">${icon} ${text}</span>
        </div>`;
    });
  });
  
  document.getElementById("dateHaazriResult").innerHTML = html;
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

loadHome();
