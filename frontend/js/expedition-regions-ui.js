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

    getCurrentPlayerLevel() {
        return Math.max(1, Number(CryptoZoo.state?.level) || 1);
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
            }

            .exp-region-card::before {
                content: "";
                position: absolute;
                inset: 0;
                background:
                    linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.52)),
                    linear-gradient(135deg, rgba(255,255,255,0.06), transparent 46%);
            }

            .exp-region-card.exp-region-locked {
                cursor: default;
                filter: grayscale(0.05);
            }

            .exp-region-bg-jungle {
                background:
                    radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14), transparent 28%),
                    radial-gradient(circle at 78% 25%, rgba(255,255,255,0.08), transparent 24%),
                    linear-gradient(135deg, rgba(61, 121, 72, 0.88), rgba(14, 55, 28, 0.94)),
                    url("assets/regions/jungle-bg.png");
                background-size: cover;
                background-position: center;
            }

            .exp-region-bg-desert {
                background:
                    radial-gradient(circle at 20% 20%, rgba(255,255,255,0.10), transparent 28%),
                    radial-gradient(circle at 80% 30%, rgba(255,255,255,0.06), transparent 24%),
                    linear-gradient(135deg, rgba(160, 108, 39, 0.90), rgba(80, 48, 12, 0.95)),
                    url("assets/regions/desert-bg.png");
                background-size: cover;
                background-position: center;
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
            }

            .exp-region-subtitle {
                font-size: 12px;
                font-weight: 700;
                color: rgba(255,255,255,0.82);
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
                font-weight: 900;
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
                        ? \`Od poziomu \${region.minLevel}\`
                        : \`Region dostępny • poziomy \${region.minLevel}-\${region.maxLevel}\`;

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

            const card = mount.querySelector(\`[data-exp-region-id="\${region.id}"]\`);
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

        const region = this.getRegions().find((entry) => entry.id === regionId);
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
                        <div class="shop-title">${CryptoZoo.expeditions?.getExpeditionDisplayName?.(expedition) || expedition.nameEn || expedition.name || "Expedition"}</div>
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