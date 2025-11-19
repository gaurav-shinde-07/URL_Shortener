// app.js - improved UI interactions
const $ = (id) => document.getElementById(id);

async function fetchLinks() {
  const res = await fetch('/api/links');
  if (!res.ok) return [];
  return await res.json();
}

function truncate(s, n=80){ if(!s) return ''; return s.length>n ? s.slice(0,n-1)+'…' : s; }

async function render() {
  const listEl = $('list');
  const filter = $('filter');
  listEl.innerHTML = '<tr><td colspan="5" class="p-4">Loading...</td></tr>';
  let rows = await fetchLinks();
  if (filter && filter.value.trim()) {
    const q = filter.value.toLowerCase();
    rows = rows.filter(r => r.code.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));
  }
  if (rows.length === 0) {
    listEl.innerHTML = '<tr><td colspan="5" class="p-4">No links yet</td></tr>';
    return;
  }
  listEl.innerHTML = rows.map(r => `
    <tr class="border-t">
      <td class="px-3 py-2 font-mono">${r.code}</td>
      <td class="px-3 py-2"><a class="text-sky-600" href="${r.url}" target="_blank" title="${r.url}">${truncate(r.url,80)}</a></td>
      <td class="px-3 py-2">${r.clicks}</td>
      <td class="px-3 py-2">${r.last_clicked ? new Date(r.last_clicked).toLocaleString() : '—'}</td>
      <td class="px-3 py-2 space-x-2">
        <button onclick="copyUrl('${r.code}')" class="px-2 py-1 border rounded text-sm">Copy</button>
        <a href="/code/${r.code}" class="px-2 py-1 border rounded text-sm">Stats</a>
        <button onclick="deleteLink('${r.code}')" class="px-2 py-1 border rounded text-sm text-rose-600">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function copyUrl(code){
  const url = `${location.origin}/${code}`;
  try {
    await navigator.clipboard.writeText(url);
    alert('Copied: ' + url);
  } catch (e) {
    prompt('Copy this URL', url);
  }
}

async function deleteLink(code){
  if (!confirm('Delete ' + code + ' ?')) return;
  const res = await fetch('/api/links/' + code, { method: 'DELETE' });
  if (res.ok) {
    await render();
  } else {
    alert('Failed to delete');
  }
}

$('createForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const url = $('url').value.trim();
  const code = $('code').value.trim();
  const msg = $('message');
  const btn = $('createBtn');
  msg.textContent = '';
  if (!url) { msg.textContent = 'Enter URL'; return; }
  btn.disabled = true;
  try {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ url, code: code || undefined })
    });
    if (res.status === 409) {
      const data = await res.json();
      msg.textContent = data.error || 'Code exists';
      btn.disabled = false;
      return;
    }
    if (!res.ok) {
      const data = await res.json();
      msg.textContent = data.error || 'Error';
      btn.disabled = false;
      return;
    }
    const data = await res.json();
    msg.innerHTML = `Created: <a class="text-sky-600" href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>`;
    $('url').value = '';
    $('code').value = '';
    await render();
  } catch (err) {
    msg.textContent = 'Network error';
  } finally {
    btn.disabled = false;
    setTimeout(()=>msg.textContent='',7000);
  }
});

$('filter').addEventListener('input', ()=>render());
$('sampleBtn').addEventListener('click', ()=>{
  $('url').value = 'https://example.com/some/very/long/path?ref=assessment';
  $('code').value = '';
});

render();
