window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.expeditionRegionsUi = {
    injectedStyles: false,

    getRegions() {
        return [
            {
                id: "jungle",
                name: "Dżungla",
                nameKey: "regionJungle",
                nameFallback: "Dżungla",
                availableKey: "regionAvailableLevels",
                availableFallback: "Region dostępny • poziomy {min}-{max}",
                lockedFallback: "Od poziomu {min}",
                minLevel: 1,
                maxLevel: 48,
                locked: false,
                bgClass: "exp-region-bg-jungle"
            },
            {
                id: "desert",
                name: "Pustynia",
                nameKey: "regionDesert",
                nameFallback: "Pustynia",
                availableKey: "regionAvailableLevels",
                availableFallback: "Region dostępny • poziomy {min}-{max}",
                lockedFallback: "Od poziomu {min}",
                minLevel: 49,
                maxLevel: null,
                locked: true,
                bgClass: "exp-region-bg-desert"
            }
        ];
    },

    t(key, fallback) {
        const translated = CryptoZoo.lang?.t?.(key);
        if (translated && translated !== key) {
            return translated;
        }
        return fallback || key;
    },

    formatText(template, values = {}) {
        let result = String(template || "");

        Object.entries(values).forEach(([key, value]) => {
            result = result.replaceAll(`{${key}}`, String(value));
        });

        return result;
    },

    getRegionDisplayName(region) {
        if (!region) return "";

        return this.t(region.nameKey, region.nameFallback || region.name || "");
    },

    getRegionSubtitle(region) {
        if (!region) return "";

        if (region.locked) {
            return this.formatText(
                this.t("regionFromLevel", region.lockedFallback || "Od poziomu {min}"),
                {
                    min: region.minLevel
                }
            );
        }

        return this.formatText(
            this.t("regionAvailableLevels", region.availableFallback || "Region dostępny • poziomy {min}-{max}"),
            {
                min: region.minLevel,
                max: region.maxLevel
            }
        );
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
                border-radius: 26px;
                min-height: 150px;
                padding: 22px;
                display: flex;
                align-items: flex-end;
                border: 1px solid rgba(255,255,255,0.12);
                box-shadow:
                    0 16px 34px rgba(0,0,0,0.26),
                    inset 0 1px 0 rgba(255,255,255,0.08);
                background-size: cover;
                background-position: center;
                cursor: pointer;
                isolation: isolate;
            }

            .exp-region-card::before {
                content: "";
                position: absolute;
                inset: 0;
                z-index: 0;
                background:
                    linear-gradient(180deg, rgba(7, 14, 28, 0.04) 0%, rgba(7, 14, 28, 0.58) 100%),
                    linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 42%, transparent 62%);
            }

            .exp-region-card::after {
                content: "";
                position: absolute;
                inset: 0;
                z-index: 0;
                background:
                    radial-gradient(circle at 20% 18%, rgba(255,255,255,0.16), transparent 30%),
                    radial-gradient(circle at 82% 24%, rgba(255,255,255,0.08), transparent 28%);
                pointer-events: none;
            }

            .exp-region-card.exp-region-locked {
                cursor: default;
                filter: saturate(0.92);
            }

            .exp-region-bg-jungle {
                background-image:
                    linear-gradient(135deg, rgba(26, 86, 52, 0.86) 0%, rgba(16, 48, 28, 0.93) 100%),
                    url("assets/regions/jungle-bg.png");
                background-color: #17371f;
            }

            .exp-region-bg-desert {
                background-image:
                    linear-gradient(135deg, rgba(134, 86, 24, 0.88) 0%, rgba(72, 42, 8, 0.94) 100%),
                    url("assets/regions/desert-bg.png");
                background-color: #6d4618;
            }

            .exp-region-content {
                position: relative;
                z-index: 2;
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-width: calc(100% - 80px);
            }

            .exp-region-title {
                font-size: 23px;
                font-weight: 900;
                color: #ffffff;
                letter-spacing: 0.01em;
                line-height: 1.05;
                text-shadow: 0 2px 8px rgba(0,0,0,0.30);
            }

            .exp-region-subtitle {
                font-size: 13px;
                font-weight: 800;
                color: rgba(255,255,255,0.88);
                line-height: 1.35;
                text-shadow: 0 1px 5px rgba(0,0,0,0.22);
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
                width: 74px;
                height: 74px;
                border-radius: 999px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(19, 11, 4, 0.48);
                border: 1px solid rgba(255,255,255,0.18);
                color: #fff;
                font-size: 31px;
                font-weight: 900;
                box-shadow:
                    0 12px 28px rgba(0,0,0,0.30),
                    inset 0 1px 0 rgba(255,255,255,0.12);
                backdrop-filter: blur(3px);
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
                padding: 12px 14px;
                border-radius: 18px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.08);
                box-shadow: 0 10px 24px rgba(0,0,0,0.16);
            }

            .exp-region-expeditions-title {
                font-size: 15px;
                font-weight: 900;
                color: #fff;
            }

            .exp-region-back-btn {
                border: 0;
                border-radius: 14px;
                padding: 10px 14px;
                font-size: 13px;
                font-weight: 800;
                cursor: pointer;
                background: linear-gradient(180deg, #ffffff 0%, #ececec 100%);
                color: #111;
                box-shadow: 0 8px 18px rgba(0,0,0,0.18);
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
                    const subtitle = this.getRegionSubtitle(region);
                    const title = this.getRegionDisplayName(region);

                    return `
                        <div
                            class="exp-region-card ${region.bgClass} ${isLocked ? "exp-region-locked" : ""}"
                            data-exp-region-id="${region.id}"
                        >
                            <div class="exp-region-content">
                                <div class="exp-region-title">${title}</div>
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

        const region = this.getRegions().find((entry) => entry.id === regionId);
        if (!region) {
            this.clearSelectedRegionId();
            this.renderRegionsList();
            return;
        }

        const expeditions = this.getRegionExpeditions(regionId);
        const regionTitle = this.getRegionDisplayName(region);

        mount.innerHTML = `
            <div class="exp-region-expeditions-wrap">
                <div class="exp-region-expeditions-head">
                    <div class="exp-region-expeditions-title">${regionTitle}</div>
                    <button id="expRegionBackBtn" class="exp-region-back-btn" type="button">← ${this.t("back", "Wróć")}</button>
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
                : `<div class="shop-card">${this.t("noExpeditionsInRegion", "Brak ekspedycji w tym regionie")}</div>`;
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