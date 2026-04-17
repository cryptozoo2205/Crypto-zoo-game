window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.expeditionRegionsUi = {
    injectedStyles: false,

    getRegions() {
        return [
            {
                id: "jungle",
                name: "Dżungla",
                minLevel: 1,
                maxLevel: 48,
                locked: false,
                bgClass: "exp-region-bg-jungle"
            },
            {
                id: "desert",
                name: "Pustynia",
                minLevel: 49,
                maxLevel: null,
                locked: true,
                bgClass: "exp-region-bg-desert"
            }
        ];
    },

    getRegionExpeditions(regionId) {
        const all = Array.isArray(CryptoZoo.config?.expeditions)
            ? CryptoZoo.config.expeditions
            : [];

        return all.filter((expedition) => String(expedition.regionId || "") === String(regionId || ""));
    },

    injectStyles() {
        if (this.injectedStyles || document.getElementById("expeditionRegionsUiStyles")) {
            this.injectedStyles = true;
            return;
        }

        const style = document.createElement("style");
        style.id = "expeditionRegionsUiStyles";
        style.textContent = `
            .exp-region-select-wrap {
                display: flex;
                flex-direction: column;
                gap: 16px;
                margin-top: 14px;
            }

            .exp-region-card {
                position: relative;
                overflow: hidden;
                border-radius: 24px;
                min-height: 136px;
                padding: 20px 22px;
                display: flex;
                align-items: flex-end;
                border: 1px solid rgba(255,255,255,0.12);
                box-shadow:
                    0 18px 36px rgba(0,0,0,0.28),
                    inset 0 1px 0 rgba(255,255,255,0.06);
                cursor: pointer;
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                isolation: isolate;
                transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
            }

            .exp-region-card:active {
                transform: scale(0.992);
            }

            .exp-region-card::before {
                content: "";
                position: absolute;
                inset: 0;
                z-index: 0;
                background:
                    linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.00) 26%),
                    linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.38) 100%);
            }

            .exp-region-card::after {
                content: "";
                position: absolute;
                inset: 0;
                z-index: 1;
                pointer-events: none;
                opacity: 1;
            }

            .exp-region-card.exp-region-locked {
                cursor: default;
            }

            .exp-region-bg-jungle {
                background:
                    linear-gradient(135deg, rgba(8,22,14,0.92) 0%, rgba(14,39,23,0.96) 100%);
                border-color: rgba(127, 255, 168, 0.14);
                box-shadow:
                    0 18px 36px rgba(0,0,0,0.30),
                    0 0 0 1px rgba(90, 180, 110, 0.08),
                    inset 0 1px 0 rgba(255,255,255,0.06);
            }

            .exp-region-bg-jungle::after {
                background:
                    radial-gradient(circle at 18% 18%, rgba(255,226,137,0.16), transparent 17%),
                    radial-gradient(circle at 82% 24%, rgba(103,255,172,0.10), transparent 18%),
                    radial-gradient(circle at 50% 55%, rgba(255,216,120,0.10), transparent 16%),
                    linear-gradient(115deg, transparent 0%, rgba(92, 168, 78, 0.16) 24%, transparent 46%),
                    linear-gradient(65deg, transparent 6%, rgba(61, 114, 54, 0.18) 28%, transparent 56%),
                    repeating-linear-gradient(
                        118deg,
                        rgba(0,0,0,0.00) 0px,
                        rgba(0,0,0,0.00) 22px,
                        rgba(70, 132, 60, 0.14) 22px,
                        rgba(70, 132, 60, 0.14) 36px
                    ),
                    repeating-linear-gradient(
                        62deg,
                        rgba(0,0,0,0.00) 0px,
                        rgba(0,0,0,0.00) 18px,
                        rgba(38, 82, 35, 0.18) 18px,
                        rgba(38, 82, 35, 0.18) 32px
                    ),
                    linear-gradient(90deg,
                        rgba(255,214,95,0.00) 0%,
                        rgba(255,219,104,0.14) 5%,
                        rgba(255,221,120,0.32) 7%,
                        rgba(255,228,145,0.12) 8.5%,
                        rgba(255,214,95,0.00) 12%,
                        rgba(255,214,95,0.00) 88%,
                        rgba(255,219,104,0.14) 91.5%,
                        rgba(255,221,120,0.32) 93%,
                        rgba(255,228,145,0.12) 95%,
                        rgba(255,214,95,0.00) 100%
                    ),
                    linear-gradient(180deg,
                        rgba(255,214,95,0.00) 0%,
                        rgba(255,219,104,0.14) 7%,
                        rgba(255,221,120,0.32) 9%,
                        rgba(255,228,145,0.12) 11%,
                        rgba(255,214,95,0.00) 14%,
                        rgba(255,214,95,0.00) 86%,
                        rgba(255,219,104,0.14) 89%,
                        rgba(255,221,120,0.32) 91%,
                        rgba(255,228,145,0.12) 93%,
                        rgba(255,214,95,0.00) 100%
                    );
                box-shadow:
                    inset 0 0 0 1px rgba(255,220,118,0.16),
                    inset 0 0 24px rgba(255,213,92,0.05);
            }

            .exp-region-bg-desert {
                background:
                    linear-gradient(135deg, rgba(30,18,10,0.94) 0%, rgba(56,33,12,0.97) 100%);
                border-color: rgba(255, 206, 127, 0.14);
                box-shadow:
                    0 18px 36px rgba(0,0,0,0.30),
                    0 0 0 1px rgba(170, 112, 53, 0.08),
                    inset 0 1px 0 rgba(255,255,255,0.05);
            }

            .exp-region-bg-desert::after {
                background:
                    radial-gradient(circle at 18% 18%, rgba(255,221,159,0.13), transparent 18%),
                    radial-gradient(circle at 82% 22%, rgba(255,242,202,0.08), transparent 19%),
                    linear-gradient(160deg, transparent 0%, rgba(193, 129, 46, 0.14) 30%, transparent 55%),
                    repeating-linear-gradient(
                        -18deg,
                        rgba(0,0,0,0.00) 0px,
                        rgba(0,0,0,0.00) 20px,
                        rgba(144, 94, 34, 0.14) 20px,
                        rgba(144, 94, 34, 0.14) 34px
                    ),
                    repeating-linear-gradient(
                        14deg,
                        rgba(0,0,0,0.00) 0px,
                        rgba(0,0,0,0.00) 28px,
                        rgba(109, 71, 28, 0.10) 28px,
                        rgba(109, 71, 28, 0.10) 42px
                    ),
                    linear-gradient(90deg,
                        rgba(255,204,122,0.00) 0%,
                        rgba(255,205,128,0.10) 5%,
                        rgba(255,194,98,0.18) 7%,
                        rgba(255,222,170,0.08) 8.5%,
                        rgba(255,204,122,0.00) 12%,
                        rgba(255,204,122,0.00) 88%,
                        rgba(255,205,128,0.10) 91.5%,
                        rgba(255,194,98,0.18) 93%,
                        rgba(255,222,170,0.08) 95%,
                        rgba(255,204,122,0.00) 100%
                    ),
                    linear-gradient(180deg,
                        rgba(255,204,122,0.00) 0%,
                        rgba(255,205,128,0.10) 7%,
                        rgba(255,194,98,0.18) 9%,
                        rgba(255,222,170,0.08) 11%,
                        rgba(255,204,122,0.00) 14%,
                        rgba(255,204,122,0.00) 86%,
                        rgba(255,205,128,0.10) 89%,
                        rgba(255,194,98,0.18) 91%,
                        rgba(255,222,170,0.08) 93%,
                        rgba(255,204,122,0.00) 100%
                    );
                box-shadow:
                    inset 0 0 0 1px rgba(255,213,144,0.10),
                    inset 0 0 24px rgba(255,176,76,0.04);
            }

            .exp-region-content {
                position: relative;
                z-index: 2;
                display: flex;
                flex-direction: column;
                gap: 7px;
                width: 100%;
            }

            .exp-region-title {
                font-size: 24px;
                line-height: 1;
                font-weight: 900;
                letter-spacing: 0.01em;
                color: #ffffff;
                text-shadow:
                    0 2px 10px rgba(0,0,0,0.72),
                    0 1px 0 rgba(255,255,255,0.03);
            }

            .exp-region-subtitle {
                font-size: 13px;
                line-height: 1.15;
                font-weight: 800;
                color: rgba(255,255,255,0.86);
                text-shadow: 0 2px 8px rgba(0,0,0,0.66);
            }

            .exp-region-lock {
                position: absolute;
                inset: 0;
                z-index: 3;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
            }

            .exp-region-lock-badge {
                width: 72px;
                height: 72px;
                border-radius: 999px;
                display: flex;
                align-items: center;
                justify-content: center;
                background:
                    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.14), transparent 35%),
                    rgba(0,0,0,0.44);
                border: 1px solid rgba(255,255,255,0.18);
                color: #fff;
                font-size: 30px;
                box-shadow:
                    0 10px 24px rgba(0,0,0,0.28),
                    inset 0 1px 0 rgba(255,255,255,0.08);
                backdrop-filter: blur(2px);
            }

            .exp-region-expeditions-wrap {
                margin-top: 14px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .exp-region-expeditions-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                padding: 10px 12px;
                border-radius: 14px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.08);
            }

            .exp-region-expeditions-title {
                font-size: 14px;
                font-weight: 900;
                color: #fff;
            }

            .exp-region-back-btn {
                border: 0;
                border-radius: 12px;
                padding: 8px 12px;
                font-size: 12px;
                font-weight: 800;
                cursor: pointer;
            }
        `;

        document.head.appendChild(style);
        this.injectedStyles = true;
    },

    getRegionsMount() {
        return document.getElementById("expeditionRegionsMount");
    },

    getSelectedRegionId() {
        return String(CryptoZoo.state?.selectedExpeditionRegion || "");
    },

    setSelectedRegionId(regionId) {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.selectedExpeditionRegion = String(regionId || "");
    },

    clearSelectedRegionId() {
        this.setSelectedRegionId("");
    },

    renderRegionsList() {
        const mount = this.getRegionsMount();
        if (!mount) return;

        const regions = this.getRegions();

        mount.innerHTML = `
            <div class="exp-region-select-wrap">
                ${regions.map((region) => {
                    const isLocked = Boolean(region.locked);
                    const subtitle = isLocked
                        ? `Od poziomu ${region.minLevel}`
                        : `Region dostępny • poziomy ${region.minLevel}-${region.maxLevel}`;

                    return `
                        <div
                            class="exp-region-card ${region.bgClass} ${isLocked ? "exp-region-locked" : ""}"
                            data-exp-region-id="${region.id}"
                        >
                            <div class="exp-region-content">
                                <div class="exp-region-title">${region.name}</div>
                                <div class="exp-region-subtitle">${subtitle}</div>
                            </div>
                            ${isLocked ? `
                                <div class="exp-region-lock">
                                    <div class="exp-region-lock-badge">🔒</div>
                                </div>
                            ` : ""}
                        </div>
                    `;
                }).join("")}
            </div>
        `;

        regions.forEach((region) => {
            if (region.locked) return;

            const card = mount.querySelector(`[data-exp-region-id="${region.id}"]`);
            if (!card) return;

            card.onclick = () => {
                this.setSelectedRegionId(region.id);
                this.render();
            };
        });
    },

    renderSelectedRegion(regionId) {
        const mount = this.getRegionsMount();
        if (!mount) return;

        const region = this.getRegions().find((r) => r.id === regionId);

        if (!region) {
            this.clearSelectedRegionId();
            this.renderRegionsList();
            return;
        }

        const expeditions = this.getRegionExpeditions(regionId);

        mount.innerHTML = `
            <div class="exp-region-expeditions-wrap">
                <div class="exp-region-expeditions-head">
                    <div class="exp-region-expeditions-title">${region.name}</div>
                    <button id="expRegionBackBtn" class="exp-region-back-btn" type="button">← Wróć</button>
                </div>
                <div id="expRegionExpeditionsList"></div>
            </div>
        `;

        const backBtn = document.getElementById("expRegionBackBtn");

        if (backBtn) {
            backBtn.onclick = () => {
                this.clearSelectedRegionId();
                this.render();
            };
        }

        if (CryptoZoo.ui?.renderExpeditionCardsIntoMount) {
            CryptoZoo.ui.renderExpeditionCardsIntoMount("expRegionExpeditionsList", expeditions);
            return;
        }

        const list = document.getElementById("expRegionExpeditionsList");

        if (list) {
            list.innerHTML = expeditions.length
                ? expeditions.map((expedition) => `
                    <div class="shop-card">
                        <div class="shop-title">
                            ${CryptoZoo.expeditions?.getExpeditionDisplayName?.(expedition) ||
                            expedition.nameEn ||
                            expedition.name ||
                            "Expedition"}
                        </div>
                    </div>
                `).join("")
                : `<div class="shop-card">Brak ekspedycji w tym regionie</div>`;
        }
    },

    render() {
        this.injectStyles();

        const mount = this.getRegionsMount();
        if (!mount) return;

        const selectedRegionId = this.getSelectedRegionId();

        if (!selectedRegionId) {
            this.renderRegionsList();
            return;
        }

        this.renderSelectedRegion(selectedRegionId);
    }
};