/* ─── State ─── */
let rawResponse = '';
let currentEndpoint = null;
const vscode = acquireVsCodeApi();

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  renderQuickEndpoints();
  vscode.postMessage({ command: 'loadApiKey' });

  document.getElementById('urlInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendRequest();
  });
});

let currentFetchId = 0;
const fetchPromises = {};

window.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg.command === 'apiKeyLoaded') {
    if (msg.key) {
      document.getElementById('apikeyInput').value = msg.key;
      setApikeyStatus(true);
    }
  }
  if (msg.command === 'apiKeySaved') {
    setApikeyStatus(true);
    showToast('✅ API Key saved');
  }
  if (msg.command === 'doFetchResponse' || msg.command === 'doFetchError') {
    if (fetchPromises[msg.id]) {
      fetchPromises[msg.id](msg);
      delete fetchPromises[msg.id];
    }
  }
});

/* ─── Quick Endpoints ─── */
function renderQuickEndpoints() {
  const grid = document.getElementById('qeGrid');
  grid.innerHTML = QUICK_ENDPOINTS.map((ep, i) => `
    <button class="qe-btn" id="qe-${i}" onclick="selectEndpoint(${i})">
      <span class="qe-icon">${ep.icon}</span>
      <div class="qe-info">
        <span class="qe-method">${ep.method}</span>
        <span class="qe-name">${ep.name}</span>
        <span class="qe-path">${ep.path}</span>
      </div>
    </button>
  `).join('');
}

function selectEndpoint(idx) {
  // Toggle active
  document.querySelectorAll('.qe-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('qe-' + idx).classList.add('active');

  const ep = QUICK_ENDPOINTS[idx];
  currentEndpoint = ep;

  let sub = ep.sub || '';
  const now = new Date();

  if (sub.includes('{end_now}')) {
    const endStr = encodeURIComponent(now.toISOString());
    let past = new Date();
    if (sub.includes('{start_24h}')) {
      past = new Date(now.getTime() - 24 * 3600 * 1000);
      sub = sub.replace('{start_24h}', encodeURIComponent(past.toISOString()));
    } else if (sub.includes('{start_168h}')) {
      past = new Date(now.getTime() - 168 * 3600 * 1000);
      sub = sub.replace('{start_168h}', encodeURIComponent(past.toISOString()));
    }
    sub = sub.replace('{end_now}', endStr);
  } else if (sub.includes('{current_month}')) {
    sub = sub.replace('{current_month}', `year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
  }

  // Populate fields
  document.getElementById('stationIdInput').value = ep.stationId || '';
  document.getElementById('subpathInput').value   = sub;

  if (ep.fullUrl) {
    document.getElementById('urlInput').value = ep.fullUrl;
  } else {
    buildUrl();
  }
}

function buildUrl() {
  const stationId = document.getElementById('stationIdInput').value.trim();
  const sub       = document.getElementById('subpathInput').value.trim();

  let url = BASE + '/stations';
  if (stationId) url += '/' + stationId;
  if (sub) url += '/' + sub;

  document.getElementById('urlInput').value = url;
}

/* ─── API Key ─── */
function saveApiKey() {
  const key = document.getElementById('apikeyInput').value.trim();
  if (!key) { showToast('⚠️ กรุณาใส่ API Key'); return; }
  vscode.postMessage({ command: 'saveApiKey', key });
}

function setApikeyStatus(saved) {
  const el = document.getElementById('apikeyStatus');
  if (saved) {
    el.textContent = '✓ saved';
    el.className = 'apikey-status saved';
  } else {
    el.textContent = '— not set';
    el.className = 'apikey-status unsaved';
  }
}

function getApiKey() {
  return document.getElementById('apikeyInput').value.trim();
}

/* ─── Send Request ─── */
async function sendRequest() {
  const url = document.getElementById('urlInput').value.trim();
  if (!url) { flashField('urlInput'); return; }

  const btn        = document.getElementById('shootBtn');
  const statusPill = document.getElementById('statusPill');
  const respTime   = document.getElementById('respTime');
  const respBody   = document.getElementById('responseBody');

  btn.classList.add('loading');
  btn.disabled = true;
  statusPill.className = 'status-pill';
  respTime.textContent = '';
  respBody.innerHTML = '<div class="empty-state"><span class="em-icon">⏳</span><p>กำลังส่ง Request…</p></div>';

  const apiKey   = getApiKey();
  const headers  = { 'Content-Type': 'application/json' };
  if (apiKey) headers['X-API-Key'] = apiKey;

  const fetchId = ++currentFetchId;
  
  const p = new Promise(resolve => {
    fetchPromises[fetchId] = resolve;
  });

  vscode.postMessage({
    command: 'doFetch',
    id: fetchId,
    url: url,
    method: currentEndpoint ? currentEndpoint.method : 'GET',
    headers: headers
  });

  try {
    const res = await p;
    if (res.command === 'doFetchError') {
      throw new Error(res.error);
    }
    
    const text = res.text;
    rawResponse = text;

    if (res.ok) {
      statusPill.className = 'status-pill ok';
      statusPill.textContent = '✓ ' + res.status + ' ' + res.statusText;
    } else {
      statusPill.className = 'status-pill err';
      statusPill.textContent = '✕ ' + res.status + ' ' + res.statusText;
    }
    respTime.textContent = res.time + ' ms';

    try {
      const json  = JSON.parse(text);
      rawResponse = JSON.stringify(json, null, 2);
      respBody.innerHTML = '<pre>' + syntaxHL(rawResponse) + '</pre>';

      if (currentEndpoint?.showCards && res.ok && Array.isArray(json)) {
        renderStationCards(json);
      } else {
        document.getElementById('stationSection').style.display = 'none';
      }
    } catch {
      respBody.textContent = text;
    }

  } catch (err) {
    rawResponse = String(err);
    statusPill.className = 'status-pill err';
    statusPill.textContent = '✕ Network Error / CORS';
    respTime.textContent = '?? ms';
    respBody.innerHTML = '<div class="empty-state"><span class="em-icon">❌</span><p>' + escHtml(String(err)) + '</p></div>';
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

/* ─── Station Cards ─── */
function renderStationCards(stations) {
  const section = document.getElementById('stationSection');
  const grid    = document.getElementById('stationGrid');
  const title   = document.getElementById('stationSectionTitle');

  title.textContent = 'Stations Overview (' + stations.length + ')';
  section.style.display = 'block';

  grid.innerHTML = stations.map(s => {
    const latest = s.latest || {};
    const pm25   = latest.pm25 != null ? Number(latest.pm25) : null;
    const { cls, dotCls, label } = aqiLevel(pm25);

    const ts = latest.timestamp
      ? new Date(latest.timestamp).toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' })
      : '--:--';

    return `
      <div class="station-card">
        <div class="station-card-top">
          <span class="station-id">${escHtml(s.station_id || '—')}</span>
          <span class="aqi-dot ${dotCls}" title="${label}"></span>
        </div>
        <div class="station-name" title="${escHtml(s.name || '')}">
          ${escHtml(s.name || 'Unknown Station')}
        </div>
        <div class="station-location">📍 ${escHtml(s.district || '')} · ${escHtml(s.province || '')}</div>
        <div class="pm25-row">
          <span class="pm25-value ${cls}">
            ${pm25 != null ? pm25.toFixed(1) : '—'}
          </span>
          <span class="pm25-unit">µg/m³</span>
        </div>
        <div class="pm25-label">PM2.5 · ${label}</div>
        <div class="sensor-row">
          ${latest.pm10 != null     ? '<span class="sensor-chip">PM10 ' + Number(latest.pm10).toFixed(1) + '</span>' : ''}
          ${latest.temperature != null ? '<span class="sensor-chip">🌡 ' + Number(latest.temperature).toFixed(1) + '°C</span>' : ''}
          ${latest.humidity != null ? '<span class="sensor-chip">💧 ' + Number(latest.humidity).toFixed(0) + '%</span>' : ''}
        </div>
        <div class="station-footer">
          <span class="station-time">🕐 ${ts}</span>
          <button class="use-btn" onclick="useStation('${escHtml(s.station_id || '')}')">Use</button>
        </div>
      </div>
    `;
  }).join('');
}

function useStation(id) {
  document.getElementById('stationIdInput').value = id;
  document.getElementById('subpathInput').value   = 'current';
  buildUrl();
  showToast('📍 Set to ' + id);
}

/* ─── AQI Helper ─── */
function aqiLevel(pm25) {
  if (pm25 == null) return { cls: '', dotCls: '', label: 'N/A' };
  if (pm25 <= 15)   return { cls: 'aqi-verygood',  dotCls: 'dot-verygood',  label: 'Very Good' };
  if (pm25 <= 25)   return { cls: 'aqi-good',      dotCls: 'dot-good',      label: 'Good' };
  if (pm25 <= 37.5) return { cls: 'aqi-moderate',  dotCls: 'dot-moderate',  label: 'Moderate' };
  if (pm25 <= 75)   return { cls: 'aqi-usg',       dotCls: 'dot-usg',       label: 'Unhealthy for SGP' };
  if (pm25 <= 100)  return { cls: 'aqi-unhealthy', dotCls: 'dot-unhealthy', label: 'Unhealthy' };
  return { cls: 'aqi-hazardous', dotCls: 'dot-hazardous', label: 'Hazardous' };
}

/* ─── Utilities ─── */
function syntaxHL(json) {
  const s = json.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return s.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (m) => {
      let c = 'jn';
      if (/^"/.test(m)) c = /:$/.test(m) ? 'jk' : 'js';
      else if (/true|false/.test(m)) c = 'jb';
      else if (/null/.test(m)) c = 'jz';
      return '<span class="' + c + '">' + m + '</span>';
    }
  );
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function copyResponse() {
  if (!rawResponse) return;
  navigator.clipboard.writeText(rawResponse).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });
}

function flashField(id) {
  const el = document.getElementById(id);
  el.style.borderColor  = 'var(--color-danger)';
  el.style.boxShadow    = '0 0 0 3px rgba(229,62,62,.18)';
  el.focus();
  setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 1000);
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
