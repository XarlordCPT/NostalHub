/* Ajustes desde el menú principal (sin entrar a una consola). Las opciones son las mismas de siempre: vienen de
   menuSections() de main.js (api.getMenu / api.runMenu). Cada estilo del menú le da su aspecto con una clase
   (look-<estilo>) y variables CSS en renderer/inicio/ajustes.css.
   NostalHubHomeSettings.open({ api, toast, look, onClose }) · close() · isOpen() · setLook(look) */
(() => {
  const U = window.NostalHubUtil;
  const esc = U.escapeHtml;
  const HIDE = new Set(['consoles']); // "Cambiar de consola" no tiene sentido aquí: ya estás en el selector
  const TABS = new Set(['panel']); // estilos con las secciones como pestañas arriba (← → cambian de sección)

  // ask: la opción que espera un segundo Enter (Salir). pending: { id, value } elegido sin aplicar (confirmChange)
  let st = null; // { el, api, toast, onClose, model, sec, opt, area: 'nav' | 'opts', ask, pending }

  const sections = () => (st.model || []).map((s) => ({ ...s, items: s.items.filter((it) => !HIDE.has(it.id)) })).filter((s) => s.items.length);

  async function open({ api, toast = () => {}, look = 'estanteria', onClose } = {}) {
    if (st) return;
    const host = document.getElementById('selector');
    const el = document.createElement('div');
    el.className = `home-cfg look-${look}`;
    el.innerHTML = `<div class="hc-veil"></div>
      <section class="hc-panel" role="dialog" aria-label="Ajustes">
        <nav class="hc-nav"><h2>Ajustes</h2><div class="hc-secs"></div><div class="hc-keys">↑ ↓ elegir · Enter · Esc volver</div></nav>
        <div class="hc-body"><h3 class="hc-title"></h3><div class="hc-opts"></div><p class="hc-desc"></p></div>
      </section>`;
    host.appendChild(el);
    st = { el, api, toast, onClose, look, model: [], sec: 0, opt: 0, area: 'nav', ask: null, pending: null };
    el.querySelector('.hc-veil').addEventListener('click', close);
    window.addEventListener('keydown', onKey, true);
    st.model = (api.getMenu && (await api.getMenu())) || [];
    if (!st) return;
    paint();
  }

  const tabs = () => !!st && TABS.has(st.look);

  function setLook(look) {
    if (!st) return;
    st.look = look;
    st.el.className = `home-cfg look-${look}`;
    paint();
  }

  async function close() {
    if (!st || st.closing) return;
    const s = st;
    s.closing = true;
    window.removeEventListener('keydown', onKey, true);
    s.el.classList.add('leave');
    await U.wait(200);
    s.el.remove();
    if (st === s) st = null;
    if (s.onClose) s.onClose();
  }

  function paint() {
    const secs = sections();
    st.sec = Math.max(0, Math.min(secs.length - 1, st.sec));
    const sec = secs[st.sec];
    st.el.querySelector('.hc-keys').textContent = tabs() ? '← → secciones · ↓ opciones · Esc volver' : '↑ ↓ elegir · Enter · Esc volver';
    const nav = st.el.querySelector('.hc-secs');
    nav.innerHTML = secs.map((s, i) => `<button class="hc-sec${i === st.sec ? ' on' : ''}" data-s="${i}">${esc(s.short || s.title)}</button>`).join('');
    nav.querySelectorAll('[data-s]').forEach((b) =>
      b.addEventListener('click', () => {
        st.sec = Number(b.dataset.s);
        st.opt = 0;
        st.area = 'nav';
        st.ask = null;
        st.pending = null;
        paint();
      })
    );
    if (!sec) return;
    st.el.querySelector('.hc-title').textContent = sec.title;
    st.opt = Math.max(0, Math.min(sec.items.length - 1, st.opt));
    const opts = st.el.querySelector('.hc-opts');
    opts.innerHTML = sec.items.map((it, i) => rowHtml(it, i)).join('');
    opts.querySelectorAll('[data-i]').forEach((r) => {
      const i = Number(r.dataset.i);
      r.addEventListener('mouseenter', () => {
        if (st.area === 'opts' && st.opt === i) return;
        st.area = 'opts';
        st.opt = i;
        if (!clearTemp()) focus();
      });
      r.addEventListener('click', (e) => {
        st.area = 'opts';
        st.opt = i;
        const arrow = e.target.closest('[data-d]');
        if (arrow) return change(sec.items[i], Number(arrow.dataset.d));
        pick(sec.items[i]);
      });
    });
    focus();
  }

  function rowHtml(it, i) {
    let right = '';
    if (it.type === 'toggle') right = `<span class="hc-tg${it.value ? ' on' : ''}"></span>`;
    else if (it.type === 'choice') {
      const pend = pendingOf(it);
      const shown = pend ? { ...it, value: pend.value } : it;
      right = `<span class="hc-val"><i data-d="-1">‹</i><b>${esc(U.optionValueText(shown))}</b><i data-d="1">›</i></span>`;
    }
    else right = `<span class="hc-go">${st.ask === it.id ? 'Enter otra vez para confirmar' : '›'}</span>`;
    const label = st.ask === it.id ? `¿${it.label}?` : it.label;
    return `<button class="hc-opt${it.type === 'choice' ? ' choice' : ''}${st.ask === it.id ? ' ask' : ''}${pendingOf(it) ? ' pending' : ''}" data-i="${i}"><span class="hc-l">${esc(label)}</span>${right}</button>`;
  }

  // Marca lo elegido (la sección o la opción) y muestra la descripción
  function focus() {
    const secs = sections();
    const sec = secs[st.sec];
    st.el.querySelectorAll('.hc-sec').forEach((b) => b.classList.toggle('kf', st.area === 'nav' && Number(b.dataset.s) === st.sec));
    let cur = null;
    st.el.querySelectorAll('.hc-opt').forEach((r) => {
      const on = st.area === 'opts' && Number(r.dataset.i) === st.opt;
      r.classList.toggle('kf', on);
      if (on) cur = r;
    });
    if (cur) cur.scrollIntoView({ block: 'nearest' });
    const it = st.area === 'opts' && sec ? sec.items[st.opt] : null;
    const pend = it && pendingOf(it);
    st.el.querySelector('.hc-desc').textContent = pend ? `Enter: cambiar a ${U.optionValueText({ ...it, value: pend.value })}. Se cierran los Ajustes para cambiarlo. Esc: dejarlo como estaba.` : it ? it.desc || '' : '';
    st.el.classList.toggle('in-opts', st.area === 'opts');
  }

  async function run(id, value) {
    st.model = (await st.api.runMenu(id, value)) || st.model;
    if (st && !st.closing) paint();
  }

  // ← → en una opción con varias: la anterior o la siguiente
  // Las que cambian todo el menú (confirmChange, el estilo del menú principal) solo se eligen: se aplican con Enter
  function change(it, dir) {
    if (!it || it.type !== 'choice') return;
    if (it.confirmChange) {
      const from = pendingOf(it) ? st.pending.value : it.value;
      const v = U.optionNextValue({ ...it, value: from }, dir);
      st.pending = v === undefined || String(v) === String(it.value) ? null : { id: it.id, value: v };
      return paint();
    }
    const v = U.optionNextValue(it, dir);
    if (v !== undefined) run(it.id, v);
  }
  const pendingOf = (it) => (st.pending && st.pending.id === it.id ? st.pending : null);
  // Quita una confirmación a medias (Salir o un cambio sin aplicar). true si había una
  function clearTemp() {
    if (!st.ask && !st.pending) return false;
    st.ask = null;
    st.pending = null;
    paint();
    return true;
  }

  async function pick(it) {
    if (!it) return;
    if (it.type === 'toggle') return run(it.id, !it.value);
    if (it.type === 'choice') {
      const pend = pendingOf(it);
      if (!pend) return change(it, 1);
      // Aplicar: primero se cierra el panel y después cambia el menú (así no cambia por detrás del panel)
      const api = st.api;
      await close();
      return api.runMenu(it.id, pend.value);
    }
    if (it.confirm && st.ask !== it.id) {
      st.ask = it.id; // "Salir de NostalHub": se confirma con un segundo Enter
      return paint();
    }
    st.ask = null;
    if (it.closes) {
      // Las que abren otra pantalla (Resumen, Conectar…, Recargar): primero se cierra el panel
      const api = st.api;
      await close();
      return api.runMenu(it.id);
    }
    if (/^open-|^devtools$/.test(it.id)) st.toast('Se abrió en Windows');
    run(it.id);
  }

  function onKey(e) {
    if (!st || st.closing) return;
    const k = e.key;
    e.stopImmediatePropagation();
    if (k === 'Tab') return e.preventDefault();
    const secs = sections();
    const sec = secs[st.sec];
    const it = sec && sec.items[st.opt];
    // Con pestañas (Panel): ← → cambian de sección y ↓ entra a las opciones. En lista: ↑ ↓ y →
    const nextSec = tabs() ? ['ArrowRight', 'ArrowLeft'] : ['ArrowDown', 'ArrowUp'];
    const enter = tabs() ? 'ArrowDown' : 'ArrowRight';
    if (st.area === 'nav') {
      if (nextSec.includes(k)) {
        st.sec = (st.sec + (k === nextSec[0] ? 1 : -1) + secs.length) % secs.length;
        st.opt = 0;
        paint();
      } else if (k === enter || k === 'Enter' || k === ' ') {
        st.area = 'opts';
        focus();
      } else if (k === 'Escape' || k === 'Backspace' || k === 'a' || k === 'A') close();
      if (k === ' ' || k === 'Enter') e.preventDefault();
      return;
    }
    if (k === 'ArrowUp' && tabs() && st.opt === 0) return back(); // de la primera opción, arriba a las pestañas
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      if (!sec) return;
      st.opt = (st.opt + (k === 'ArrowDown' ? 1 : -1) + sec.items.length) % sec.items.length;
      if (!clearTemp()) focus();
    } else if (k === 'ArrowLeft' || k === 'ArrowRight') {
      if (it && it.type === 'choice') change(it, k === 'ArrowRight' ? 1 : -1);
      else if (k === 'ArrowLeft' && !tabs()) back();
    } else if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      pick(it);
    } else if (k === 'Escape' || k === 'Backspace') back();
    else if (k === 'a' || k === 'A') close();
  }
  function back() {
    st.area = 'nav';
    if (!clearTemp()) focus();
  }

  window.NostalHubHomeSettings = { open, close, setLook, isOpen: () => !!st };
})();
