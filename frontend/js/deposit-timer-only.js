(function () {
  const KEY = 'czDepositTimerEnd';
  const COOLDOWN_MS = 2 * 60 * 1000;

  function now() {
    return Date.now();
  }

  function fmt(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function getBtn() {
    return document.getElementById('settingsCreateDepositBtn');
  }

  function getInfo() {
    const btn = getBtn();
    if (!btn) return null;

    let el = document.getElementById('depositTimerInfo');
    if (!el) {
      el = document.createElement('div');
      el.id = 'depositTimerInfo';
      el.style.marginTop = '8px';
      el.style.fontSize = '14px';
      el.style.fontWeight = '700';
      el.style.textAlign = 'center';
      el.style.color = '#ffd54a';
      btn.insertAdjacentElement('afterend', el);
    }
    return el;
  }

  function saveEnd(ts) {
    localStorage.setItem(KEY, String(ts));
  }

  function loadEnd() {
    return Number(localStorage.getItem(KEY) || 0);
  }

  function clearEnd() {
    localStorage.removeItem(KEY);
  }

  function render() {
    const info = getInfo();
    if (!info) return;

    const end = loadEnd();
    const left = end - now();

    if (left > 0) {
      info.textContent = 'Nowy depozyt za ' + fmt(left);
      info.style.display = 'block';
    } else {
      info.textContent = '';
      info.style.display = 'none';
      clearEnd();
    }
  }

  function extractCreatedAt(data) {
    const values = [
      data?.createdAt,
      data?.created_at,
      data?.activeDeposit?.createdAt,
      data?.activeDeposit?.created_at
    ].map(v => Number(v || 0)).filter(v => v > 0);

    return values[0] || 0;
  }

  function setFromCreatedAt(createdAt) {
    if (!createdAt) {
      clearEnd();
      render();
      return;
    }

    const end = createdAt + COOLDOWN_MS;

    if (end > now()) {
      saveEnd(end);
    } else {
      clearEnd();
    }

    render();
  }

  function hookFetch() {
    if (!window.fetch || window.__czDepositTimerHooked) return;
    window.__czDepositTimerHooked = true;

    const origFetch = window.fetch;
    window.fetch = async function (...args) {
      const res = await origFetch.apply(this, args);

      try {
        const url = String(args[0] || '');
        if (!url.includes('/api/deposit/create')) return res;

        const data = await res.clone().json().catch(() => null);
        if (!data || typeof data !== 'object') return res;

        const createdAt = extractCreatedAt(data);

        if (res.ok) {
          setFromCreatedAt(createdAt);
          return res;
        }

        if (/active pending deposit/i.test(String(data.error || ''))) {
          setFromCreatedAt(createdAt);
          return res;
        }
      } catch (e) {}

      return res;
    };
  }

  function boot() {
    hookFetch();
    render();
    setInterval(render, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
