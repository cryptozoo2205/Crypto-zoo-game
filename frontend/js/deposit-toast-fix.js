(function () {
  if (window.__czDepositToastFixLoaded) return;
  window.__czDepositToastFixLoaded = true;

  function showNiceToast(message) {
    try {
      if (window.CryptoZoo?.ui?.showToast) {
        window.CryptoZoo.ui.showToast(message);
        return;
      }
    } catch (e) {}

    let el = document.getElementById('czDepositNiceToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'czDepositNiceToast';
      el.style.position = 'fixed';
      el.style.left = '50%';
      el.style.bottom = '110px';
      el.style.transform = 'translateX(-50%)';
      el.style.background = 'rgba(8,15,35,.96)';
      el.style.color = '#fff';
      el.style.padding = '14px 18px';
      el.style.borderRadius = '14px';
      el.style.fontWeight = '700';
      el.style.fontSize = '15px';
      el.style.zIndex = '99999';
      el.style.boxShadow = '0 8px 25px rgba(0,0,0,.35)';
      document.body.appendChild(el);
    }

    el.textContent = message;
    el.style.display = 'block';

    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => {
      el.style.display = 'none';
    }, 2200);
  }

  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const res = await origFetch.apply(this, args);

    try {
      const url = String(args[0] || '');
      if (!url.includes('/api/deposit/create')) return res;

      const data = await res.clone().json().catch(() => null);
      const err = String(data?.error || '');

      if (/active pending deposit/i.test(err)) {
        showNiceToast('Masz już aktywny depozyt');
      }
    } catch (e) {}

    return res;
  };
})();
