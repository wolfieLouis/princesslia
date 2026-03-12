// ═══════════════════════════════
// SUPABASE CONFIG
// ═══════════════════════════════
const SUPA_URL = 'https://cwaxgvtzewmooskayczd.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YXhndnR6ZXdtb29za2F5Y3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNzAyNjIsImV4cCI6MjA4ODg0NjI2Mn0.w_aXkSmd_c2TKVsocmVY3UNvw2y8Jeiglrypv9UF7JU';
const supa = supabase.createClient(SUPA_URL, SUPA_KEY);

// ═══════════════════════════════
// PWA INSTALL
// ═══════════════════════════════
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredPrompt = e;
  document.getElementById('install-btn').style.display = 'block';
});
window.addEventListener('appinstalled', () => {
  document.getElementById('install-btn').style.display = 'none';
  deferredPrompt = null;
});
document.getElementById('install-btn').onclick = () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    document.getElementById('install-btn').style.display = 'none';
    deferredPrompt = null;
  });
};
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

// ═══════════════════════════════
// HELPERS UI
// ═══════════════════════════════
function x(s) { return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function tod() { return new Date().toLocaleDateString('es-ES'); }
function uid() { return Date.now() + Math.floor(Math.random()*99999); }

function setSync(msg, type) {
  const b = document.getElementById('sync-bar');
  b.textContent = msg;
  b.className = 'sync' + (type ? ' ' + type : '');
  if (msg) setTimeout(() => { if (b.textContent === msg) b.textContent = ''; }, 3000);
}

function showModal(html) {
  const l = document.getElementById('modal-layer');
  l.innerHTML = '<div class="box">' + html + '</div>';
  l.className = 'overlay on';
  l.onclick = e => { if (e.target === l) closeModal(); };
}
function closeModal() {
  const l = document.getElementById('modal-layer');
  l.className = 'overlay'; l.innerHTML = '';
}

// ═══════════════════════════════
// SUPABASE CRUD
// ═══════════════════════════════
async function sbGet(table, orderCol) {
  const q = supa.from(table).select('*');
  if (orderCol) q.order(orderCol, { ascending: false });
  const { data, error } = await q;
  if (error) { setSync('❌ Error al cargar: ' + error.message, 'err'); return []; }
  return data || [];
}
async function sbInsert(table, obj) {
  setSync('⏳ Guardando...');
  const { error } = await supa.from(table).insert(obj);
  if (error) { setSync('❌ ' + error.message, 'err'); return false; }
  setSync('✅ Guardado', 'ok'); return true;
}
async function sbUpdate(table, id, obj) {
  setSync('⏳ Actualizando...');
  const { error } = await supa.from(table).update(obj).eq('id', id);
  if (error) { setSync('❌ ' + error.message, 'err'); return false; }
  setSync('✅ Actualizado', 'ok'); return true;
}
async function sbDelete(table, id) {
  const { error } = await supa.from(table).delete().eq('id', id);
  if (error) { setSync('❌ Error al eliminar', 'err'); return false; }
  setSync('🗑️ Eliminado', 'ok'); return true;
}
async function sbGetCfg(key, fallback) {
  try {
    const { data } = await supa.from('config').select('value').eq('key', key).single();
    return data ? data.value : fallback;
  } catch { return fallback; }
}
async function sbSetCfg(key, value) {
  await supa.from('config').upsert({ key, value }, { onConflict: 'key' });
}

// ═══════════════════════════════
// NAV
// ═══════════════════════════════
const RENDERS = { dev:renderDev, agenda:renderAgenda, verses:renderVerses,
  notas:renderNotas, metas:renderMetas, diario:renderDiario, gym:renderGym };

document.getElementById('nav').addEventListener('click', e => {
  const t = e.target.closest('.tab'); if (!t) return;
  const pg = t.getAttribute('data-pg'); if (!pg) return;
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  t.classList.add('on');
  document.getElementById('pg-' + pg).classList.add('on');
  RENDERS[pg]();
});

// ═══════════════════════════════
// VERSÍCULOS DEL DÍA
// ═══════════════════════════════
const DV = [
  {ref:'Filipenses 4:13', text:'Todo lo puedo en Cristo que me fortalece.'},
  {ref:'Salmos 23:1',     text:'El Señor es mi pastor; nada me faltará.'},
  {ref:'Proverbios 3:5',  text:'Fíate de Jehová de todo tu corazón.'},
  {ref:'Jeremías 29:11',  text:'Yo sé los planes que tengo para vosotros.'},
  {ref:'Isaías 40:31',    text:'Los que esperan en el Señor renovarán sus fuerzas.'},
  {ref:'Hebreos 11:1',    text:'La fe es la certeza de lo que se espera.'},
  {ref:'Mateo 6:33',      text:'Busca primero el reino de Dios y su justicia.'},
  {ref:'Salmos 46:1',     text:'Dios es nuestro amparo y fortaleza.'},
  {ref:'Juan 13:34',      text:'Ámense los unos a los otros como yo los he amado.'},
  {ref:'Romanos 12:2',    text:'No se amolden al mundo sino transfórmense.'},
  {ref:'Proverbios 31:25',text:'Se reviste de fuerza y dignidad, y afronta segura el porvenir.'},
  {ref:'Deuteronomio 31:6',text:'Sed fuertes y valientes. No temáis ni os aterréis.'}
];
function gdv() { const d = new Date(); return DV[(d.getDate()+d.getMonth()) % DV.length]; }

// ═══════════════════════════════
// DEVOCIONAL
// ═══════════════════════════════
let pCatF = 'Todas';

async function renderDev() {
  const v = gdv();
  document.getElementById('hv').textContent = '"' + v.text.slice(0,45) + '..."';
  const pg = document.getElementById('pg-dev');
  pg.innerHTML = '<div class="muted" style="text-align:center;padding:20px">⏳ Cargando...</div>';

  const [reflections, prayers, pcats] = await Promise.all([
    sbGet('reflections', 'created_at'),
    sbGet('prayers', 'created_at'),
    sbGetCfg('pcats', ['Familia','Estudios','Salud','Iglesia','Personal','Amigos','Gratitud'])
  ]);

  const refCards = reflections.map(r =>
    '<div class="card refl-card">'
    + '<div class="row" style="justify-content:space-between;margin-bottom:6px">'
    + '<div style="color:#ffd700;font-size:10px">✦ ' + x(r.date) + '</div>'
    + '<div class="row">'
    + '<button class="edit-r btn btns" data-id="' + r.id + '">✏️</button>'
    + '<button class="del-r btn btns btnd" data-id="' + r.id + '">×</button>'
    + '</div></div>'
    + '<div class="refl-verse">"' + x(r.verse) + '"</div>'
    + '<div class="refl-text">' + x(r.text) + '</div>'
    + '</div>'
  ).join('');

  const filtered = pCatF === 'Todas' ? prayers : prayers.filter(p => p.cat === pCatF);

  pg.innerHTML =
    '<div class="vod">'
    + '<div class="vod-label">✦ VERSÍCULO DEL DÍA ✦</div>'
    + '<div class="vod-text">"' + x(v.text) + '"</div>'
    + '<div class="vod-ref">— ' + x(v.ref) + '</div></div>'
    + '<div class="card">'
    + '<div class="muted" style="margin-bottom:8px">✍️ ¿QUÉ TE HABLÓ DIOS HOY?</div>'
    + '<textarea id="refl-ta" class="inp" rows="4" placeholder="Escribe tu reflexión..." style="resize:none;line-height:1.7"></textarea>'
    + '<div style="margin-top:8px"><button id="refl-btn" class="btn btnp btns">💾 Guardar reflexión</button></div></div>'
    + (refCards ? '<div class="muted" style="margin-bottom:8px">📖 MIS REFLEXIONES</div>' + refCards : '')
    + '<div class="card">'
    + '<div class="row" style="justify-content:space-between;margin-bottom:8px">'
    + '<div class="muted">🙏 PETICIONES DE ORACIÓN</div>'
    + '<button id="btn-new-p" class="btn btnp btns">+ Nueva</button></div>'
    + '<div id="pcats-f" style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px"></div>'
    + '<div id="prayer-list"></div></div>';

  document.getElementById('refl-btn').onclick = async () => {
    const t = document.getElementById('refl-ta').value.trim(); if (!t) return;
    const ok = await sbInsert('reflections', {
      verse: v.ref + ' — ' + v.text, text: t, date: new Date().toLocaleString('es-ES')
    });
    if (ok) renderDev();
  };
  document.getElementById('btn-new-p').onclick = () => openPrayerModal(null, pcats);

  document.querySelectorAll('.del-r').forEach(b => b.onclick = async () => {
    if (!confirm('¿Eliminar reflexión?')) return;
    if (await sbDelete('reflections', b.dataset.id)) renderDev();
  });
  document.querySelectorAll('.edit-r').forEach(b => b.onclick = () => {
    const r = reflections.find(rr => rr.id == b.dataset.id); if (!r) return;
    showModal('<h3>✍️ Editar reflexión</h3>'
      + '<div class="refl-verse" style="margin-bottom:8px">"' + x(r.verse) + '"</div>'
      + '<textarea id="m-refl" class="inp" rows="5" style="resize:none;margin-bottom:12px">' + x(r.text) + '</textarea>'
      + '<div class="row"><button id="m-rsave" class="btn btnp">Guardar</button>'
      + '<button id="m-rcancel" class="btn">Cancelar</button></div>');
    document.getElementById('m-rsave').onclick = async () => {
      const t = document.getElementById('m-refl').value.trim(); if (!t) return;
      if (await sbUpdate('reflections', r.id, { text: t })) { closeModal(); renderDev(); }
    };
    document.getElementById('m-rcancel').onclick = closeModal;
  });

  renderPrayers(filtered, pcats);
}

function renderPrayers(items, pcats) {
  const pf = document.getElementById('pcats-f'); if (!pf) return;
  pf.innerHTML = '';
  ['Todas', ...pcats].forEach(c => {
    const b = document.createElement('button');
    b.className = 'btn btns'; b.textContent = c;
    b.style.background = pCatF === c ? '#e91e8c' : '#1a0018';
    b.style.color = pCatF === c ? '#fff' : '#a06090';
    b.onclick = () => { pCatF = c; renderDev(); };
    pf.appendChild(b);
  });
  const list = document.getElementById('prayer-list'); if (!list) return;
  if (!items.length) { list.innerHTML = '<div class="muted" style="text-align:center;padding:14px">Sin peticiones aún 🙏</div>'; return; }
  list.innerHTML = '';
  items.forEach(p => {
    const d = document.createElement('div');
    d.className = 'prayer-item ' + (p.done ? 'done' : 'pending');
    d.innerHTML =
      '<button class="tog-p tog-circle" data-id="' + p.id + '" style="border:2px solid ' + (p.done?'#ffd700':'#e91e8c') + ';color:' + (p.done?'#ffd700':'transparent') + '">' + (p.done?'✓':'') + '</button>'
      + '<div style="flex:1"><div style="font-size:13px;text-decoration:' + (p.done?'line-through':'none') + ';color:' + (p.done?'#a06090':'#fce4ff') + '">' + x(p.text) + '</div>'
      + '<div style="font-size:10px;color:#e91e8c">' + x(p.cat) + ' · ' + x(p.date) + '</div></div>'
      + '<button class="edit-p" data-id="' + p.id + '" style="background:none;border:none;color:#a06090;cursor:pointer">✏️</button>'
      + '<button class="del-p" data-id="' + p.id + '" style="background:none;border:none;color:#c00;cursor:pointer;font-size:18px">×</button>';
    list.appendChild(d);
  });
  list.querySelectorAll('.tog-p').forEach(b => b.onclick = async () => {
    const p = items.find(pp => pp.id == b.dataset.id);
    if (await sbUpdate('prayers', b.dataset.id, { done: !p.done })) renderDev();
  });
  list.querySelectorAll('.edit-p').forEach(b => b.onclick = async () => {
    const pcats2 = await sbGetCfg('pcats', ['Familia','Estudios','Salud','Iglesia','Personal']);
    openPrayerModal(items.find(p => p.id == b.dataset.id), pcats2);
  });
  list.querySelectorAll('.del-p').forEach(b => b.onclick = async () => {
    if (!confirm('¿Eliminar?')) return;
    if (await sbDelete('prayers', b.dataset.id)) renderDev();
  });
}

async function openPrayerModal(p, pcats) {
  if (!pcats) pcats = await sbGetCfg('pcats', ['Familia','Estudios','Salud','Iglesia','Personal']);
  const opts = pcats.map(c => '<option' + (p&&p.cat===c?' selected':'') + '>' + x(c) + '</option>').join('');
  showModal('<h3>' + (p?'Editar':'Nueva') + ' petición</h3>'
    + '<input id="m-pt" class="inp" value="' + x(p?p.text:'') + '" placeholder="Petición..." style="margin-bottom:8px"/>'
    + '<select id="m-pc" class="inp" style="margin-bottom:12px">' + opts + '</select>'
    + '<div class="row"><button id="m-psave" class="btn btnp">Guardar</button>'
    + '<button id="m-pcancel" class="btn">Cancelar</button></div>');
  document.getElementById('m-psave').onclick = async () => {
    const t = document.getElementById('m-pt').value.trim(); if (!t) return;
    const c = document.getElementById('m-pc').value;
    let ok;
    if (p) ok = await sbUpdate('prayers', p.id, { text:t, cat:c });
    else ok = await sbInsert('prayers', { text:t, cat:c, done:false, date:tod() });
    if (ok) { closeModal(); renderDev(); }
  };
  document.getElementById('m-pcancel').onclick = closeModal;
}

// Arrancar
renderDev();
// ═══════════════════════════════
// AGENDA
// ═══════════════════════════════
const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
let selDay = new Date().getDay();

async function renderAgenda() {
  const [events, materias] = await Promise.all([
    sbGet('events', 'created_at'),
    sbGetCfg('materias', [
      {name:'Base de Datos I',color:'#4f8ef7'},
      {name:'Estructura de Datos II',color:'#3ecf8e'},
      {name:'Programación',color:'#f7c94f'},
      {name:'Inglés',color:'#f76f6f'},
      {name:'Matemáticas',color:'#a78bfa'},
      {name:'Iglesia',color:'#ffd700'},
      {name:'Personal',color:'#ff6ec7'},
      {name:'General',color:'#a06090'}
    ])
  ]);

  const dayBar = DIAS.map((d,i) => {
    const has = events.some(e => e.day === i);
    const active = selDay === i;
    return '<button class="day-btn" data-d="' + i + '" style="background:' + (active?'#e91e8c':'#1a0018')
      + ';color:' + (active?'#fff':'#a06090') + ';border-color:' + (active?'#e91e8c':'#3d0035') + '">'
      + d + (has ? '<span class="day-dot"></span>' : '') + '</button>';
  }).join('');

  const pg = document.getElementById('pg-agenda');
  pg.innerHTML = '<div class="day-bar">' + dayBar + '</div>'
    + '<div class="row" style="justify-content:space-between;margin-bottom:10px">'
    + '<div class="muted">📅 ' + DIAS[selDay] + '</div>'
    + '<div class="row">'
    + '<button id="btn-new-ev" class="btn btnp btns">+ Evento</button>'
    + '<button id="btn-mat-mgr" class="btn btns">⚙️ Materias</button>'
    + '</div></div>'
    + '<div id="ev-list"></div>';

  pg.querySelectorAll('.day-btn').forEach(b => b.onclick = () => { selDay = Number(b.dataset.d); renderAgenda(); });
  document.getElementById('btn-new-ev').onclick = () => openEvModal(null, events, materias);
  document.getElementById('btn-mat-mgr').onclick = () => openMatModal(materias);

  const evList = document.getElementById('ev-list');
  const dayEvs = events.filter(e => e.day === selDay).sort((a,b) => (a.hora||'').localeCompare(b.hora||''));
  if (!dayEvs.length) { evList.innerHTML = '<div class="card" style="text-align:center;color:#a06090">Día libre 🌸</div>'; return; }

  dayEvs.forEach(ev => {
    const mat = materias.find(m => m.name === ev.mat) || {color:'#a06090'};
    const d = document.createElement('div');
    d.className = 'ev-item';
    d.style.borderLeftColor = mat.color;
    d.style.opacity = ev.done ? '0.5' : '1';
    d.innerHTML =
      '<button class="tog-e" data-id="' + ev.id + '" style="flex-shrink:0;background:none;border:2px solid '
      + (ev.done?'#ffd700':mat.color) + ';border-radius:50%;width:22px;height:22px;cursor:pointer;color:'
      + (ev.done?'#ffd700':'transparent') + ';font-size:11px">' + (ev.done?'✓':'') + '</button>'
      + '<div style="flex:1"><div style="font-size:13px;text-decoration:' + (ev.done?'line-through':'none') + '">' + x(ev.title) + '</div>'
      + '<div style="font-size:10px;color:' + mat.color + '">' + x(ev.mat) + (ev.hora?' · '+x(ev.hora):'') + '</div></div>'
      + '<button class="edit-e" data-id="' + ev.id + '" style="background:none;border:none;color:#a06090;cursor:pointer">✏️</button>'
      + '<button class="del-e" data-id="' + ev.id + '" style="background:none;border:none;color:#c00;cursor:pointer;font-size:18px">×</button>';
    evList.appendChild(d);
  });

  evList.querySelectorAll('.tog-e').forEach(b => b.onclick = async () => {
    const ev = events.find(e => e.id == b.dataset.id);
    if (await sbUpdate('events', b.dataset.id, { done: !ev.done })) renderAgenda();
  });
  evList.querySelectorAll('.edit-e').forEach(b => b.onclick = () => openEvModal(events.find(e => e.id == b.dataset.id), events, materias));
  evList.querySelectorAll('.del-e').forEach(b => b.onclick = async () => {
    if (!confirm('¿Eliminar?')) return;
    if (await sbDelete('events', b.dataset.id)) renderAgenda();
  });
}

function openEvModal(ev, events, materias) {
  const mo = materias.map(m => '<option' + (ev&&ev.mat===m.name?' selected':'') + '>' + x(m.name) + '</option>').join('');
  showModal('<h3>' + (ev ? 'Editar evento' : 'Nuevo — ' + DIAS[selDay]) + '</h3>'
    + '<input id="m-et" class="inp" value="' + x(ev?ev.title:'') + '" placeholder="Descripción..." style="margin-bottom:8px"/>'
    + '<input id="m-eh" class="inp" value="' + x(ev?ev.hora:'') + '" placeholder="Hora (08:00)" style="margin-bottom:8px"/>'
    + '<select id="m-em" class="inp" style="margin-bottom:12px">' + mo + '</select>'
    + '<div class="row"><button id="m-esave" class="btn btnp">Guardar</button><button id="m-ecancel" class="btn">Cancelar</button></div>');
  document.getElementById('m-esave').onclick = async () => {
    const t = document.getElementById('m-et').value.trim(); if (!t) return;
    const h = document.getElementById('m-eh').value.trim();
    const m = document.getElementById('m-em').value;
    let ok;
    if (ev) ok = await sbUpdate('events', ev.id, { title:t, hora:h, mat:m });
    else ok = await sbInsert('events', { day:selDay, title:t, mat:m, hora:h, done:false });
    if (ok) { closeModal(); renderAgenda(); }
  };
  document.getElementById('m-ecancel').onclick = closeModal;
}

async function openMatModal(materias) {
  const rows = materias.map((m,i) =>
    '<div class="row" style="margin-bottom:6px">'
    + '<input class="inp mat-name" data-i="' + i + '" value="' + x(m.name) + '" style="flex:1"/>'
    + '<input type="color" class="mat-color" data-i="' + i + '" value="' + m.color + '" style="width:32px;height:32px;border:none;background:none;cursor:pointer"/>'
    + '<button class="btn btnd btns del-mat" data-i="' + i + '">×</button></div>'
  ).join('');
  showModal('<h3>⚙️ Materias</h3>' + rows
    + '<div class="row" style="margin-top:10px">'
    + '<button id="m-matadd" class="btn btnp btns">+ Añadir</button>'
    + '<button id="m-matsave" class="btn btns">💾 Guardar</button>'
    + '<button id="m-matcancel" class="btn btns">Cerrar</button></div>');
  document.getElementById('m-matadd').onclick = () => { materias.push({name:'Nueva',color:'#a06090'}); openMatModal(materias); };
  document.getElementById('m-matsave').onclick = async () => {
    document.querySelectorAll('.mat-name').forEach(inp => { materias[Number(inp.dataset.i)].name = inp.value.trim() || materias[Number(inp.dataset.i)].name; });
    document.querySelectorAll('.mat-color').forEach(inp => { materias[Number(inp.dataset.i)].color = inp.value; });
    await sbSetCfg('materias', materias);
    closeModal(); renderAgenda();
  };
  document.querySelectorAll('.del-mat').forEach(b => b.onclick = () => { materias.splice(Number(b.dataset.i),1); openMatModal(materias); });
  document.getElementById('m-matcancel').onclick = closeModal;
}

// ═══════════════════════════════
// VERSÍCULOS
// ═══════════════════════════════
let vCatF = 'Todas';

async function renderVerses() {
  const [verses, vcats] = await Promise.all([
    sbGet('verses'),
    sbGetCfg('vcats', ['Fortaleza','Confianza','Amor','Fe','Mujer'])
  ]);
  const pg = document.getElementById('pg-verses');
  const filtered = vCatF === 'Todas' ? verses : verses.filter(v => v.cat === vCatF);

  const cb = ['Todas',...vcats].map(c =>
    '<button class="btn btns vcat-btn" data-c="' + x(c) + '" style="background:' + (vCatF===c?'#e91e8c':'#1a0018')
    + ';color:' + (vCatF===c?'#fff':'#a06090') + ';margin-bottom:4px">' + x(c) + '</button>'
  ).join('');

  const cards = filtered.map(v =>
    '<div class="card" style="border-left:3px solid #e91e8c">'
    + '<div style="font-size:13px;line-height:1.7;font-style:italic;color:#ffb3e6;margin-bottom:6px">"' + x(v.text) + '"</div>'
    + '<div class="row" style="justify-content:space-between">'
    + '<div><span style="color:#ff6ec7;font-size:12px">' + x(v.ref) + '</span> <span class="muted">· ' + x(v.cat) + '</span></div>'
    + '<div class="row">'
    + '<button class="edit-v btn btns" data-id="' + v.id + '">✏️</button>'
    + '<button class="del-v btn btns btnd" data-id="' + v.id + '">×</button>'
    + '</div></div></div>'
  ).join('');

  pg.innerHTML = '<div class="row" style="justify-content:space-between;margin-bottom:8px">'
    + '<div class="muted">📖 MIS VERSÍCULOS</div>'
    + '<div class="row"><button id="btn-new-v" class="btn btnp btns">+ Añadir</button>'
    + '<button id="btn-vcats" class="btn btns">⚙️ Cats</button></div></div>'
    + '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">' + cb + '</div>'
    + (cards || '<div class="muted" style="text-align:center;padding:14px">Sin versículos aún.</div>');

  pg.querySelectorAll('.vcat-btn').forEach(b => b.onclick = () => { vCatF = b.dataset.c; renderVerses(); });
  document.getElementById('btn-new-v').onclick = () => openVerseModal(null, vcats);
  document.getElementById('btn-vcats').onclick = () => openCatModal('vcats', 'Categorías de versículos', ['Fortaleza','Confianza','Amor','Fe','Mujer'], renderVerses);
  pg.querySelectorAll('.edit-v').forEach(b => b.onclick = () => openVerseModal(verses.find(v => v.id == b.dataset.id), vcats));
  pg.querySelectorAll('.del-v').forEach(b => b.onclick = async () => {
    if (!confirm('¿Eliminar?')) return;
    if (await sbDelete('verses', b.dataset.id)) renderVerses();
  });
}

function openVerseModal(v, vcats) {
  const opts = vcats.map(c => '<option' + (v&&v.cat===c?' selected':'') + '>' + x(c) + '</option>').join('');
  showModal('<h3>' + (v?'Editar':'Nuevo') + ' versículo</h3>'
    + '<input id="m-vr" class="inp" value="' + x(v?v.ref:'') + '" placeholder="Referencia (Juan 3:16)" style="margin-bottom:8px"/>'
    + '<textarea id="m-vt" class="inp" rows="3" placeholder="Texto..." style="margin-bottom:8px;resize:none">' + x(v?v.text:'') + '</textarea>'
    + '<select id="m-vc" class="inp" style="margin-bottom:12px">' + opts + '</select>'
    + '<div class="row"><button id="m-vsave" class="btn btnp">Guardar</button><button id="m-vcancel" class="btn">Cancelar</button></div>');
  document.getElementById('m-vsave').onclick = async () => {
    const r = document.getElementById('m-vr').value.trim();
    const t = document.getElementById('m-vt').value.trim();
    const c = document.getElementById('m-vc').value;
    if (!r||!t) return;
    let ok;
    if (v) ok = await sbUpdate('verses', v.id, { ref:r, text:t, cat:c });
    else ok = await sbInsert('verses', { ref:r, text:t, cat:c });
    if (ok) { closeModal(); renderVerses(); }
  };
  document.getElementById('m-vcancel').onclick = closeModal;
}

// ═══════════════════════════════
// NOTAS
// ═══════════════════════════════
let nCatF = 'Todas';

async function renderNotas() {
  const [notas, ncats] = await Promise.all([
    sbGet('notas', 'created_at'),
    sbGetCfg('ncats', ['Base de Datos I','Estructura de Datos II','Programación','Matemáticas','Iglesia','Devocional','General'])
  ]);
  const pg = document.getElementById('pg-notas');
  const filtered = nCatF === 'Todas' ? notas : notas.filter(n => n.cat === nCatF);

  const cb = ['Todas',...ncats].map(c =>
    '<button class="btn btns ncat-btn" data-c="' + x(c) + '" style="background:' + (nCatF===c?'#e91e8c':'#1a0018')
    + ';color:' + (nCatF===c?'#fff':'#a06090') + ';margin-bottom:4px">' + x(c) + '</button>'
  ).join('');

  const cards = filtered.map(n =>
    '<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:6px">'
    + '<div class="nota-title">' + x(n.title) + '</div>'
    + '<div class="row">'
    + '<button class="edit-n btn btns" data-id="' + n.id + '">✏️</button>'
    + '<button class="del-n btn btns btnd" data-id="' + n.id + '">×</button></div></div>'
    + '<div class="muted" style="margin-bottom:6px">' + x(n.cat) + '</div>'
    + '<div class="nota-body">' + x(n.body) + '</div></div>'
  ).join('');

  pg.innerHTML = '<div class="row" style="justify-content:space-between;margin-bottom:8px">'
    + '<div class="muted">📝 MIS NOTAS</div>'
    + '<div class="row"><button id="btn-new-n" class="btn btnp btns">+ Nueva</button>'
    + '<button id="btn-ncats" class="btn btns">⚙️ Cats</button></div></div>'
    + '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">' + cb + '</div>'
    + (cards || '<div class="muted" style="text-align:center;padding:14px">Sin notas aún.</div>');

  pg.querySelectorAll('.ncat-btn').forEach(b => b.onclick = () => { nCatF = b.dataset.c; renderNotas(); });
  document.getElementById('btn-new-n').onclick = () => openNotaModal(null, ncats);
  document.getElementById('btn-ncats').onclick = () => openCatModal('ncats', 'Categorías de notas', ncats, renderNotas);
  pg.querySelectorAll('.edit-n').forEach(b => b.onclick = () => openNotaModal(notas.find(n => n.id == b.dataset.id), ncats));
  pg.querySelectorAll('.del-n').forEach(b => b.onclick = async () => {
    if (!confirm('¿Eliminar?')) return;
    if (await sbDelete('notas', b.dataset.id)) renderNotas();
  });
}

function openNotaModal(n, ncats) {
  const opts = ncats.map(c => '<option' + (n&&n.cat===c?' selected':'') + '>' + x(c) + '</option>').join('');
  showModal('<h3>' + (n?'Editar':'Nueva') + ' nota</h3>'
    + '<input id="m-nt" class="inp" value="' + x(n?n.title:'') + '" placeholder="Título..." style="margin-bottom:8px"/>'
    + '<select id="m-nc" class="inp" style="margin-bottom:8px">' + opts + '</select>'
    + '<textarea id="m-nb" class="inp" rows="5" placeholder="Contenido..." style="margin-bottom:12px;resize:none">' + x(n?n.body:'') + '</textarea>'
    + '<div class="row"><button id="m-nsave" class="btn btnp">Guardar</button><button id="m-ncancel" class="btn">Cancelar</button></div>');
  document.getElementById('m-nsave').onclick = async () => {
    const t = document.getElementById('m-nt').value.trim(); if (!t) return;
    const c = document.getElementById('m-nc').value;
    const b = document.getElementById('m-nb').value;
    let ok;
    if (n) ok = await sbUpdate('notas', n.id, { title:t, cat:c, body:b });
    else ok = await sbInsert('notas', { title:t, cat:c, body:b });
    if (ok) { closeModal(); renderNotas(); }
  };
  document.getElementById('m-ncancel').onclick = closeModal;
}

// ═══════════════════════════════
// METAS
// ═══════════════════════════════
let mCatF = 'Todas';

async function renderMetas() {
  const [metas, mcats] = await Promise.all([
    sbGet('metas'),
    sbGetCfg('mcats', ['Espiritual','Académico','Personal','Iglesia'])
  ]);
  const pg = document.getElementById('pg-metas');
  const filtered = mCatF === 'Todas' ? metas : metas.filter(m => m.cat === mCatF);

  const cb = ['Todas',...mcats].map(c =>
    '<button class="btn btns mcat-btn" data-c="' + x(c) + '" style="background:' + (mCatF===c?'#e91e8c':'#1a0018')
    + ';color:' + (mCatF===c?'#fff':'#a06090') + ';margin-bottom:4px">' + x(c) + '</button>'
  ).join('');

  const cards = filtered.map(m => {
    const pct = m.total > 0 ? Math.min(100, Math.round((m.prog/m.total)*100)) : 0;
    return '<div class="card meta-card">'
      + '<div class="row" style="justify-content:space-between;margin-bottom:4px">'
      + '<div class="meta-title">' + x(m.title) + '</div>'
      + '<div class="row">'
      + '<button class="prog-m btn btns" data-id="' + m.id + '">+1</button>'
      + '<button class="edit-m btn btns" data-id="' + m.id + '">✏️</button>'
      + '<button class="del-m btn btns btnd" data-id="' + m.id + '">×</button></div></div>'
      + '<div class="muted" style="margin-bottom:4px">' + x(m.cat) + ' · ' + m.prog + ' / ' + m.total + ' ' + x(m.unit) + ' (' + pct + '%)</div>'
      + '<div class="pbar"><div class="pfill" style="width:' + pct + '%"></div></div></div>';
  }).join('');

  pg.innerHTML = '<div class="row" style="justify-content:space-between;margin-bottom:8px">'
    + '<div class="muted">🎯 MIS METAS</div>'
    + '<div class="row"><button id="btn-new-m" class="btn btnp btns">+ Nueva</button>'
    + '<button id="btn-mcats" class="btn btns">⚙️ Cats</button></div></div>'
    + '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">' + cb + '</div>'
    + (cards || '<div class="muted" style="text-align:center;padding:14px">Sin metas aún 🎯</div>');

  pg.querySelectorAll('.mcat-btn').forEach(b => b.onclick = () => { mCatF = b.dataset.c; renderMetas(); });
  document.getElementById('btn-new-m').onclick = () => openMetaModal(null, mcats);
  document.getElementById('btn-mcats').onclick = () => openCatModal('mcats', 'Categorías de metas', mcats, renderMetas);
  pg.querySelectorAll('.prog-m').forEach(b => b.onclick = async () => {
    const m = metas.find(mm => mm.id == b.dataset.id);
    if (await sbUpdate('metas', b.dataset.id, { prog: Math.min(m.total, m.prog+1) })) renderMetas();
  });
  pg.querySelectorAll('.edit-m').forEach(b => b.onclick = () => openMetaModal(metas.find(m => m.id == b.dataset.id), mcats));
  pg.querySelectorAll('.del-m').forEach(b => b.onclick = async () => {
    if (!confirm('¿Eliminar?')) return;
    if (await sbDelete('metas', b.dataset.id)) renderMetas();
  });
}

function openMetaModal(m, mcats) {
  const opts = mcats.map(c => '<option' + (m&&m.cat===c?' selected':'') + '>' + x(c) + '</option>').join('');
  showModal('<h3>' + (m?'Editar':'Nueva') + ' meta</h3>'
    + '<input id="m-mtit" class="inp" value="' + x(m?m.title:'') + '" placeholder="Título..." style="margin-bottom:8px"/>'
    + '<select id="m-mcat" class="inp" style="margin-bottom:8px">' + opts + '</select>'
    + '<div class="row" style="margin-bottom:8px">'
    + '<input id="m-mprog" class="inp" type="number" min="0" value="' + (m?m.prog:0) + '" style="flex:1"/>'
    + '<input id="m-mtot" class="inp" type="number" min="1" value="' + (m?m.total:10) + '" style="flex:1"/></div>'
    + '<input id="m-munit" class="inp" value="' + x(m?m.unit:'') + '" placeholder="Unidad (capítulos...)" style="margin-bottom:12px"/>'
    + '<div class="row"><button id="m-msave" class="btn btnp">Guardar</button><button id="m-mcancel" class="btn">Cancelar</button></div>');
  document.getElementById('m-msave').onclick = async () => {
    const t = document.getElementById('m-mtit').value.trim(); if (!t) return;
    const c = document.getElementById('m-mcat').value;
    const pr = parseInt(document.getElementById('m-mprog').value)||0;
    const to = parseInt(document.getElementById('m-mtot').value)||1;
    const u = document.getElementById('m-munit').value.trim()||'unidades';
    let ok;
    if (m) ok = await sbUpdate('metas', m.id, { title:t, cat:c, prog:pr, total:to, unit:u });
    else ok = await sbInsert('metas', { title:t, cat:c, prog:pr, total:to, unit:u });
    if (ok) { closeModal(); renderMetas(); }
  };
  document.getElementById('m-mcancel').onclick = closeModal;
}

// ═══════════════════════════════
// HELPER — EDITOR DE CATEGORÍAS
// ═══════════════════════════════
async function openCatModal(cfgKey, title, current, onDone) {
  let cats = [...current];
  const rows = () => cats.map((c,i) =>
    '<div class="row" style="margin-bottom:6px">'
    + '<input class="inp cat-inp" data-i="' + i + '" value="' + x(c) + '" style="flex:1"/>'
    + '<button class="btn btnd btns del-cat" data-i="' + i + '">×</button></div>'
  ).join('');

  const render = () => {
    showModal('<h3>⚙️ ' + x(title) + '</h3>' + rows()
      + '<div class="row" style="margin-top:10px">'
      + '<button id="m-catadd" class="btn btnp btns">+ Añadir</button>'
      + '<button id="m-catsave" class="btn btns">💾 Guardar</button>'
      + '<button id="m-catcancel" class="btn btns">Cerrar</button></div>');
    document.getElementById('m-catadd').onclick = () => { cats.push('Nueva'); render(); };
    document.getElementById('m-catsave').onclick = async () => {
      const nc = [];
      document.querySelectorAll('.cat-inp').forEach(inp => { const v = inp.value.trim(); if (v) nc.push(v); });
      await sbSetCfg(cfgKey, nc);
      closeModal(); if (onDone) onDone();
    };
    document.querySelectorAll('.del-cat').forEach(b => b.onclick = () => { cats.splice(Number(b.dataset.i),1); render(); });
    document.getElementById('m-catcancel').onclick = closeModal;
  };
  render();
}
// ═══════════════════════════════
// DIARIO PRIVADO
// ═══════════════════════════════
let diaryUnlocked = false;
const DIARY_PASS_KEY = 'lia_diarypass';
const DIARY_PASS_DEF = 'Teamo';

function getDiaryPass() { return localStorage.getItem(DIARY_PASS_KEY) || DIARY_PASS_DEF; }

async function renderDiario() {
  const pg = document.getElementById('pg-diario');
  if (!diaryUnlocked) {
    pg.innerHTML =
      '<div class="card diary-lock-screen">'
      + '<div style="font-size:32px;margin-bottom:12px">🔒</div>'
      + '<div style="color:#ff6ec7;font-size:14px;margin-bottom:6px;font-weight:700">Diario privado de PrincessLia</div>'
      + '<div class="muted" style="margin-bottom:16px">Este espacio es solo tuyo 🌸</div>'
      + '<input id="pass-inp" class="inp" type="password" placeholder="Contraseña..." style="margin-bottom:10px;text-align:center"/>'
      + '<div class="row" style="justify-content:center;gap:8px">'
      + '<button id="pass-enter" class="btn btnp">Entrar</button>'
      + '<button id="pass-change" class="btn btns">🔑 Cambiar contraseña</button>'
      + '</div>'
      + '<div id="pass-err" style="color:#f76f6f;font-size:11px;margin-top:8px;display:none">Contraseña incorrecta 💔</div>'
      + '</div>';
    document.getElementById('pass-enter').onclick = checkPass;
    document.getElementById('pass-inp').onkeydown = e => { if (e.key === 'Enter') checkPass(); };
    document.getElementById('pass-change').onclick = openChangePass;
    return;
  }

  const entries = await sbGet('diary', 'created_at');
  const cards = entries.map(e =>
    '<div class="card diary-entry">'
    + '<div class="row" style="justify-content:space-between;margin-bottom:6px">'
    + '<div class="diary-date">🔒 ' + x(e.date) + '</div>'
    + '<button class="del-d btn btns btnd" data-id="' + e.id + '">×</button></div>'
    + '<div class="diary-text">' + x(e.text) + '</div></div>'
  ).join('');

  pg.innerHTML =
    '<div class="row" style="justify-content:space-between;margin-bottom:10px">'
    + '<div style="color:#ff6ec7;font-size:13px;font-weight:700">🌸 Mi diario personal</div>'
    + '<div class="row">'
    + '<button id="diary-lock" class="btn btns">🔒 Cerrar</button>'
    + '<button id="diary-chpass" class="btn btns">🔑 Clave</button>'
    + '</div></div>'
    + '<div class="card">'
    + '<div class="muted" style="margin-bottom:8px">+ Nueva entrada</div>'
    + '<textarea id="diary-ta" class="inp" rows="5" placeholder="Escribe tus pensamientos..." style="resize:none;line-height:1.7"></textarea>'
    + '<div style="margin-top:8px"><button id="diary-save" class="btn btnp btns">💾 Guardar entrada</button></div></div>'
    + (cards || '<div class="muted" style="text-align:center;padding:14px">Aún no hay entradas 🌸</div>');

  document.getElementById('diary-save').onclick = async () => {
    const t = document.getElementById('diary-ta').value.trim(); if (!t) return;
    if (await sbInsert('diary', { text:t, date:new Date().toLocaleString('es-ES') })) renderDiario();
  };
  document.getElementById('diary-lock').onclick = () => { diaryUnlocked = false; renderDiario(); };
  document.getElementById('diary-chpass').onclick = openChangePass;
  pg.querySelectorAll('.del-d').forEach(b => b.onclick = async () => {
    if (!confirm('¿Eliminar entrada?')) return;
    if (await sbDelete('diary', b.dataset.id)) renderDiario();
  });
}

function checkPass() {
  const inp = document.getElementById('pass-inp');
  const err = document.getElementById('pass-err');
  if (inp.value === getDiaryPass()) { diaryUnlocked = true; renderDiario(); }
  else { err.style.display = 'block'; inp.value = ''; setTimeout(() => err.style.display='none', 2000); }
}

function openChangePass() {
  showModal('<h3>🔑 Cambiar contraseña del diario</h3>'
    + '<input id="cp-old" class="inp" type="password" placeholder="Contraseña actual..." style="margin-bottom:8px"/>'
    + '<input id="cp-new" class="inp" type="password" placeholder="Nueva contraseña..." style="margin-bottom:8px"/>'
    + '<input id="cp-rep" class="inp" type="password" placeholder="Repetir nueva..." style="margin-bottom:12px"/>'
    + '<div id="cp-err" style="color:#f76f6f;font-size:11px;margin-bottom:8px;display:none"></div>'
    + '<div class="row"><button id="cp-save" class="btn btnp">Guardar</button><button id="cp-cancel" class="btn">Cancelar</button></div>');
  document.getElementById('cp-save').onclick = () => {
    const old = document.getElementById('cp-old').value;
    const nw  = document.getElementById('cp-new').value.trim();
    const rp  = document.getElementById('cp-rep').value.trim();
    const err = document.getElementById('cp-err');
    if (old !== getDiaryPass()) { err.textContent='Contraseña actual incorrecta 💔'; err.style.display='block'; return; }
    if (!nw) { err.textContent='No puede estar vacía.'; err.style.display='block'; return; }
    if (nw !== rp) { err.textContent='Las contraseñas no coinciden 💔'; err.style.display='block'; return; }
    localStorage.setItem(DIARY_PASS_KEY, nw);
    closeModal(); alert('✓ Contraseña cambiada 🌸');
  };
  document.getElementById('cp-cancel').onclick = closeModal;
}

// ═══════════════════════════════
// GYM / FITNESS
// ═══════════════════════════════
let gymTab = 'rutinas';
let planDay = new Date().getDay();

async function renderGym() {
  const pg = document.getElementById('pg-gym');
  const labels = { rutinas:'💪 Rutinas', progreso:'📊 Progreso', plan:'📅 Plan', logros:'🏆 Logros' };
  const tabs = Object.keys(labels).map(t =>
    '<button class="btn btns gym-tab-btn" data-t="' + t + '" style="background:' + (gymTab===t?'#e91e8c':'#1a0018')
    + ';color:' + (gymTab===t?'#fff':'#a06090') + '">' + labels[t] + '</button>'
  ).join('');
  pg.innerHTML = '<div class="gym-tab-row">' + tabs + '</div><div id="gym-body"></div>';
  pg.querySelectorAll('.gym-tab-btn').forEach(b => b.onclick = () => { gymTab = b.dataset.t; renderGym(); });
  if (gymTab==='rutinas') await renderRutinas();
  else if (gymTab==='progreso') await renderProgreso();
  else if (gymTab==='plan') await renderPlan();
  else await renderLogros();
}

async function renderRutinas() {
  const rutinas = await sbGet('rutinas');
  const body = document.getElementById('gym-body');
  const cards = rutinas.map((r,i) => {
    const exs = (r.ejercicios||[]).map(e =>
      '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #3d003533">'
      + '<div style="font-size:12px">' + x(e.name) + '</div>'
      + '<div class="muted">' + e.series + 'x' + e.reps + (e.peso?' · '+e.peso+'kg':'') + '</div></div>'
    ).join('');
    return '<div class="card" style="border-left:3px solid #e91e8c">'
      + '<div class="row" style="justify-content:space-between;margin-bottom:8px">'
      + '<div style="font-weight:700;color:#ff6ec7">' + x(r.name) + '</div>'
      + '<div class="row">'
      + '<button class="edit-rut btn btns" data-id="' + r.id + '">✏️</button>'
      + '<button class="del-rut btn btns btnd" data-id="' + r.id + '">×</button></div></div>'
      + '<div class="muted" style="margin-bottom:6px">' + x(r.cat||'General') + '</div>'
      + exs + '</div>';
  }).join('');
  body.innerHTML = '<div class="row" style="justify-content:space-between;margin-bottom:10px">'
    + '<div class="muted">💪 MIS RUTINAS</div>'
    + '<button id="btn-new-rut" class="btn btnp btns">+ Nueva rutina</button></div>'
    + (cards || '<div class="muted" style="text-align:center;padding:14px">Sin rutinas aún 💪</div>');
  document.getElementById('btn-new-rut').onclick = () => openRutinaModal(null);
  body.querySelectorAll('.edit-rut').forEach(b => b.onclick = () => openRutinaModal(rutinas.find(r => r.id == b.dataset.id)));
  body.querySelectorAll('.del-rut').forEach(b => b.onclick = async () => {
    if (!confirm('¿Eliminar rutina?')) return;
    if (await sbDelete('rutinas', b.dataset.id)) renderGym();
  });
}

function openRutinaModal(r) {
  const cats = ['Piernas','Brazos','Pecho','Espalda','Abdomen','Cardio','Full Body','Glúteos'];
  const catOpts = cats.map(c => '<option' + (r&&r.cat===c?' selected':'') + '>' + c + '</option>').join('');
  const exRow = (e,i) =>
    '<div class="ex-row">'
    + '<input class="inp ex-name" value="' + x(e.name) + '" placeholder="Ejercicio..." style="margin-bottom:4px"/>'
    + '<div class="row">'
    + '<input class="inp ex-ser" type="number" min="1" value="' + (e.series||3) + '" placeholder="Series" style="flex:1"/>'
    + '<input class="inp ex-rep" type="number" min="1" value="' + (e.reps||10) + '" placeholder="Reps" style="flex:1"/>'
    + '<input class="inp ex-peso" value="' + (e.peso||'') + '" placeholder="kg" style="flex:1"/>'
    + '</div></div>';
  const exRows = (r ? r.ejercicios : []).map((e,i) => exRow(e,i)).join('');
  showModal('<h3>' + (r?'Editar':'Nueva') + ' rutina</h3>'
    + '<input id="m-rname" class="inp" value="' + x(r?r.name:'') + '" placeholder="Nombre..." style="margin-bottom:8px"/>'
    + '<select id="m-rcat" class="inp" style="margin-bottom:10px">' + catOpts + '</select>'
    + '<div class="muted" style="margin-bottom:6px">Ejercicios:</div>'
    + '<div id="ex-rows">' + exRows + '</div>'
    + '<button id="add-ex" class="btn btns" style="margin:6px 0">+ Ejercicio</button>'
    + '<div class="row"><button id="m-rtsave" class="btn btnp">Guardar</button><button id="m-rtcancel" class="btn">Cancelar</button></div>');
  document.getElementById('add-ex').onclick = () => {
    document.getElementById('ex-rows').insertAdjacentHTML('beforeend', exRow({name:'',series:3,reps:10,peso:''},0));
  };
  document.getElementById('m-rtsave').onclick = async () => {
    const name = document.getElementById('m-rname').value.trim(); if (!name) return;
    const cat  = document.getElementById('m-rcat').value;
    const ejercicios = [];
    document.querySelectorAll('.ex-row').forEach(row => {
      const n = row.querySelector('.ex-name').value.trim(); if (!n) return;
      ejercicios.push({ name:n, series:parseInt(row.querySelector('.ex-ser').value)||3,
        reps:parseInt(row.querySelector('.ex-rep').value)||10, peso:row.querySelector('.ex-peso').value.trim() });
    });
    let ok;
    if (r) ok = await sbUpdate('rutinas', r.id, { name, cat, ejercicios });
    else ok = await sbInsert('rutinas', { name, cat, ejercicios });
    if (ok) { closeModal(); renderGym(); }
  };
  document.getElementById('m-rtcancel').onclick = closeModal;
}

async function renderProgreso() {
  const medidas = await sbGet('medidas', 'created_at');
  const body = document.getElementById('gym-body');
  const rows = medidas.map(m =>
    '<div class="card">'
    + '<div class="row" style="justify-content:space-between;margin-bottom:8px">'
    + '<div style="color:#ffd700;font-size:11px">📅 ' + x(m.date) + '</div>'
    + '<button class="del-med btn btns btnd" data-id="' + m.id + '">×</button></div>'
    + '<div class="row" style="gap:10px;flex-wrap:wrap">'
    + (m.peso   ? '<div class="med-stat"><div class="med-val" style="color:#ff6ec7">'  + x(m.peso)    + '</div><div class="muted">kg</div></div>' : '')
    + (m.cintura? '<div class="med-stat"><div class="med-val" style="color:#a78bfa">'  + x(m.cintura) + '</div><div class="muted">cintura</div></div>' : '')
    + (m.cadera ? '<div class="med-stat"><div class="med-val" style="color:#3ecf8e">'  + x(m.cadera)  + '</div><div class="muted">cadera</div></div>' : '')
    + (m.pecho  ? '<div class="med-stat"><div class="med-val" style="color:#f7c94f">'  + x(m.pecho)   + '</div><div class="muted">pecho</div></div>' : '')
    + (m.brazo  ? '<div class="med-stat"><div class="med-val" style="color:#f76f6f">'  + x(m.brazo)   + '</div><div class="muted">brazo</div></div>' : '')
    + '</div>'
    + (m.nota ? '<div class="muted" style="margin-top:6px">📝 ' + x(m.nota) + '</div>' : '')
    + '</div>'
  ).join('');
  body.innerHTML = '<div class="row" style="justify-content:space-between;margin-bottom:10px">'
    + '<div class="muted">📊 MI PROGRESO</div>'
    + '<button id="btn-new-med" class="btn btnp btns">+ Registrar</button></div>'
    + (rows || '<div class="muted" style="text-align:center;padding:14px">Sin registros aún 📊</div>');
  document.getElementById('btn-new-med').onclick = openMedidaModal;
  body.querySelectorAll('.del-med').forEach(b => b.onclick = async () => {
    if (!confirm('¿Eliminar registro?')) return;
    if (await sbDelete('medidas', b.dataset.id)) renderGym();
  });
}

function openMedidaModal() {
  showModal('<h3>📊 Registrar medidas</h3>'
    + '<div class="row" style="margin-bottom:8px">'
    + '<div style="flex:1"><div class="muted" style="margin-bottom:3px">Peso (kg)</div><input id="m-mpeso" class="inp" type="number" step="0.1" placeholder="60.5"/></div>'
    + '<div style="flex:1"><div class="muted" style="margin-bottom:3px">Cintura (cm)</div><input id="m-mcintura" class="inp" type="number" placeholder="65"/></div></div>'
    + '<div class="row" style="margin-bottom:8px">'
    + '<div style="flex:1"><div class="muted" style="margin-bottom:3px">Cadera (cm)</div><input id="m-mcadera" class="inp" type="number" placeholder="90"/></div>'
    + '<div style="flex:1"><div class="muted" style="margin-bottom:3px">Pecho (cm)</div><input id="m-mpecho" class="inp" type="number" placeholder="85"/></div></div>'
    + '<div class="muted" style="margin-bottom:3px">Brazo (cm)</div>'
    + '<input id="m-mbrazo" class="inp" type="number" placeholder="28" style="margin-bottom:8px"/>'
    + '<div class="muted" style="margin-bottom:3px">Nota</div>'
    + '<input id="m-mnota" class="inp" placeholder="Ej: me siento con más energía..." style="margin-bottom:12px"/>'
    + '<div class="row"><button id="m-msave2" class="btn btnp">Guardar</button><button id="m-mcancel2" class="btn">Cancelar</button></div>');
  document.getElementById('m-msave2').onclick = async () => {
    const peso=document.getElementById('m-mpeso').value.trim();
    const cin =document.getElementById('m-mcintura').value.trim();
    const cad =document.getElementById('m-mcadera').value.trim();
    const pec =document.getElementById('m-mpecho').value.trim();
    const bra =document.getElementById('m-mbrazo').value.trim();
    const not =document.getElementById('m-mnota').value.trim();
    if (!peso&&!cin&&!cad&&!pec&&!bra) return;
    const obj = { date:tod() };
    if (peso) obj.peso=peso; if (cin) obj.cintura=cin; if (cad) obj.cadera=cad;
    if (pec) obj.pecho=pec; if (bra) obj.brazo=bra; if (not) obj.nota=not;
    if (await sbInsert('medidas', obj)) { closeModal(); renderGym(); }
  };
  document.getElementById('m-mcancel2').onclick = closeModal;
}

async function renderPlan() {
  const [rutinas, planData] = await Promise.all([
    sbGet('rutinas'),
    sbGetCfg('planGym', {})
  ]);
  const body = document.getElementById('gym-body');
  const dayBar = DIAS.map((d,i) => {
    const has = planData[i] && planData[i].length;
    const active = planDay === i;
    return '<button class="day-btn" data-d="' + i + '" style="background:' + (active?'#e91e8c':'#1a0018')
      + ';color:' + (active?'#fff':'#a06090') + ';border-color:' + (active?'#e91e8c':'#3d0035') + '">'
      + d + (has?'<span class="day-dot"></span>':'') + '</button>';
  }).join('');
  const dayRuts = planData[planDay] || [];
  const rutOpts = rutinas.map(r => '<option>' + x(r.name) + '</option>').join('');
  const planCards = dayRuts.map((name,i) =>
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 11px;'
    + 'border-radius:8px;margin-bottom:6px;background:#0d0008;border:1px solid #e91e8c44">'
    + '<div>💪 ' + x(name) + '</div>'
    + '<button class="del-plan btn btns btnd" data-i="' + i + '">×</button></div>'
  ).join('');
  body.innerHTML = '<div class="day-bar">' + dayBar + '</div>'
    + '<div class="row" style="justify-content:space-between;margin-bottom:10px">'
    + '<div class="muted">📅 ' + DIAS[planDay] + '</div>'
    + '<div class="row">'
    + (rutOpts
      ? '<select id="plan-sel" class="inp" style="width:auto">' + rutOpts + '</select>'
        + '<button id="plan-add" class="btn btnp btns">+ Añadir</button>'
      : '<span class="muted">Crea rutinas primero</span>')
    + '</div></div>'
    + (planCards || '<div class="muted" style="text-align:center;padding:14px">Descanso 🌸</div>');
  body.querySelectorAll('.day-btn').forEach(b => b.onclick = () => { planDay = Number(b.dataset.d); renderGym(); });
  if (document.getElementById('plan-add')) {
    document.getElementById('plan-add').onclick = async () => {
      const sel = document.getElementById('plan-sel').value;
      if (!planData[planDay]) planData[planDay] = [];
      if (!planData[planDay].includes(sel)) planData[planDay].push(sel);
      await sbSetCfg('planGym', planData); renderGym();
    };
  }
  body.querySelectorAll('.del-plan').forEach(b => b.onclick = async () => {
    planData[planDay].splice(Number(b.dataset.i),1);
    await sbSetCfg('planGym', planData); renderGym();
  });
}

async function renderLogros() {
  const logros = await sbGet('logros_gym');
  const body = document.getElementById('gym-body');
  const cards = logros.map(l => {
    const pct = l.total > 0 ? Math.min(100, Math.round((l.prog/l.total)*100)) : 0;
    return '<div class="card">'
      + '<div class="row" style="justify-content:space-between;margin-bottom:4px">'
      + '<div style="font-size:13px">' + x(l.title) + '</div>'
      + '<div class="row">'
      + '<button class="prog-lg btn btns" data-id="' + l.id + '">+1</button>'
      + '<button class="del-lg btn btns btnd" data-id="' + l.id + '">×</button></div></div>'
      + '<div class="muted" style="margin-bottom:4px">' + x(l.cat) + ' · ' + l.prog + '/' + l.total + ' ' + x(l.unit) + ' (' + pct + '%)</div>'
      + '<div class="pbar"><div class="pfill" style="width:' + pct + '%"></div></div>'
      + (pct>=100 ? '<div style="color:#ffd700;font-size:11px;margin-top:4px;text-align:center">🏆 ¡Meta alcanzada!</div>' : '')
      + '</div>';
  }).join('');
  body.innerHTML = '<div class="row" style="justify-content:space-between;margin-bottom:10px">'
    + '<div class="muted">🏆 MIS LOGROS FITNESS</div>'
    + '<button id="btn-new-lg" class="btn btnp btns">+ Nuevo logro</button></div>'
    + (cards || '<div class="muted" style="text-align:center;padding:14px">Sin logros aún 🏆</div>');
  document.getElementById('btn-new-lg').onclick = openLogroModal;
  body.querySelectorAll('.prog-lg').forEach(b => b.onclick = async () => {
    const l = logros.find(ll => ll.id == b.dataset.id);
    if (await sbUpdate('logros_gym', b.dataset.id, { prog: Math.min(l.total, l.prog+1) })) renderGym();
  });
  body.querySelectorAll('.del-lg').forEach(b => b.onclick = async () => {
    if (!confirm('¿Eliminar logro?')) return;
    if (await sbDelete('logros_gym', b.dataset.id)) renderGym();
  });
}

function openLogroModal() {
  const cats = ['Cardio','Fuerza','Flexibilidad','Peso','Medidas','General'];
  const opts = cats.map(c => '<option>' + c + '</option>').join('');
  showModal('<h3>🏆 Nuevo logro fitness</h3>'
    + '<input id="m-ltit" class="inp" placeholder="Ej: Correr 5km sin parar..." style="margin-bottom:8px"/>'
    + '<select id="m-lcat" class="inp" style="margin-bottom:8px">' + opts + '</select>'
    + '<div class="row" style="margin-bottom:8px">'
    + '<input id="m-lprog" class="inp" type="number" min="0" value="0" style="flex:1" placeholder="Progreso"/>'
    + '<input id="m-ltot"  class="inp" type="number" min="1" value="1" style="flex:1" placeholder="Total"/></div>'
    + '<input id="m-lunit" class="inp" placeholder="Unidad (km, repeticiones...)" style="margin-bottom:12px"/>'
    + '<div class="row"><button id="m-lsave" class="btn btnp">Guardar</button><button id="m-lcancel" class="btn">Cancelar</button></div>');
  document.getElementById('m-lsave').onclick = async () => {
    const t = document.getElementById('m-ltit').value.trim(); if (!t) return;
    const c = document.getElementById('m-lcat').value;
    const pr = parseInt(document.getElementById('