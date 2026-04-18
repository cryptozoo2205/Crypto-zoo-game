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
                minLevel: 50,
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
                min-height: 132px;
                width: calc(100% - 20px);
                margin: 0 auto;
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
                    linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 26%),
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
                    linear-gradient(135deg, rgba(7,20,12,0.98) 0%, rgba(10,34,20,0.99) 52%, rgba(7,18,11,1) 100%);
                border-color: rgba(255, 211, 98, 0.18);
                box-shadow:
                    0 18px 38px rgba(0,0,0,0.30),
                    0 0 0 1px rgba(255, 210, 90, 0.04),
                    inset 0 1px 0 rgba(255,255,255,0.06);
            }

            .exp-region-bg-jungle::after {
                background:
                    radial-gradient(circle at 14% 20%, rgba(255, 224, 126, 0.13), transparent 18%),
                    radial-gradient(circle at 86% 18%, rgba(255, 224, 126, 0.08), transparent 18%),
                    radial-gradient(circle at 52% 50%, rgba(255, 211, 98, 0.06), transparent 22%),
                    linear-gradient(135deg, transparent 0%, rgba(59, 120, 58, 0.16) 22%, transparent 42%),
                    linear-gradient(45deg, transparent 8%, rgba(39, 88, 42, 0.18) 28%, transparent 56%),
                    repeating-linear-gradient(
                        125deg,
                        rgba(0,0,0,0.00) 0px,
                        rgba(0,0,0,0.00) 26px,
                        rgba(58, 122, 58, 0.08) 26px,
                        rgba(58, 122, 58, 0.08) 46px
                    ),
                    repeating-linear-gradient(
                        55deg,
                        rgba(0,0,0,0.00) 0px,
                        rgba(0,0,0,0.00) 32px,
                        rgba(29, 70, 34, 0.11) 32px,
                        rgba(29, 70, 34, 0.11) 54px
                    ),
                    linear-gradient(90deg,
                        rgba(255,213,95,0.00) 0%,
                        rgba(255,220,110,0.07) 4%,
                        rgba(255,214,96,0.18) 5.8%,
                        rgba(255,232,155,0.05) 7.2%,
                        rgba(255,213,95,0.00) 10.5%,
                        rgba(255,213,95,0.00) 89.5%,
                        rgba(255,220,110,0.07) 92.8%,
                        rgba(255,214,96,0.18) 94.2%,
                        rgba(255,232,155,0.05) 96%,
                        rgba(255,213,95,0.00) 100%
                    ),
                    linear-gradient(180deg,
                        rgba(255,213,95,0.00) 0%,
                        rgba(255,220,110,0.07) 5%,
                        rgba(255,214,96,0.18) 6.8%,
                        rgba(255,232,155,0.05) 8.4%,
                        rgba(255,213,95,0.00) 11.5%,
                        rgba(255,213,95,0.00) 88.5%,
                        rgba(255,220,110,0.07) 91.6%,
                        rgba(255,214,96,0.18) 93.2%,
                        rgba(255,232,155,0.05) 95%,
                        rgba(255,213,95,0.00) 100%
                    );
                box-shadow:
                    inset 0 0 0 1px rgba(255, 220, 118, 0.12),
                    inset 0 0 28px rgba(255, 214, 92, 0.04);
            }

            .exp-region-bg-desert {
                background:
                    linear-gradient(135deg, rgba(28,17,10,0.98) 0%, rgba(55,33,12,0.99) 52%, rgba(27,16,10,1) 100%);
                border-color: rgba(255, 211, 98, 0.16);
                box-shadow:
                    0 18px 38px rgba(0,0,0,0.30),
                    0 0 0 1px rgba(255, 210, 90, 0.03),
                    inset 0 1px 0 rgba(255,255,255,0.05);
            }

            .exp-region-bg-desert::after {
                background:
                    radial-gradient(circle at 14% 20%, rgba(255, 223, 158, 0.12), transparent 18%),
                    radial-gradient(circle at 86% 18%, rgba(255, 214, 126, 0.08), transparent 18%),
                    radial-gradient(circle at 52% 52%, rgba(255, 198, 108, 0.05), transparent 20%),
                    linear-gradient(155deg, transparent 0%, rgba(191, 131, 49, 0.10) 26%, transparent 48%),
                    repeating-linear-gradient(
                        -18deg,
                        rgba(0,0,0,0.00) 0px,
                        rgba(0,0,0,0.00) 28px,
                        rgba(145, 98, 36, 0.08) 28px,
                        rgba(145, 98, 36, 0.08) 48px
                    ),
                    repeating-linear-gradient(
                        14deg,
                        rgba(0,0,0,0.00) 0px,
                        rgba(0,0,0,0.00) 34px,
                        rgba(108, 72, 28, 0.08) 34px,
                        rgba(108, 72, 28, 0.08) 58px
                    ),
                    linear-gradient(90deg,
                        rgba(255,213,95,0.00) 0%,
                        rgba(255,220,110,0.06) 4%,
                        rgba(255,214,96,0.14) 5.8%,
                        rgba(255,232,155,0.04) 7.2%,
                        rgba(255,213,95,0.00) 10.5%,
                        rgba(255,213,95,0.00) 89.5%,
                        rgba(255,220,110,0.06) 92.8%,
                        rgba(255,214,96,0.14) 94.2%,
                        rgba(255,232,155,0.04) 96%,
                        rgba(255,213,95,0.00) 100%
                    ),
                    linear-gradient(180deg,
                        rgba(255,213,95,0.00) 0%,
                        rgba(255,220,110,0.06) 5%,
                        rgba(255,214,96,0.14) 6.8%,
                        rgba(255,232,155,0.04) 8.4%,
                        rgba(255,213,95,0.00) 11.5%,
                        rgba(255,213,95,0.00) 88.5%,
                        rgba(255,220,110,0.06) 91.6%,
                        rgba(255,214,96,0.14) 93.2%,
                        rgba(255,232,155,0.04) 95%,
                        rgba(255,213,95,0.00) 100%
                    );
                box-shadow:
                    inset 0 0 0 1px rgba(255, 220, 118, 0.09),
                    inset 0 0 24px rgba(255, 183, 76, 0.03);
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
                    0 1px 0 rgba(255, 242, 184, 0.55),
                    0 2px 0 rgba(204, 146, 28, 0.48),
                    0 4px 12px rgba(0,0,0,0.70);
            }

            .exp-region-subtitle {
                font-size: 13px;
                line-height: 1.15;
                font-weight: 800;
                color: rgba(248, 225, 151, 0.92);
                text-shadow:
                    0 1px 0 rgba(255, 245, 198, 0.26),
                    0 2px 8px rgba(0,0,0,0.66);
            }

            .exp-region-soon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: fit-content;
                margin-top: 4px;
                padding: 6px 12px;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 900;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: #ffe6a3;
                background: linear-gradient(180deg, rgba(255,210,90,0.22) 0%, rgba(255,170,40,0.12) 100%);
                border: 1px solid rgba(255,214,110,0.28);
                box-shadow:
                    0 6px 18px rgba(0,0,0,0.20),
                    inset 0 1px 0 rgba(255,255,255,0.10);
                text-shadow: 0 1px 6px rgba(0,0,0,0.55);
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
                                ${isLocked ? `<div class="exp-region-soon">Wkrótce</div>` : ``}
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