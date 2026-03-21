window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ui = CryptoZoo.ui || {};

Object.assign(CryptoZoo.ui, {
    toastTimeout: null,
    rankingCache: null,
    rankingLoading: false,
    rankingLastFetchAt: 0,
    rankingCacheTtl: 15000,

    updateText(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
    },

    formatTimeLeft(seconds) {
        const safe = Math.max(0, Number(seconds) || 0);
        const hours = Math.floor(safe / 3600);
        const minutes = Math.floor((safe % 3600) / 60);
        const secs = safe % 60;

        return [
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(secs).padStart(2, "0")
        ].join(":");
    },

    formatDurationLabel(totalSeconds) {
        const safe = Math.max(0, Number(totalSeconds) || 0);
        const hours = Math.floor(safe / 3600);
        const minutes = Math.floor((safe % 3600) / 60);

        if (hours > 0 && minutes > 0) {
            return `${hours}h ${minutes}m`;
        }

        if (hours > 0) {
            return `${hours}h`;
        }

        if (minutes > 0) {
            return `${minutes}m`;
        }

        return `${safe}s`;
    },

    bindClick(id, handler) {
        document.getElementById(id)?.addEventListener("click", handler);
    },

    getShopTypeLabel(type) {
        if (type === "click") return "Click Boost";
        if (type === "income") return "Income Boost";
        if (type === "expedition") return "Expedition Boost";
        if (type === "offline") return "Offline Boost";
        return "Upgrade";
    },

    getShopTypeEmoji(type) {
        if (type === "click") return "👆";
        if (type === "income") return "💰";
        if (type === "expedition") return "🧭";
        if (type === "offline") return "💤";
        return "✨";
    },

    getExpeditionRewardRangeText(expeditionConfig) {
        if (!expeditionConfig) return "0 reward";

        const baseExpedition = {
            startTime: 0,
            endTime: Number(expeditionConfig.duration || 0) * 1000
        };

        const commonReward = Number(
            CryptoZoo.gameplay?.getExpeditionRewardBalanceAmount?.({
                ...baseExpedition,
                rewardRarity: "common"
            }) || 0
        );

        const epicReward = Number(
            CryptoZoo.gameplay?.getExpeditionRewardBalanceAmount?.({
                ...baseExpedition,
                rewardRarity: "epic"
            }) || 0
        );

        if (commonReward === epicReward) {
            return `${CryptoZoo.formatNumber(commonReward)} reward`;
        }

        return `${CryptoZoo.formatNumber(commonReward)} - ${CryptoZoo.formatNumber(epicReward)} reward`;
    },

    getShopItemDescription(item) {
        if (!item) return "";

        if (item.type === "click") {
            const bonus = Math.max(1, Number(item.clickValueBonus) || 1);
            return `+${CryptoZoo.formatNumber(bonus)} coin${bonus !== 1 ? "s" : ""} per click`;
        }

        if (item.type === "offline") {
            const multiplier = Math.max(1, Number(item.offlineMultiplier) || 2);
            const durationSeconds = Math.max(60, Number(item.offlineDurationSeconds) || 600);
            return `x${CryptoZoo.formatNumber(multiplier)} offline income przez ${this.formatDurationLabel(durationSeconds)}`;
        }

        return item.desc || "";
    },

    getShopItemPriceMeta(item) {
        if (!item) {
            return {
                label: "Koszt",
                value: "0"
            };
        }

        const gemPrice = Number(item.gemPrice) || 0;
        if (gemPrice > 0) {
            return {
                label: "Koszt",
                value: `${CryptoZoo.formatNumber(gemPrice)} gem`
            };
        }

        return {
            label: "Koszt",
            value: `${CryptoZoo.formatNumber(Number(item.price) || 0)}`
        };
    },

    getShopButtonLabel(item) {
        if (!item) return "Kup";

        const gemPrice = Math.max(0, Number(item.gemPrice) || 0);
        if (gemPrice > 0) {
            return "Kup za gemy";
        }

        return "Kup";
    },

    renderZooList() {
        const zooList = document.getElementById("zooList");
        if (!zooList) return;

        const animalsConfig = CryptoZoo.config?.animals || {};
        const animalsState = CryptoZoo.state?.animals || {};

        zooList.innerHTML = Object.keys(animalsConfig).map((type) => {
            const config = animalsConfig[type];
            const state = animalsState[type] || { count: 0, level: 1 };
            const upgradeCost = CryptoZoo.gameplay?.getAnimalUpgradeCost?.(type) || 0;

            return `
                <div class="animal-row">
                    <div class="animal-left">
                        <div class="animal-icon">
                            <img src="assets/animals/${config.asset}.png" alt="${config.name}">
                        </div>

                        <div class="animal-text">
                            <div class="animal-name">${config.name}</div>
                            <div class="animal-desc">
                                Dochód ${CryptoZoo.formatNumber(config.baseIncome)}/sek • Koszt ${CryptoZoo.formatNumber(config.buyCost)}
                            </div>
                            <div class="animal-owned">
                                Posiadasz: ${CryptoZoo.formatNumber(state.count)} • Poziom: ${CryptoZoo.formatNumber(state.level)}
                            </div>
                        </div>
                    </div>

                    <div class="animal-actions">
                        <button id="buy-${type}-btn" type="button">Kup</button>
                        <button id="upgrade-${type}-btn" type="button">Lvl Up (${CryptoZoo.formatNumber(upgradeCost)})</button>
                    </div>
                </div>
            `;
        }).join("");

        CryptoZoo.gameplay?.bindAnimalButtons?.();
    },

    renderExpeditions() {
        const container = document.getElementById("missionsList");
        if (!container) return;

        const expedition = CryptoZoo.state?.expedition;

        if (expedition) {
            const now = Date.now();
            const timeLeft = Math.max(0, Math.floor((expedition.endTime - now) / 1000));
            const canCollect = timeLeft <= 0;
            const rewardBalanceAmount = Math.max(
                0,
                Number(CryptoZoo.gameplay?.getExpeditionRewardBalanceAmount?.(expedition)) || 0
            );

            const rarityMap = {
                common: "Zwykła",
                rare: "Rzadka",
                epic: "Epicka"
            };

            container.innerHTML = `
                <div class="expedition-card">
                    <h3>Aktywna ekspedycja: ${expedition.name}</h3>
                    <div>Pozostało: ${this.formatTimeLeft(timeLeft)}</div>
                    <div>Jakość nagrody: ${rarityMap[expedition.rewardRarity] || "Zwykła"}</div>
                    <div>
                        Przewidywana nagroda:
                        ${CryptoZoo.formatNumber(expedition.rewardCoins)} coins +
                        ${CryptoZoo.formatNumber(expedition.rewardGems)} gems
                    </div>
                    <div>
                        Reward Wallet:
                        ${CryptoZoo.formatNumber(rewardBalanceAmount)} reward
                    </div>
                    <button id="collect-expedition-btn" type="button" ${canCollect ? "" : "disabled"}>
                        ${canCollect ? "Odbierz nagrodę" : "Trwa ekspedycja"}
                    </button>
                </div>
            `;

            this.bindClick("collect-expedition-btn", () => {
                CryptoZoo.gameplay?.collectExpedition?.();
            });

            return;
        }

        const expeditions = CryptoZoo.config?.expeditions || [];

        container.innerHTML = expeditions.map((exp) => {
            const rewardRangeText = this.getExpeditionRewardRangeText(exp);
            const isUnlocked = CryptoZoo.gameplay?.isExpeditionUnlocked?.(exp) || false;
            const requiredLevel = CryptoZoo.gameplay?.getExpeditionUnlockRequirement?.(exp) || 1;
            const buttonLabel = isUnlocked ? "Start" : `Lvl ${CryptoZoo.formatNumber(requiredLevel)}`;

            return `
                <div class="expedition-card">
                    <h3>${exp.name}</h3>
                    <div>Czas: ${this.formatTimeLeft(exp.duration)}</div>
                    <div>
                        Nagroda bazowa:
                        ${CryptoZoo.formatNumber(exp.baseCoins)} coins +
                        ${CryptoZoo.formatNumber(exp.baseGems)} gems
                    </div>
                    <div>
                        Reward Wallet: ${rewardRangeText}
                    </div>
                    <div>
                        Wymagany poziom: ${CryptoZoo.formatNumber(requiredLevel)}
                    </div>
                    <div>
                        Szansa na bonus:
                        Rare ${(exp.rareChance * 100).toFixed(0)}% /
                        Epic ${(exp.epicChance * 100).toFixed(0)}%
                    </div>
                    <button
                        id="start-expedition-${exp.id}"
                        type="button"
                        ${isUnlocked ? "" : "disabled"}
                        style="${isUnlocked ? "" : "opacity:0.65; cursor:not-allowed;"}"
                    >${buttonLabel}</button>
                </div>
            `;
        }).join("");

        expeditions.forEach((exp) => {
            if (CryptoZoo.gameplay?.isExpeditionUnlocked?.(exp)) {
                this.bindClick(`start-expedition-${exp.id}`, () => {
                    CryptoZoo.gameplay?.startExpedition?.(exp.id);
                });
            }
        });
    },

    renderShopItems() {
        const shopList = document.getElementById("shopList");
        if (!shopList) return;

        const items = CryptoZoo.config?.shopItems || [];

        shopList.innerHTML = items.map((item) => {
            const typeLabel = this.getShopTypeLabel(item.type);
            const typeEmoji = this.getShopTypeEmoji(item.type);
            const description = this.getShopItemDescription(item);
            const priceMeta = this.getShopItemPriceMeta(item);
            const buttonLabel = this.getShopButtonLabel(item);

            return `
                <div class="shop-item">
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:8px;">
                        <div>
                            <div style="font-size:16px; font-weight:900; margin-bottom:4px;">
                                ${typeEmoji} ${item.name}
                            </div>
                            <div style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:999px; background:rgba(255,255,255,0.08); font-size:11px; font-weight:800; color:rgba(255,255,255,0.82);">
                                ${typeLabel}
                            </div>
                        </div>
                        <div style="text-align:right; flex-shrink:0;">
                            <div style="font-size:12px; color:rgba(255,255,255,0.66);">${priceMeta.label}</div>
                            <div style="font-size:16px; font-weight:900;">${priceMeta.value}</div>
                        </div>
                    </div>

                    <div style="font-size:13px; color:rgba(255,255,255,0.78); margin-bottom:10px; line-height:1.45;">
                        ${description}
                    </div>

                    <button id="buy-shop-${item.id}" type="button">${buttonLabel}</button>
                </div>
            `;
        }).join("");

        CryptoZoo.gameplay?.bindShopButtons?.();
    },

    render() {
        this.renderHome();
        this.renderTopHiddenStats();
        this.renderZooList();
        this.renderExpeditions();
        this.renderShopItems();

        if (CryptoZoo.gameplay?.activeScreen === "ranking") {
            CryptoZoo.uiRanking?.renderRanking?.(false);
        }

        CryptoZoo.uiProfile?.refreshProfileModalData?.();
        CryptoZoo.uiSettings?.refreshSettingsModalData?.();
    }
});