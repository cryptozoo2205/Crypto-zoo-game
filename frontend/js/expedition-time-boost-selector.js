window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.timeBoostSelector = {
    booted: false,
    uiPatched: false,
    expeditionsPatched: false,
    bootTimer: null,

    init() {
        if (this.booted) return;
        this.booted = true;
        this.startBootWatcher();
    },

    startBootWatcher() {
        let tries = 0;

        this.bootTimer = setInterval(() => {
            tries += 1;

            const hasUi = !!window.CryptoZoo?.ui;
            const hasExpeditions = !!window.CryptoZoo?.expeditions;

            if (hasUi) {
                this.patchUi();
            }

            if (hasExpeditions) {
                this.patchExpeditions();
            }

            if ((this.uiPatched && this.expeditionsPatched) || tries >= 120) {
                clearInterval(this.bootTimer);
                this.bootTimer = null;
            }
        }, 250);
    },

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.expeditionStats = CryptoZoo.state.expeditionStats || {};
        CryptoZoo.state.expeditionStats.timeBoostCharges =
            Array.isArray(CryptoZoo.state.expeditionStats.timeBoostCharges)
                ? CryptoZoo.state.expeditionStats.timeBoostCharges
                : [];

        CryptoZoo.state.expeditionStats.timeBoostCharges =
            CryptoZoo.state.expeditionStats.timeBoostCharges
                .map((value) => Math.max(0, Math.floor(Number(value) || 0)))
                .filter((value) => value > 0);
    },

    getChargesArray() {
        this.ensureState();
        return CryptoZoo.state.expeditionStats.timeBoostCharges;
    },

    getGroupedCharges() {
        const charges = this.getChargesArray();
        const grouped = {};

        charges.forEach((seconds) => {
            grouped[seconds] = (grouped[seconds] || 0) + 1;
        });

        return Object.keys(grouped)
            .map((seconds) => ({
                seconds: Number(seconds),
                count: grouped[seconds]
            }))
            .filter((entry) => entry.seconds > 0 && entry.count > 0)
            .sort((a, b) => a.seconds - b.seconds);
    },

    getChargeCount(seconds) {
        const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
        if (safeSeconds <= 0) return 0;

        const charges = this.getChargesArray();
        return charges.reduce((sum, value) => {
            return sum + (Number(value) === safeSeconds ? 1 : 0);
        }, 0);
    },

    consumeCharge(seconds) {
        const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
        if (safeSeconds <= 0) return false;

        const charges = this.getChargesArray();
        const index = charges.findIndex((value) => Number(value) === safeSeconds);

        if (index === -1) {
            return false;
        }

        charges.splice(index, 1);
        return true;
    },

    getDurationLabel(seconds) {
        return CryptoZoo.ui?.formatDurationLabel?.(seconds) || `${seconds}s`;
    },

    hasActiveExpedition() {
        return !!CryptoZoo.state?.expedition;
    },

    canUseSpecificTimeBoost(seconds) {
        const expedition = CryptoZoo.state?.expedition;
        if (!expedition) return false;

        const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
        if (safeSeconds <= 0) return false;

        const count = this.getChargeCount(safeSeconds);
        if (count <= 0) return false;

        const endTime = Number(expedition.endTime) || 0;
        return endTime > Date.now();
    },

    useSpecificTimeBoost(seconds) {
        const expedition = CryptoZoo.state?.expedition;
        const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));

        if (!expedition) {
            CryptoZoo.ui?.showToast?.("Brak aktywnej ekspedycji");
            return false;
        }

        if (safeSeconds <= 0) {
            CryptoZoo.ui?.showToast?.("Nieprawidłowe skrócenie czasu");
            return false;
        }

        const now = Date.now();
        const endTime = Number(expedition.endTime) || 0;

        if (endTime <= now) {
            CryptoZoo.ui?.showToast?.("Ekspedycja jest już gotowa do odbioru");
            return false;
        }

        const consumed = this.consumeCharge(safeSeconds);
        if (!consumed) {
            CryptoZoo.ui?.showToast?.("Nie masz tego skrócenia czasu");
            return false;
        }

        expedition.endTime = Math.max(now, endTime - safeSeconds * 1000);
        expedition.lastTimeBoostUsedAt = now;
        CryptoZoo.state.lastLogin = now;

        if (typeof expedition.duration === "number" && expedition.duration > 0) {
            expedition.duration = Math.max(
                0,
                Math.ceil((Number(expedition.endTime) - now) / 1000)
            );
        }

        CryptoZoo.audio?.play?.("click");
        CryptoZoo.ui?.showToast?.(`⏩ -${this.getDurationLabel(safeSeconds)}`);

        CryptoZoo.ui?.renderExpeditions?.();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        return true;
    },

    buildButtonsHtml() {
        const grouped = this.getGroupedCharges();
        if (!grouped.length) return "";

        return `
            <div class="expedition-time-boost-select" style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
                <div style="font-size:12px; font-weight:800; color:rgba(255,255,255,0.72);">
                    ⏱ Wybierz skrócenie czasu
                </div>
                ${grouped.map((entry) => {
                    const label = this.getDurationLabel(entry.seconds);

                    return `
                        <button
                            id="use-expedition-time-boost-${entry.seconds}"
                            data-time-boost-seconds="${entry.seconds}"
                            type="button"
                        >
                            ⏩ -${label} (${CryptoZoo.formatNumber(entry.count)})
                        </button>
                    `;
                }).join("")}
            </div>
        `;
    },

    bindSelectorButtons() {
        const grouped = this.getGroupedCharges();

        grouped.forEach((entry) => {
            const id = `use-expedition-time-boost-${entry.seconds}`;
            const btn = document.getElementById(id);

            if (!btn || btn.dataset.bound === "1") return;

            btn.dataset.bound = "1";
            btn.onclick = () => {
                this.useSpecificTimeBoost(entry.seconds);
            };
        });
    },

    refreshActiveExpeditionButtons() {
        const expedition = CryptoZoo.state?.expedition;
        if (!expedition) return;

        const actionWrap = document.getElementById("activeExpeditionActionWrap");
        if (!actionWrap) return;

        const now = Date.now();
        const canCollect = (Number(expedition.endTime) || 0) <= now;

        if (canCollect) {
            return;
        }

        const grouped = this.getGroupedCharges();
        if (!grouped.length) {
            return;
        }

        actionWrap.dataset.mode = "boost";
        actionWrap.innerHTML = this.buildButtonsHtml();
        this.bindSelectorButtons();
    },

    patchUi() {
        if (this.uiPatched || !CryptoZoo.ui) return;

        const originalRenderExpeditions = CryptoZoo.ui.renderExpeditions?.bind(CryptoZoo.ui);
        const originalUpdateActiveExpeditionTimerOnly =
            CryptoZoo.ui.updateActiveExpeditionTimerOnly?.bind(CryptoZoo.ui);

        if (typeof originalRenderExpeditions === "function") {
            CryptoZoo.ui.renderExpeditions = (...args) => {
                const result = originalRenderExpeditions(...args);

                try {
                    this.refreshActiveExpeditionButtons();
                } catch (error) {
                    console.error("timeBoostSelector renderExpeditions patch error:", error);
                }

                return result;
            };
        }

        if (typeof originalUpdateActiveExpeditionTimerOnly === "function") {
            CryptoZoo.ui.updateActiveExpeditionTimerOnly = (...args) => {
                const result = originalUpdateActiveExpeditionTimerOnly(...args);

                try {
                    const expedition = CryptoZoo.state?.expedition;
                    if (!expedition) return result;

                    const now = Date.now();
                    const canCollect = (Number(expedition.endTime) || 0) <= now;

                    if (!canCollect) {
                        this.refreshActiveExpeditionButtons();
                    }
                } catch (error) {
                    console.error("timeBoostSelector updateActiveExpeditionTimerOnly patch error:", error);
                }

                return result;
            };
        }

        this.uiPatched = true;
    },

    patchExpeditions() {
        if (this.expeditionsPatched || !CryptoZoo.expeditions) return;

        if (typeof CryptoZoo.expeditions.getTimeBoostChargesGrouped !== "function") {
            CryptoZoo.expeditions.getTimeBoostChargesGrouped = () => {
                const grouped = this.getGroupedCharges();
                const result = {};

                grouped.forEach((entry) => {
                    result[entry.seconds] = entry.count;
                });

                return result;
            };
        }

        if (typeof CryptoZoo.expeditions.getTimeBoostChargeCountBySeconds !== "function") {
            CryptoZoo.expeditions.getTimeBoostChargeCountBySeconds = (seconds) => {
                return this.getChargeCount(seconds);
            };
        }

        if (typeof CryptoZoo.expeditions.useSpecificTimeBoost !== "function") {
            CryptoZoo.expeditions.useSpecificTimeBoost = (seconds) => {
                return this.useSpecificTimeBoost(seconds);
            };
        }

        this.expeditionsPatched = true;
    }
};

CryptoZoo.timeBoostSelector.init();