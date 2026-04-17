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
                gap: 14px;
                margin-top: 14px;
            }

            .exp-region-card {
                position: relative;
                overflow: hidden;
                border-radius: 22px;
                min-height: 120px;
                padding: 18px;
                display: flex;
                align-items: flex-end;
                border: 1px solid rgba(255,255,255,0.12);
                box-shadow: 0 14px 32px rgba(0,0,0,0.24);
                cursor: pointer;
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                isolation: isolate;
            }

            .exp-region-card::before {
                content: "";
                position: absolute;
                inset: 0;
                background:
                    linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.52)),
                    linear-gradient(135deg, rgba(255,255,255,0.06), transparent 46%);
                z-index: 0;
            }

            .exp-region-card::after {
                content: "";
                position: absolute;
                inset: 0;
                z-index: 1;
                pointer-events: none;
                opacity: 0.95;
            }

            .exp-region-card.exp-region-locked {
                cursor: default;
                filter: grayscale(0.05);
            }

            .exp-region-bg-jungle {
                background:
                    radial-gradient(circle at 18% 22%, rgba(255, 223, 120, 0.18), transparent 22%),
                    radial-gradient(circle at 84% 26%, rgba(120, 255, 170, 0.10), transparent 20%),
                    linear-gradient(135deg, rgba(36, 82, 46, 0.96), rgba(10, 34, 18, 0.98));
            }

            .exp-region-bg-jungle::after {
                background:
                    linear-gradient(180deg, rgba(112, 170, 68, 0.08), transparent 34%),
                    radial-gradient(circle at 50% 58%, rgba(245, 197, 92, 0.16), transparent 14%),
                    radial-gradient(circle at 50% 58%, rgba(255, 238, 164, 0.10), transparent 8%),
                    linear-gradient(90deg,
                        transparent 0%,
                        rgba(255, 231, 149, 0.12) 14%,
                        rgba(255, 215, 96, 0.30) 18%,
                        rgba(255, 241, 175, 0.16) 20%,
                        transparent 24%,
                        transparent 76%,
                        rgba(255, 231, 149, 0.12) 80%,
                        rgba(255, 215, 96, 0.30) 84%,
                        rgba(255, 241, 175, 0.16) 86%,
                        transparent 100%
                    ),
                    linear-gradient(180deg,
                        transparent 0%,
                        rgba(255, 231, 149, 0.10) 18%,
                        rgba(255, 215, 96, 0.26) 22%,
                        rgba(255, 241, 175, 0.14) 24%,
                        transparent 28%,
                        transparent 72%,
                        rgba(255, 231, 149, 0.10) 76%,
                        rgba(255, 215, 96, 0.26) 80%,
                        rgba(255, 241, 175, 0.14) 82%,
                        transparent 100%
                    ),
                    linear-gradient(135deg,
                        rgba(255, 219, 102, 0.34) 0%,
                        rgba(139, 92, 22, 0.18) 12%,
                        transparent 18%
                    ),
                    linear-gradient(225deg,
                        rgba(255, 219, 102, 0.34) 0%,
                        rgba(139, 92, 22, 0.18) 12%,
                        transparent 18%
                    ),
                    linear-gradient(315deg,
                        rgba(255, 219, 102, 0.34) 0%,
                        rgba(139, 92, 22, 0.18) 12%,
                        transparent 18%
                    ),
                    linear-gradient(45deg,
                        rgba(255, 219, 102, 0.34) 0%,
                        rgba(139, 92, 22, 0.18) 12%,
                        transparent 18%
                    ),
                    repeating-linear-gradient(
                        115deg,
                        rgba(22, 62, 31, 0.00) 0px,
                        rgba(22, 62, 31, 0.00) 18px,
                        rgba(70, 118, 54, 0.18) 18px,
                        rgba(70, 118, 54, 0.18) 30px
                    ),
                    repeating-linear-gradient(
                        65deg,
                        rgba(14, 42, 22, 0.00) 0px,
                        rgba(14, 42, 22, 0.00) 22px,
                        rgba(86, 142, 62, 0.12) 22px,
                        rgba(86, 142, 62, 0.12) 36px
                    );
                box-shadow:
                    inset 0 0 0 1px rgba(255, 218, 110, 0.20),
                    inset 0 0 20px rgba(255, 214, 98, 0.08);
            }

            .exp-region-bg-desert {
                background:
                    radial-gradient(circle at 18% 22%, rgba(255, 214, 120, 0.12), transparent 22%),
                    radial-gradient(circle at 84% 26%, rgba(255, 241, 184, 0.05), transparent 20%),
                    linear-gradient(135deg, rgba(88, 54, 17, 0.96), rgba(23, 14, 8, 0.98));
            }

            .exp-region-bg-desert::after {
                background:
                    linear-gradient(180deg, rgba(255, 210, 120, 0.04), transparent 30%),
                    repeating-linear-gradient(
                        -18deg,
                        rgba(123, 77, 24, 0.00) 0px,
                        rgba(123, 77, 24, 0.00) 16px,
                        rgba(178, 120, 46, 0.12) 16px,
                        rgba(178, 120, 46, 0.12) 28px
                    ),
                    linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.16) 100%);
            }

            .exp-region-content {
                position: relative;
                z-index: 2;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .exp-region-title {
                font-size: 20px;
                font-weight: 900;
                color: #fff;
                letter-spacing: 0.02em;
                text-shadow: 0 2px 8px rgba(0,0,0,0.75);
            }

            .exp-region-subtitle {
                font-size: 12px;
                font-weight: 700;
                color: rgba(255,255,255,0.86);
                text-shadow: 0 2px 8px rgba(0,0,0,0.70);
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
                width: 64px;
                height: 64px;
                border-radius: 999px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,0.45);
                border: 1px solid rgba(255,255,255,0.18);
                color: #fff;
                font-size: 28px;
                box-shadow: 0 10px 24px rgba(0,0,0,0.28);
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