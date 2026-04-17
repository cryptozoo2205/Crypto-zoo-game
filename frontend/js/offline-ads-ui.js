window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offlineAdsUI = {
    maxSlots: 6,

    getSlotsUsed() {
        const used = Number(CryptoZoo.state?.offlineAdsUsed || 0);
        return Math.max(0, Math.min(this.maxSlots, used));
    },

    getSlotsLeft() {
        return this.maxSlots - this.getSlotsUsed();
    },

    getNextResetSeconds() {
        const ts = Number(CryptoZoo.state?.offlineAdsResetAt || 0);
        if (!ts) return 0;

        const left = Math.floor((ts - Date.now()) / 1000);
        return Math.max(0, left);
    },

    formatShort(sec) {
        sec = Number(sec || 0);

        const m = Math.floor(sec / 60);
        const s = sec % 60;

        if (m <= 0) return `${s}s`;
        return `${m}m`;
    },

    renderBars() {
        const used = this.getSlotsUsed();
        let html = "";

        for (let i = 0; i < this.maxSlots; i++) {
            const active = i < used;

            html += `
                <div class="offline-bar ${active ? "active" : ""}"></div>
            `;
        }

        return html;
    },

    updateButton() {
        const btn = document.getElementById("watchOfflineAdBtn");
        if (!btn) return;

        const left = this.getSlotsLeft();

        btn.disabled = left <= 0;
        btn.innerHTML = left <= 0
            ? `⏳ MAX`
            : `📺 +30m`;
    },

    renderCard() {
        const card = document.getElementById("offlineAdsCard");
        if (!card) return;

        const used = this.getSlotsUsed();
        const left = this.getSlotsLeft();
        const nextReset = this.getNextResetSeconds();

        card.innerHTML = `
            <div class="offline-top">
                <div class="offline-title">
                    💤 Zarobki offline
                </div>

                <button id="watchOfflineAdBtn" class="offline-watch-btn">
                    📺 +30m
                </button>
            </div>

            <div class="offline-bars-wrap">
                ${this.renderBars()}
            </div>

            <div class="offline-bottom">
                <div class="offline-count">
                    ${used}/${this.maxSlots} aktywne
                </div>

                <div class="offline-reset">
                    ${
                        left <= 0
                            ? `MAX`
                            : `Reset: ${this.formatShort(nextReset)}`
                    }
                </div>
            </div>
        `;

        this.updateButton();

        const btn = document.getElementById("watchOfflineAdBtn");

        if (btn) {
            btn.onclick = () => {
                CryptoZoo.ads?.showOfflineRewardedAd?.();
            };
        }
    },

    tick() {
        this.renderCard();
    },

    start() {
        this.renderCard();

        if (this._timer) clearInterval(this._timer);

        this._timer = setInterval(() => {
            this.tick();
        }, 1000);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        CryptoZoo.offlineAdsUI.start();
    }, 500);
});