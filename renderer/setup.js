/* Conectar Steam y Discord desde la misma app: pasos cortos, botones para abrir las páginas,
   y cuadros para pegar la clave / los datos. Se abre desde Ajustes → Cuentas (en cualquier consola)
   o desde los botones "Conectar" de las pantallas de Grupo y Logros. */
(() => {
  const api = window.nostalhub || window.mockNostalHub;
  const stage = document.getElementById('stage');
  if (!api || !stage) return;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const call = (fn, ...a) => (typeof api[fn] === 'function' ? api[fn](...a) : Promise.resolve(null));

  const ICON = {
    steam: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="19"/><circle cx="31" cy="18" r="5.5"/><circle cx="17" cy="31" r="4"/><path d="M27 22l-7 6M5 27l9 4"/></svg>',
    discord: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 32V24a16 16 0 0 1 32 0v8"/><rect x="6" y="28" width="8" height="12" rx="3"/><rect x="34" y="28" width="8" height="12" rx="3"/></svg>',
    close: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M12 12l24 24M36 12 12 36"/></svg>',
    check: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 25l9 9 19-20"/></svg>',
  };

  const box = document.createElement('div');
  box.id = 'setup';
  box.hidden = true;
  box.innerHTML = `
    <div class="su-panel" role="dialog" aria-label="Conectar cuentas">
      <div class="su-head">
        <div class="su-tabs">
          <button class="su-tab" data-t="steam">${ICON.steam}<span>Steam</span></button>
          <button class="su-tab" data-t="discord">${ICON.discord}<span>Discord</span></button>
        </div>
        <button class="su-x" aria-label="Cerrar">${ICON.close}</button>
      </div>
      <div class="su-body"></div>
      <div class="su-foot">Esc para cerrar · Tus claves se guardan solo en este PC</div>
    </div>`;
  stage.appendChild(box);
  const body = box.querySelector('.su-body');

  let open = false;
  let tab = 'steam';
  let info = null; // lo que ya está guardado
  let discordState = null;
  let busy = false;
  let lastResult = { steam: null, discord: null };

  // ---------- Abrir y cerrar ----------
  async function show(which) {
    tab = which === 'discord' ? 'discord' : 'steam';
    lastResult = { steam: null, discord: null };
    if (!open) {
      open = true;
      box.hidden = false;
      box.classList.remove('leave');
      call('discordWatch', true);
    }
    info = (await call('getSetup')) || { steam: {}, discord: {} };
    discordState = info.discord && info.discord.state;
    render(true);
  }
  function hide() {
    if (!open) return;
    open = false;
    call('discordWatch', false);
    box.classList.add('leave');
    setTimeout(() => {
      if (!open) box.hidden = true;
    }, 220);
  }
  box.addEventListener('pointerdown', (e) => {
    if (e.target === box) hide();
  });
  box.querySelector('.su-x').addEventListener('click', hide);
  box.querySelectorAll('.su-tab').forEach((b) =>
    b.addEventListener('click', () => {
      tab = b.dataset.t;
      render(true);
    })
  );

  // Mientras está abierto, las teclas son solo para esta ventana (no mueven el menú de atrás)
  window.addEventListener(
    'keydown',
    (e) => {
      if (!open) return;
      e.stopImmediatePropagation();
      const inInput = e.target && e.target.tagName === 'INPUT';
      if (e.key === 'Escape') {
        e.preventDefault();
        hide();
      } else if (e.key === 'Enter' && inInput) {
        e.preventDefault();
        save();
      } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !inInput) {
        tab = tab === 'steam' ? 'discord' : 'steam';
        render(true);
      }
    },
    true
  );

  // ---------- Contenido ----------
  function step(n, html) {
    return `<div class="su-step"><span class="su-n">${n}</span><div class="su-st">${html}</div></div>`;
  }
  function field(id, label, placeholder, secret = false) {
    return `<label class="su-field"><span>${label}</span>
      <span class="su-input"><input id="${id}" type="${secret ? 'password' : 'text'}" placeholder="${esc(placeholder)}" spellcheck="false" autocomplete="off" />
      <button class="su-mini" data-paste="${id}">Pegar</button>${secret ? `<button class="su-mini ghost" data-eye="${id}">Ver</button>` : ''}</span></label>`;
  }
  function chip(kind, text) {
    return `<span class="su-chip ${kind}">${kind === 'ok' ? ICON.check : '<i></i>'}${esc(text)}</span>`;
  }
  function result(r) {
    if (!r) return '<div class="su-result"></div>';
    return `<div class="su-result ${r.ok ? 'ok' : 'bad'}">${esc(r.text)}${r.warning ? `<small>${esc(r.warning)}</small>` : ''}</div>`;
  }

  function steamStatus() {
    const s = (info && info.steam) || {};
    if (s.hasKey) return chip('ok', s.name ? `Conectado como ${s.name}` : 'Clave guardada');
    return chip('off', 'Sin conectar');
  }
  function discordStatus() {
    const st = discordState || { status: 'off' };
    const d = (info && info.discord) || {};
    switch (st.status) {
      case 'ok':
        return chip('ok', st.channel ? `Conectado · estás en ${st.channel.name}` : 'Conectado');
      case 'need-auth':
        return chip('warn', 'Falta autorizar en Discord');
      case 'authorizing':
        return chip('warn', 'Acepta la ventana que apareció en Discord');
      case 'no-discord':
        return chip('warn', d.clientId ? 'Abre la app de Discord en este PC' : 'Sin conectar');
      case 'connecting':
        return chip('warn', 'Conectando…');
      case 'error':
        return chip('bad', st.message || 'No se pudo conectar');
      default:
        return chip('off', d.clientId ? 'Datos guardados' : 'Sin conectar');
    }
  }

  function render(focus = false) {
    if (!open) return;
    box.querySelectorAll('.su-tab').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
    box.dataset.tab = tab;
    if (tab === 'steam') {
      const s = (info && info.steam) || {};
      body.innerHTML = `
        <div class="su-title"><h2>Conectar Steam</h2>${steamStatus()}</div>
        <p class="su-lead">Con tu clave de Steam se ven tus <b>logros</b>, tu nombre y tu foto en todas las consolas. Es gratis y se hace una sola vez.</p>
        ${step(1, `Abre la página de claves de Steam e inicia sesión si te lo pide. <button class="su-btn" data-open="steam-apikey-page">Abrir página de Steam</button>`)}
        ${step(2, `En <b>Domain Name</b> escribe <code>localhost</code>, acepta los términos y presiona <b>Register</b>. <button class="su-mini" data-copy="localhost">Copiar "localhost"</button>`)}
        ${step(3, `Copia la clave que aparece (<b>Key</b>) y pégala aquí:${field('su-steam-key', 'Clave de Steam', s.hasKey ? 'Ya tienes una guardada (pega otra para cambiarla)' : '32 letras y números')}`)}
        <div class="su-actions"><button class="su-btn primary" data-save>Guardar y probar</button>${result(lastResult.steam)}</div>
        ${s.foundUser === false ? '<p class="su-note">No encontré tu usuario de Steam en este PC: abre Steam e inicia sesión para que se vean tus logros.</p>' : ''}
        <p class="su-note">No compartas la clave con nadie. <button class="su-link" data-open="apikey-file">Abrir el archivo de la clave</button></p>`;
    } else {
      const d = (info && info.discord) || {};
      const st = (discordState && discordState.status) || 'off';
      body.innerHTML = `
        <div class="su-title"><h2>Conectar Discord</h2>${discordStatus()}</div>
        <p class="su-lead">Para ver tu <b>canal de voz</b> y quiénes están contigo (Grupo), Discord pide crear una "aplicación" propia. Es gratis y toma unos 2 minutos.</p>
        ${step(1, `Abre el portal de Discord, presiona <b>New Application</b>, ponle de nombre <code>NostalHub</code> y créala. <button class="su-btn" data-open="discord-portal">Abrir portal de Discord</button>`)}
        ${step(2, `Entra a <b>OAuth2</b>. En <b>Redirects</b> presiona <b>Add Redirect</b>, pega <code>http://localhost</code> y guarda con <b>Save Changes</b>. <button class="su-mini" data-copy="http://localhost">Copiar "http://localhost"</button>`)}
        ${step(3, `En esa misma página copia el <b>Client ID</b> y, en <b>Client Secret</b>, presiona <b>Reset Secret</b> y copia el texto. Pégalos aquí:
          <div class="su-two">${field('su-dc-id', 'Client ID', 'Solo números')}${field('su-dc-secret', 'Client Secret', d.hasSecret ? 'Ya hay uno guardado (déjalo vacío para mantenerlo)' : 'No es la "Clave pública"', true)}</div>`)}
        <div class="su-actions"><button class="su-btn primary discord" data-save>Guardar y conectar</button>
          ${st === 'need-auth' || st === 'error' ? '<button class="su-btn" data-auth>Autorizar en Discord</button>' : ''}
          ${st === 'no-discord' && d.clientId ? '<button class="su-btn" data-open="discord-app">Abrir Discord</button>' : ''}
          ${result(lastResult.discord)}</div>
        <p class="su-note">Al guardar, Discord muestra una ventana para autorizar: presiona <b>Autorizar</b>. Necesita la app de Discord abierta en este PC. No compartas el Client Secret con nadie. <button class="su-link" data-open="discord-file">Abrir el archivo</button></p>`;
      const idInput = body.querySelector('#su-dc-id');
      if (d.clientId) idInput.value = d.clientId;
    }
    bind();
    if (focus) {
      const first = body.querySelector('input');
      if (first) setTimeout(() => first.focus(), 60);
    }
  }

  function bind() {
    body.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => call('open', b.dataset.open)));
    body.querySelectorAll('[data-copy]').forEach((b) =>
      b.addEventListener('click', async () => {
        const text = b.dataset.copy;
        if (api.writeClipboard) await api.writeClipboard(text);
        else
          try {
            await navigator.clipboard.writeText(text);
          } catch {}
        const old = b.textContent;
        b.textContent = '¡Copiado!';
        b.classList.add('done');
        setTimeout(() => {
          b.textContent = old;
          b.classList.remove('done');
        }, 1400);
      })
    );
    body.querySelectorAll('[data-paste]').forEach((b) =>
      b.addEventListener('click', async (e) => {
        e.preventDefault();
        const input = body.querySelector(`#${b.dataset.paste}`);
        let text = '';
        if (api.readClipboard) text = (await api.readClipboard()) || '';
        else
          try {
            text = await navigator.clipboard.readText();
          } catch {}
        input.value = text.trim();
        input.focus();
      })
    );
    body.querySelectorAll('[data-eye]').forEach((b) =>
      b.addEventListener('click', (e) => {
        e.preventDefault();
        const input = body.querySelector(`#${b.dataset.eye}`);
        input.type = input.type === 'password' ? 'text' : 'password';
        b.textContent = input.type === 'password' ? 'Ver' : 'Ocultar';
      })
    );
    const s = body.querySelector('[data-save]');
    if (s) s.addEventListener('click', save);
    const a = body.querySelector('[data-auth]');
    if (a)
      a.addEventListener('click', async () => {
        const st = await call('discordAuthorize');
        if (st) {
          discordState = st;
          render();
        }
      });
  }

  async function save() {
    if (busy) return;
    const btn = body.querySelector('[data-save]');
    busy = true;
    if (btn) {
      btn.disabled = true;
      btn.classList.add('wait');
    }
    try {
      if (tab === 'steam') {
        const key = body.querySelector('#su-steam-key').value;
        if (!key.trim() && info.steam && info.steam.hasKey) {
          lastResult.steam = { ok: true, text: 'Tu clave ya estaba guardada. Pega otra si quieres cambiarla.' };
        } else {
          const r = (await call('saveSteamKey', key)) || { ok: false, message: 'No se pudo guardar.' };
          lastResult.steam = r.ok
            ? { ok: true, text: r.name ? `¡Listo! Conectado como ${r.name}. Tus logros se cargan en unos segundos.` : '¡Listo! La clave funciona y quedó guardada.', warning: r.warning }
            : { ok: false, text: r.message };
          if (r.ok) info = (await call('getSetup')) || info;
        }
      } else {
        const id = body.querySelector('#su-dc-id').value;
        const secret = body.querySelector('#su-dc-secret').value;
        const r = (await call('saveDiscord', { id, secret })) || { ok: false, message: 'No se pudo guardar.' };
        lastResult.discord = r.ok ? { ok: true, text: 'Datos guardados. Si Discord muestra una ventana, presiona Autorizar.' } : { ok: false, text: r.message };
        if (r.state) discordState = r.state;
        if (r.ok) info = (await call('getSetup')) || info;
      }
    } finally {
      busy = false;
      render();
    }
  }

  // Estado de Discord en vivo (conectando, autorizar, listo)
  if (api.onDiscord)
    api.onDiscord((s) => {
      if (!open) return;
      const before = discordState && discordState.status;
      discordState = s;
      if (s.status === 'ok' && before !== 'ok' && tab === 'discord') lastResult.discord = { ok: true, text: '¡Listo! Discord quedó conectado.' };
      if (tab === 'discord') {
        // no se pierde lo que estabas escribiendo
        const id = body.querySelector('#su-dc-id');
        const sec = body.querySelector('#su-dc-secret');
        const keep = id && { id: id.value, sec: sec.value, focus: document.activeElement && document.activeElement.id };
        render();
        if (keep) {
          body.querySelector('#su-dc-id').value = keep.id;
          body.querySelector('#su-dc-secret').value = keep.sec;
          if (keep.focus) {
            const f = body.querySelector(`#${keep.focus}`);
            if (f) f.focus();
          }
        }
      }
    });

  if (api.onSetup) api.onSetup((which) => show(which));
  window.NostalHubSetup = { open: show, close: hide };
})();
