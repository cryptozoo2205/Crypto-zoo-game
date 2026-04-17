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
                min-height: 138px;
                padding: 20px 22px;
                display: flex;
                align-items: flex-end;
                border: 1px solid rgba(255,255,255,0.10);
                box-shadow:
                    0 18px 38px rgba(0,0,0,0.30),
                    inset 0 1px 0 rgba(255,255,255,0.05);
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
                    linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 24%),
                    linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.42) 100%);
            }

            .exp-region-card::after {
                content: "";
                position: absolute;
                inset: 0;
                z-index: 1;
                pointer-events: none;
            }

            .exp-region-card.exp-region-locked {
                cursor: default;
            }

            .exp-region-bg-jungle {
                background:
                    linear-gradient(135deg, rgba(8,24,14,0.97) 0%, rgba(11,39,21,0.98) 100%);
                border-color: rgba(255, 211, 98, 0.18);
                box-shadow:
                    0 18px 38px rgba(0,0,0,0.30),
                    0 0 0 1px rgba(255, 210, 90, 0.05),
                    inset 0 1px 0 rgba(255,255,255,0.06);
            }

            .exp-region-bg-jungle::after {
                background:
                    radial-gradient(circle at 14% 20%, rgba(255, 226, 136, 0.16), transparent 18%),
                    radial-gradient(circle at 86% 22%, rgba(255, 219, 108, 0.12), transparent 18%),
                    radial-gradient(circle at 50% 58%, rgba(255, 208, 96, 0.08), transparent 14%),
                    linear-gradient(125deg, transparent 0%, rgba(106, 170, 78, 0.18) 24%, transparent 45%),
                    linear-gradient(60deg, transparent 5%, rgba(61, 117, 52, 0.18) 28%, transparent 54%),
                    repeating-linear-gradient(
                        120deg,
                        rgba(0,0,0,0.00) 0px,
                        rgba(0,0,0,0.00) 18px,
                        rgba(75, 134, 60, 0.12) 18px,
                        rgba(75, 134, 60, 0.12) 34px
                    ),
                    repeating-linear-gradient(
                        60deg,
                        rgba(0,0,0,0.00) 0px,
                        rgba(0,0,0,0.00) 20px,
                        rgba(35, 82, 35, 0.14) 20px,
                        rgba(35, 82, 35, 0.14) 38px
                    ),
                    linear-gradient(90deg,
                        rgba(255,213,95,0.00) 0%,
                        rgba(255,220,110,0.10) 5%,
                        rgba(255,214,96,0.22) 7%,
                        rgba(255,232,155,0.08) 9%,
                        rgba(255,213,95,0.00) 13%,
                        rgba(255,213,95,0.00) 87%,
                        rgba(255,220,110,0.10) 91%,
                        rgba(255,214,96,0.22) 93%,
                        rgba(255,232,155,0.08) 95%,
                        rgba(255,213,95,0.00) 100%
                    ),
                    linear-gradient(180deg,
                        rgba(255,213,95,0.00) 0%,
                        rgba(255,220,110,0.10) 7%,
                        rgba(255,214,96,0.22) 9%,
                        rgba(255,232,155,0.08) 11%,
                        rgba(255,213,95,0.00) 15%,
                        rgba(255,213,95,0.00) 85%,
                        rgba(255,220,110,0.10) 89%,
                        rgba(255,214,96,0.22) 91%,
                        rgba(255,232,155,0.08) 93%,
                        rgba(255,213,95,0.00) 100%
                    );
                box-shadow:
                    inset 0 0 0 1px rgba(255, 220, 118, 0.14),
                    inset 0 0 26px rgba(255, 214, 92, 0.05);
            }

            .exp-region-bg-desert {
                background:
                    linear-gradient(135deg, rgba(31,18,10,0.97) 0%, rgba(58,35,13,0.99) 100%);
                border-color: rgba(255, 211, 98, 0.16);
                box-shadow:
                    0 18px 38px rgba(0,0,0,0.30),
                    0 0 0 1px rgba(255, 210, 90, 0.04),
                    inset 0 1px 0 rgba(255,255,255,0.05);
            }

            .exp-region-bg-desert::after {
                background:
                    radial-gradient(circle at 14% 20%, rgba(255, 223, 158, 0.14), transparent 18%),
                    radial-gradient(circle at 86% 22%, rgba(255, 216, 132, 0.10), transparent 18%),
                    linear-gradient(155deg, transparent 0%, rgba(191, 131, 49, 0.14) 28%, transparent 52%),
                    repeating-linear-gradient(
                        -18deg,
                        rgba(0,0,0,0.00) 0px,
                        rgba(0,0,0,0.00) 18px,
                        rgba(145, 98, 36, 0.12) 18px,
                        rgba(145, 98, 36, 0.12) 34px
                    ),
                    repeating-linear-gradient(
                        14deg,
                        rgba(0,0,0,0.00) 0px,
                        rgba(0,0,0,0.00) 24px,
                        rgba(108, 72, 28, 0.10) 24px,
                        rgba(108, 72, 28, 0.10) 40px
                    ),
                    linear-gradient(90deg,
                        rgba(255,213,95,0.00) 0%,
                        rgba(255,220,110,0.08) 5%,
                        rgba(255,214,96,0.18) 7%,
                        rgba(255,232,155,0.06) 9%,
                        rgba(255,213,95,0.00) 13%,
                        rgba(255,213,95,0.00) 87%,
                        rgba(255,220,110,0.08) 91%,
                        rgba(255,214,96,0.18) 93%,
                        rgba(255,232,155,0.06) 95%,
                        rgba(255,213,95,0.00) 100%
                    ),
                    linear-gradient(180deg,
                        rgba(255,213,95,0.00) 0%,
                        rgba(255,220,110,0.08) 7%,
                        rgba(255,214,96,0.18) 9%,
                        rgba(255,232,155,0.06) 11%,
                        rgba(255,213,95,0.00) 15%,
                        rgba(255,213,95,0.00) 85%,
                        rgba(255,220,110,0.08) 89%,
                        rgba(255,214,96,0.18) 91%,
                        rgba(255,232,155,0.06) 93%,
                        rgba(255,213,95,0.00) 100%
                    );
                box-shadow:
                    inset 0 0 0 1px rgba(255, 220, 118, 0.10),
                    inset 0 0 24px rgba(255, 183, 76, 0.04);
            }

            .exp-region-content {
                position: relative;
                z-index: 2;
                display: flex;
                flex-direction: column;
                gap: 8px;
                width: 100%;
            }

            .exp-region-title {
                font-size: 24px;
                line-height: 1;
                font-weight: 900;
                letter-spacing: 0.01em;
                color: #f7d56b;
                text-shadow:
                    0 1px 0 rgba(255, 242, 184, 0.60),
                    0 2px 0 rgba(204, 146, 28, 0.55),
                    0 4px 12px rgba(0,0,0,0.70);
            }

            .exp-region-subtitle {
                font-size: 13px;
                line-height: 1.15;
                font-weight: 800;
                color: rgba(248, 225, 151, 0.94);
                text-shadow:
                    0 1px 0 rgba(255, 245, 198, 0.32),
                    0 2px 8px rgba(0,0,0,0.66);
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