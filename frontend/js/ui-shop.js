window.CryptoZoo = window.CryptoZoo || {};
CryptoZoo.ui = CryptoZoo.ui || {};

Object.assign(CryptoZoo.ui, {
    getShopTypeLabel(type, effect) {
        const normalizedType = String(type || "").toLowerCase();
        const normalizedEffect = String(effect || "").toLowerCase();

        if (normalizedType === "click") return this.t("clickBoost", "Boost klików");
        if (normalizedType === "income") return this.t("incomeBoost", "Boost dochodu");
        if (normalizedType === "expedition") return this.t("expeditionBoost", "Boost ekspedycji");
        if (normalizedType === "expeditiontime" || normalizedEffect === "expeditiontime") {
            return this.t("timeConsumable", "Skracanie czasu");
        }
        return this.t("special", "Specjalny");
    },

    getShopTypeEmoji(type, effect) {
        const normalizedType = String(type || "").toLowerCase();
        const normalizedEffect = String(effect || "").toLowerCase();

        if (normalizedType === "click") return "👆";
        if (normalizedType === "income") return "💰";
        if (normalizedType === "expedition") return "🧭";
        if (normalizedType === "expeditiontime" || normalizedEffect === "expeditiontime") return "⏱";
        if (normalizedEffect === "coinpack") return "🪙";
        if (normalizedEffect === "boost2x") return "⚡";
        return "✨";
    },

    getExpeditionRewardRangeText(expeditionConfig) {
        if (!expeditionConfig) return `0 ${this.t("rewardWord", "reward")}`;

        const durationSeconds =
            CryptoZoo.expeditions?.getEffectiveDurationSeconds?.(expeditionConfig) ||
            Number(expeditionConfig.duration || 0);

        const baseExpedition = {
            startTime: 0,
            endTime: Number(durationSeconds) * 1000,
            duration: durationSeconds,
            baseDuration: durationSeconds,
            rewardRarity: "common"
        };

        const commonReward = Number(
            CryptoZoo.expeditions?.getRewardBalanceAmount?.(baseExpedition) || 0
        );

        const rareReward = Number(
            CryptoZoo.expeditions?.getRewardBalanceAmount?.({
                ...baseExpedition,
                rewardRarity: "rare"
            }) || 0
        );

        const epicReward = Number(
            CryptoZoo.expeditions?.getRewardBalanceAmount?.({
                ...baseExpedition,
                rewardRarity: "epic"
            }) || 0
        );

        const minReward = commonReward;
        const maxReward = Math.max(rareReward, epicReward);

        if (minReward === maxReward) {
            return `${minReward.toFixed(3)} ${this.t("rewardWord", "reward")}`;
        }

        return `${minReward.toFixed(3)} - ${maxReward.toFixed(3)} ${this.t("rewardWord", "reward")}`;
    },

    getShopItemDescription(item) {
        if (!item) return "";

        const normalizedType = String(item.type || "").toLowerCase();
        const normalizedEffect = String(item.effect || "").toLowerCase();

        if (normalizedType === "click") {
            const bonus = Math.max(1, Number(item.clickValueBonus) || 1);
            return `+${CryptoZoo.formatNumber(bonus)} ${this.t("coinPerClickDesc", "coin za kliknięcie")}`;
        }

        if (normalizedType === "income") {
            const bonus = Math.max(1, Number(item.incomeBonus) || 1);
            return `+${CryptoZoo.formatNumber(bonus)} ${this.t("levelAllOwnedAnimals", "level do wszystkich posiadanych zwierząt")}`;
        }

        if (normalizedType === "expedition") {
            const percent = Math.round(
                (Number(CryptoZoo.shopSystem?.DAILY_EXPEDITION_BOOST_VALUE) || 0.25) * 100
            );

            return `+${percent}% reward z ekspedycji przez 24h • 1 raz / 24h`;
        }

        if (normalizedType === "expeditiontime" || normalizedEffect === "expeditiontime") {
            const reductionSeconds = Math.max(0, Number(item.timeReductionSeconds) || 0);
            return `${this.t("reduceOneActiveExpedition", "Skraca jedną aktywną ekspedycję o")} ${this.formatDurationLabel(reductionSeconds)}`;
        }

        if (normalizedEffect === "coinpack") {
            const amount = Math.max(0, Number(item.coinPackAmount) || 0);
            return `+${CryptoZoo.formatNumber(amount)} ${this.t("coins", "coins")}`;
        }

        if (normalizedEffect === "boost2x" || normalizedEffect === "boost") {
            const durationSeconds = Math.max(60, Number(item.boostDurationSeconds) || 600);
            return `X2 ${this.t("clickAndZooIncomeFor", "klik i zoo income przez")} ${this.formatDurationLabel(durationSeconds)}`;
        }

        return this.getLocalizedShopItemDesc(item) || item.desc || "";
    },

    getShopItemPriceMeta(item) {
        if (!item) {
            return { label: this.t("cost", "Koszt"), value: "0" };
        }

        if (CryptoZoo.shopSystem?.getCurrentPriceMeta) {
            const meta = CryptoZoo.shopSystem.getCurrentPriceMeta(item);
            return {
                ...meta,
                label: this.t("cost", "Koszt")
            };
        }

        const gemPrice = Number(item.gemPrice) || 0;
        if (gemPrice > 0) {
            return {
                label: this.t("cost", "Koszt"),
                value: `${CryptoZoo.formatNumber(gemPrice)} gemy`
            };
        }

        return {
            label: this.t("cost", "Koszt"),
            value: `${CryptoZoo.formatNumber(Number(item.price) || 0)}`
        };
    },

    getShopButtonLabel(item) {
        if (!item) return this.t("buy", "Kup");
        return Math.max(0, Number(item.gemPrice) || 0) > 0
            ? this.t("buyWithGems", "Kup za gemy")
            : this.t("buy", "Kup");
    },

    getShopItemStockMeta(item) {
        if (!item) {
            return {
                label: this.t("owned", "Posiadane"),
                value: "0"
            };
        }

        const effect = String(item.effect || "").toLowerCase();
        const type = String(item.type || "").toLowerCase();

        if (type === "expeditiontime" || effect === "expeditiontime") {
            const itemCharges = Math.max(
                0,
                Number(CryptoZoo.shopSystem?.getItemChargeCount?.(item.id)) || 0
            );

            return {
                label: this.t("charges", "Ładunki"),
                value: CryptoZoo.formatNumber(itemCharges)
            };
        }

        if (type === "expedition") {
            const isActive = !!CryptoZoo.shopSystem?.isDailyBoostActive?.();
            const canBuy = !!CryptoZoo.shopSystem?.canBuyDailyBoost?.();

            if (isActive) {
                return {
                    label: this.t("status", "Status"),
                    value: "Aktywny 24h"
                };
            }

            if (!canBuy) {
                return {
                    label: this.t("status", "Status"),
                    value: "Cooldown"
                };
            }

            return {
                label: this.t("status", "Status"),
                value: this.t("ready", "Ready")
            };
        }

        const ownedCount = Math.max(0, Number(CryptoZoo.shopSystem?.getOwnedCount?.(item.id)) || 0);
        return {
            label: this.t("owned", "Posiadane"),
            value: CryptoZoo.formatNumber(ownedCount)
        };
    },

    renderShopItems() {
        const shopList = document.getElementById("shopList");
        if (!shopList) return;

        const items = CryptoZoo.config?.shopItems || [];

        shopList.innerHTML = items.map((item) => {
            const typeLabel = this.getShopTypeLabel(item.type, item.effect);
            const typeEmoji = this.getShopTypeEmoji(item.type, item.effect);
            const description = this.getShopItemDescription(item);
            const priceMeta = this.getShopItemPriceMeta(item);
            const buttonLabel = this.getShopButtonLabel(item);
            const stockMeta = this.getShopItemStockMeta(item);
            const canAfford = !!CryptoZoo.shopSystem?.canAfford?.(item);
            const localizedName = this.getLocalizedShopItemName(item);

            return `
                <div class="shop-item">
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:8px;">
                        <div>
                            <div style="font-size:16px; font-weight:900; margin-bottom:4px;">
                                ${typeEmoji} ${localizedName}
                            </div>
                            <div style="display:flex; flex-wrap:wrap; gap:6px;">
                                <div style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:999px; background:rgba(255,255,255,0.08); font-size:11px; font-weight:800; color:rgba(255,255,255,0.82);">
                                    ${typeLabel}
                                </div>
                                <div style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:999px; background:rgba(255,191,0,0.10); font-size:11px; font-weight:800; color:rgba(255,235,170,0.92);">
                                    ${stockMeta.label}: ${stockMeta.value}
                                </div>
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

                    <button
                        id="buy-shop-${item.id}"
                        type="button"
                        style="${canAfford ? "" : "opacity:0.72;"}"
                    >${buttonLabel}</button>
                </div>
            `;
        }).join("");

        CryptoZoo.shopSystem?.bindButtons?.();
    }
});