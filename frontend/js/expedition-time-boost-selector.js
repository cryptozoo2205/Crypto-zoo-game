window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.timeBoostSelector = {
    booted: false,
    uiPatched: false,
    expeditionsPatched: false,
    styleInjected: false,
    bootTimer: null,

    init() {
        if (this.booted) return;
        this.booted = true;
        this.injectStyles();
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

    injectStyles() {
        if (this.styleInjected) return;
        if (document.getElementById("timeBoostSelectorStyles")) {
            this.styleInjected = true;
            return;
        }

        const style = document.createElement("style");
        style.id = "timeBoostSelectorStyles";
        style.textContent = `
            .time-boost-selector-wrap {
                margin-top: 12px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .time-boost-selector-title {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                padding: 10px 12px;
                border-radius: 14px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.07);
            }

            .time-boost-selector-title-left {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .time-boost-selector-title-main {
                font-size: 13px;
                font-weight: 900;
                color: rgba(255,255,255,0.96);
                letter-spacing: 0.02em;
            }

            .time-boost-selector-title-sub {
                font-size: 11px;
                font-weight: 700;
                color: rgba(255,255,255,0.66);
            }

            .time-boost-selector-count {
                flex-shrink: 0;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 44px;
                padding: 6px 10px;
                border-radius: 999px;
                background: linear-gradient(135deg, rgba(255,214,102,0.20), rgba(255,180,70,0.12));
                border: 1px solid rgba(255,215,120,0.22);
                color: #ffe7a6;
                font-size: 12px;
                font-weight: 900;
                box-shadow: 0 6px 18px rgba(255, 190, 70, 0.10);
            }

            .time-boost-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 10px;
            }

            .time-boost-tile {
                position: relative;
                overflow: hidden;
                border: 1px solid rgba(255,255,255,0.09);
                border-radius: 18px;
                padding: 14px;
                background:
                    linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025)),
                    radial-gradient(circle at top left, rgba(118, 206, 255, 0.13), transparent 55%),
                    rgba(7, 18, 40, 0.92);
                box-shadow:
                    0 10px 30px rgba(0,0,0,0.22),
                    inset 0 1px 0 rgba(255,255,255,0.04);
                display: flex;
                flex-direction: column;
                gap: 12px;
                transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
            }

            .time-boost-tile::before {
                content: "";
                position: absolute;
                inset: 0;
                pointer-events: none;
                background: linear-gradient(135deg, rgba(255,255,255,0.07), transparent 38%);
            }

            .time-boost-tile:active {
                transform: scale(0.988);
            }

            .time-boost-tile-header {
                position: relative;
                z-index: 1;
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
            }

            .time-boost-tile-left {
                min-width: 0;
                display: flex;
                align-items: flex-start;
                gap: 10px;
            }

            .time-boost-tile-icon {
                width: 42px;
                height: 42px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 14px;
                background: linear-gradient(135deg, rgba(135,220,255,0.22), rgba(110,185,255,0.10));
                border: 1px solid rgba(145,220,255,0.22);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
                font-size: 20px;
            }

            .time-boost-tile-text {
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .time-boost-tile-name {
                font-size: 15px;
                font-weight: 900;
                color: #ffffff;
                line-height: 1.15;
            }

            .time-boost-tile-desc {
                font-size: 12px;
                font-weight: 700;
                color: rgba(255,255,255,0.68);
                line-height: 1.35;
            }

            .time-boost-tile-right {
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 6px;
            }

            .time-boost-tile-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 6px 10px;
                border-radius: 999px;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.09);
                color: rgba(255,255,255,0.90);
                font-size: 11px;
                font-weight: 900;
                white-space: nowrap;
            }

            .time-boost-tile-badge.gold {
                background: linear-gradient(135deg, rgba(255,216,120,0.18), rgba(255,170,70,0.10));
                border-color: rgba(255,216,120,0.18);
                color: #ffe5a1;
            }

            .time-boost-tile-footer {
                position: relative;
                z-index: 1;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
            }

            .time-boost-tile-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .time-boost-chip {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                border-radius: 999px;
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.08);
                color: rgba(255,255,255,0.76);
                font-size: 11px;
                font-weight: 800;
            }

            .time-boost-use-btn {
                flex-shrink: 0;
                min-width: 118px;
                border: 0;
                outline: none;
                cursor: pointer;
                border-radius: 14px;
                padding: 12px 16px;
                font-size: 13px;
                font-weight: 900;
                color: #08202a;
                background: linear-gradient(180deg, #b9f5ff 0%, #89def3 100%);
                box-shadow:
                    0 10px 20px rgba(68, 200, 255, 0.18),
                    inset 0 1px 0 rgba(255,255,255,0.58);
                transition: transform 0.14s ease, opacity 0.14s ease, box-shadow 0.14s ease;
            }

            .time-boost-use-btn:active {
                transform: scale(0.985);
            }

            .time-boost-use-btn:hover {
                box-shadow:
                    0 14px 26px rgba(68, 200, 255, 0.22),
                    inset 0 1px 0 rgba(255,255,255,0.58);
            }

            .time-boost-empty {
                border-radius: 16px;
                padding: 14px;
                text-align: center;
                font-size: 13px;
                font-weight: 800;
                color: rgba(255,255,255,0.68);
                background: rgba(255,255,255,0.04);
                border: 1px dashed rgba(255,255,255,0.08);
            }
        `;

        document.head.appendChild(style);
        this.styleInjected = true;
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

        if (typeof CryptoZoo.expeditions?.getTimeBoostCharges === "function") {
            const charges = CryptoZoo.expeditions.getTimeBoostCharges();
            return Array.isArray(charges) ? charges : [];
        }

        return Array.isArray(CryptoZoo.state?.expeditionStats?.timeBoostCharges)
            ? CryptoZoo.state.expeditionStats.timeBoostCharges
            : [];
    },

    getGroupedCharges() {
        if (typeof CryptoZoo.expeditions?.getTimeBoostChargesGrouped === "function") {
            const grouped = CryptoZoo.expeditions.getTimeBoostChargesGrouped();
            return Array.isArray(grouped)
                ? grouped
                    .map((entry) => ({
                        seconds: Math.max(0, Math.floor(Number(entry?.seconds) || 0)),
                        count: Math.max(0, Math.floor(Number(entry?.count) || 0))
                    }))
                    .filter((entry) => entry.seconds > 0 && entry.count > 0)
                    .sort((a, b) => a.seconds - b.seconds)
                : [];
        }

        const charges = this.getChargesArray();
        const grouped = {};

        charges.forEach((seconds) => {
            const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
            if (safeSeconds > 0) {
                grouped[safeSeconds] = (grouped[safeSeconds] || 0) + 1;
            }
        });

        return Object.keys(grouped)
            .map((seconds) => ({
                seconds: Number(seconds),
                count: grouped[seconds]
            }))
            .filter((entry) => entry.seconds > 0 && entry.count > 0)
            .sort((a, b) => a.seconds - b.seconds);
    },

    getTotalChargesCount() {
        return this.getGroupedCharges().reduce((sum, entry) => {
            return sum + Math.max(0, Number(entry?.count) || 0);
        }, 0);
    },

    getChargeCount(seconds) {
        const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
        if (safeSeconds <= 0) return 0;

        const entry = this.getGroupedCharges().find((item) => {
            return Math.max(0, Math.floor(Number(item?.seconds) || 0)) === safeSeconds;
        });

        return Math.max(0, Number(entry?.count) || 0);
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

    getUseButtonLabel() {
        return "Użyj";
    },

    getSecondsLeftOnActiveExpedition() {
        const expedition = CryptoZoo.state?.expedition;
        if (!expedition) return 0;

        return Math.max(0, Math.ceil(((Number(expedition.endTime) || 0) - Date.now()) / 1000));
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

    async useSpecificTimeBoost(seconds) {
        const expedition = CryptoZoo.state?.expedition;
        const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
        const telegramId = String(CryptoZoo.state?.telegramUser?.id || "").trim();
        const username = String(
            CryptoZoo.state?.telegramUser?.username ||
            CryptoZoo.state?.telegramUser?.first_name ||
            "Gracz"
        ).trim();

        if (!expedition) {
            CryptoZoo.ui?.showToast?.("Brak aktywnej ekspedycji");
            return false;
        }

        if (safeSeconds <= 0) {
            CryptoZoo.ui?.showToast?.("Nieprawidłowe skrócenie czasu");
            return false;
        }

        if (!telegramId) {
            CryptoZoo.ui?.showToast?.("Brak telegramId");
            return false;
        }

        const now = Date.now();
        const endTime = Number(expedition.endTime) || 0;

        if (endTime <= now) {
            CryptoZoo.ui?.showToast?.("Ekspedycja jest już gotowa do odbioru");
            return false;
        }

        try {
            const response = await fetch(`${CryptoZoo.config.apiBase}/expedition/time-boost`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    telegramId,
                    username,
                    seconds: safeSeconds
                })
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result?.ok) {
                CryptoZoo.ui?.showToast?.(
                    result?.error || `HTTP ${response.status} - time boost failed`
                );
                return false;
            }

            if (result.player && CryptoZoo.api?.normalizeState) {
                CryptoZoo.state = CryptoZoo.api.normalizeState(result.player);
            } else {
                if (result.player) {
                    CryptoZoo.state = {
                        ...(CryptoZoo.state || {}),
                        ...result.player
                    };
                }
                if (result.expedition) {
                    CryptoZoo.state = CryptoZoo.state || {};
                    CryptoZoo.state.expedition = result.expedition;
                }
            }

            CryptoZoo.state = CryptoZoo.state || {};
            CryptoZoo.state.lastLogin = Date.now();

            CryptoZoo.audio?.play?.("click");
            CryptoZoo.ui?.showToast?.(`⏩ -${this.getDurationLabel(safeSeconds)}`);

            CryptoZoo.ui?.renderExpeditions?.();
            CryptoZoo.ui?.render?.();

            try {
                CryptoZoo.api?.markDirty?.();
            } catch (_) {}

            return true;
        } catch (error) {
            console.error("useSpecificTimeBoost failed:", error);
            CryptoZoo.ui?.showToast?.("Nie udało się użyć skrócenia czasu");
            return false;
        }
    },

    buildTileHtml(entry) {
        const seconds = Math.max(0, Number(entry?.seconds) || 0);
        const count = Math.max(0, Number(entry?.count) || 0);
        const label = this.getDurationLabel(seconds);
        const secondsLeft = this.getSecondsLeftOnActiveExpedition();
        const effectiveCut = Math.min(seconds, secondsLeft);
        const effectiveLabel = this.getDurationLabel(effectiveCut);
        const willFinish = effectiveCut >= secondsLeft && secondsLeft > 0;

        return `
            <div class="time-boost-tile">
                <div class="time-boost-tile-header">
                    <div class="time-boost-tile-left">
                        <div class="time-boost-tile-icon">⏩</div>

                        <div class="time-boost-tile-text">
                            <div class="time-boost-tile-name">Skrócenie ${label}</div>
                            <div class="time-boost-tile-desc">
                                Skraca aktywną ekspedycję o ${label}
                            </div>
                        </div>
                    </div>

                    <div class="time-boost-tile-right">
                        <div class="time-boost-tile-badge gold">x${CryptoZoo.formatNumber(count)}</div>
                        <div class="time-boost-tile-badge">${label}</div>
                    </div>
                </div>

                <div class="time-boost-tile-footer">
                    <div class="time-boost-tile-meta">
                        <div class="time-boost-chip">⏱ Utnie: ${effectiveLabel}</div>
                        <div class="time-boost-chip">${willFinish ? "🎉 Kończy ekspedycję" : "🧭 Aktywny boost"}</div>
                    </div>

                    <button
                        id="use-expedition-time-boost-${seconds}"
                        data-time-boost-seconds="${seconds}"
                        class="time-boost-use-btn"
                        type="button"
                    >${this.getUseButtonLabel()}</button>
                </div>
            </div>
        `;
    },

    buildButtonsHtml() {
        const grouped = this.getGroupedCharges();

        if (!grouped.length) {
            return `
                <div class="time-boost-selector-wrap">
                    <div class="time-boost-empty">
                        Brak dostępnych skróceń czasu
                    </div>
                </div>
            `;
        }

        return `
            <div class="time-boost-selector-wrap">
                <div class="time-boost-selector-title">
                    <div class="time-boost-selector-title-left">
                        <div class="time-boost-selector-title-main">⏱ Wybierz skrócenie czasu</div>
                        <div class="time-boost-selector-title-sub">Użyj dokładnie tego boosta, którego chcesz</div>
                    </div>

                    <div class="time-boost-selector-count">
                        ${CryptoZoo.formatNumber(this.getTotalChargesCount())}
                    </div>
                </div>

                <div class="time-boost-grid">
                    ${grouped.map((entry) => this.buildTileHtml(entry)).join("")}
                </div>
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

        actionWrap.dataset.mode = "boost-select";
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