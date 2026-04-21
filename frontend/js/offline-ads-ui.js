window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offlineAdsUI = {
    maxSlots: 6,

    getHoursPerSlot() {
        return Math.max(0.01, Number(CryptoZoo.offlineAds?.HOURS_PER_AD) || 0.5);
    },

    getCurrentHours() {
        return Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getCurrentHours?.() || 0)
        );
    },

    getSlotsUsed() {
        const currentHours = this.getCurrentHours();
        const hoursPerSlot = this.getHoursPerSlot();

        if (currentHours <= 0 || hoursPerSlot <= 0) {
            return 0;
        }

        const slots = Math.ceil(currentHours / hoursPerSlot);
        return Math.max(0, Math.min(this.maxSlots, slots));
    },

    getSlotsLeft() {
        return Math.max(0, this.maxSlots - this.getSlotsUsed());
    },

    getNextResetSeconds() {
        const ts = Number(CryptoZoo.offlineAds?.getNextResetAt?.() || 0);
        if (!ts) return 0;

        const left = Math.floor((ts - Date.now()) / 1000);
        return Math.max(0, left);
    },

    formatShort(sec) {
        sec = Number(sec || 0);

        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;

        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m`;
        return `${s}s`;
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

        const canWatch = !!CryptoZoo.offlineAds?.canWatchAd?.();
        const left = this.getSlotsLeft();

        btn.disabled = !canWatch || left <= 0;
        btn.innerHTML = (!canWatch || left <= 0)
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
                            : (nextReset > 0 ? `Reset: ${this.formatShort(nextReset)}` : `Gotowe`)
                    }
                </div>
            </div>
        `;

        this.updateButton();

        const btn = document.getElementById("watchOfflineAdBtn");

        if (btn) {
            btn.onclick = () => {
                CryptoZoo.ads?.showRewardedAd?.();
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