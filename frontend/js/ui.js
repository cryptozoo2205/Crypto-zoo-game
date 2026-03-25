window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ui = {
    toastTimeout: null,
    rankingCache: null,
    rankingLoading: false,
    rankingLastFetchAt: 0,
    rankingCacheTtl: 15000,

    t(key, fallback) {
        const translated = CryptoZoo.lang?.t?.(key);

        if (translated && translated !== key) {
            return translated;
        }

        return fallback || key;
    },

    getCurrentLang() {
        return CryptoZoo.lang?.current || "en";
    },

    getLocalizedAnimalName(type, config) {
        const safeType = String(type || "").trim();
        const lang = this.getCurrentLang();

        const langKeyMap = {
            monkey: "animalMonkey",
            panda: "animalPanda",
            lion: "animalLion",
            tiger: "animalTiger",
            elephant: "animalElephant",
            giraffe: "animalGiraffe",
            zebra: "animalZebra",
            hippo: "animalHippo",
            penguin: "animalPenguin",
            bear: "animalBear",
            crocodile: "animalCrocodile",
            kangaroo: "animalKangaroo",
            wolf: "animalWolf"
        };

        const langKey = langKeyMap[safeType];
        if (langKey) {
            const translated = this.t(langKey, "");
            if (translated && translated !== langKey) {
                return translated;
            }
        }

        if (lang === "pl" && config?.namePl) return config.namePl;
        if (lang === "en" && config?.nameEn) return config.nameEn;
        return config?.name || safeType;
    },

    getLocalizedShopItemName(item) {
        if (!item) return "";

        const lang = this.getCurrentLang();
        const itemKeyMap = {
            click1: "shopClick1",
            click2: "shopClick2",
            click3: "shopClick3",
            income1: "shopIncome1",
            income2: "shopIncome2",
            income3: "shopIncome3",
            expedition1: "shopExpedition1",
            expedition2: "shopExpedition2",
            expeditionTime1: "shopExpeditionTime1",
            expeditionTime2: "shopExpeditionTime2",
            offline1: "shopOffline1",
            offline2: "shopOffline2",
            spin: "shopSpin"
        };

        const langKey = itemKeyMap[item.id];
        if (langKey) {
            const translated = this.t(langKey, "");
            if (translated && translated !== langKey) {
                return translated;
            }
        }

        if (lang === "pl" && item.namePl) return item.namePl;
        if (lang === "en" && item.nameEn) return item.nameEn;
        return item.name || "";
    },

    getLocalizedShopItemDesc(item) {
        if (!item) return "";

        const lang = this.getCurrentLang();

        if (lang === "pl" && item.descPl) return item.descPl;
        if (lang === "en" && item.descEn) return item.descEn;
        return item.desc || "";
    },

    getLocalizedExpeditionName(expeditionConfig) {
        if (!expeditionConfig) return "";

        const lang = this.getCurrentLang();
        const expeditionKeyMap = {
            forest: "expeditionForest",
            river: "expeditionRiver",
            volcano: "expeditionVolcano",
            canyon: "expeditionCanyon",
            glacier: "expeditionGlacier",
            jungle: "expeditionJungle",
            temple: "expeditionTemple",
            oasis: "expeditionOasis",
            kingdom: "expeditionKingdom"
        };

        const langKey = expeditionKeyMap[expeditionConfig.id];
        if (langKey) {
            const translated = this.t(langKey, "");
            if (translated && translated !== langKey) {
                return translated;
            }
        }

        if (lang === "pl" && expeditionConfig.namePl) return expeditionConfig.namePl;
        if (lang === "en" && expeditionConfig.nameEn) return expeditionConfig.nameEn;
        return expeditionConfig.name || "";
    },

    showToast(message) {
        let toast = document.getElementById("toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast";
            toast.style.position = "fixed";
            toast.style.left = "50%";
            toast.style.bottom = "calc(var(--menu-height) + var(--menu-gap) + var(--menu-safe-bottom) + 14px)";
            toast.style.transform = "translateX(-50%)";
            toast.style.width = "min(calc(100vw - 24px), 420px)";
            toast.style.maxWidth = "calc(100vw - 24px)";
            toast.style.background = "rgba(10, 18, 35, 0.96)";
            toast.style.color = "#ffffff";
            toast.style.padding = "12px 18px";
            toast.style.borderRadius = "14px";
            toast.style.zIndex = "99999";
            toast.style.display = "none";
            toast.style.fontWeight = "800";
            toast.style.textAlign = "center";
            toast.style.boxShadow = "0 8px 28px rgba(0, 0, 0, 0.32)";
            toast.style.border = "1px solid rgba(255,255,255,0.08)";
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.display = "block";

        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.style.display = "none";
        }, 1800);
    },

    createTapFlash(area) {
        const flash = document.createElement("div");
        flash.className = "tap-flash";
        area.appendChild(flash);

        requestAnimationFrame(() => {
            flash.classList.add("animate");
        });

        setTimeout(() => {
            flash.remove();
        }, 320);
    },

    createTapSparks(area, boostActive) {
        const sparkCount = boostActive ? 8 : 4;

        for (let i = 0; i < sparkCount; i += 1) {
            const spark = document.createElement("div");
            spark.className = "tap-spark";

            const angle = (Math.PI * 2 * i) / sparkCount;
            const distance = boostActive ? 52 + Math.random() * 18 : 34 + Math.random() * 12;

            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;

            spark.style.left = "50%";
            spark.style.top = "50%";
            spark.style.setProperty("--sparkX", `${x}px`);
            spark.style.setProperty("--sparkY", `${y}px`);

            area.appendChild(spark);

            requestAnimationFrame(() => {
                spark.classList.add("animate");
            });

            setTimeout(() => {
                spark.remove();
            }, 720);
        }
    },

    animateCoin(tapCount = 1) {
        const tapButton = document.getElementById("tapButton");
        if (!tapButton || !tapButton.parentElement) return;

        const area = tapButton.parentElement;
        area.style.position = "relative";

        const clickValue =
            CryptoZoo.gameplay?.getEffectiveCoinsPerClick?.(tapCount) ||
            Number(CryptoZoo.state?.coinsPerClick) ||
            Number(CryptoZoo.config?.clickValue) ||
            1;

        const boostActive = (CryptoZoo.boostSystem?.getMultiplier?.() || 1) > 1;

        const pop = document.createElement("div");
        pop.className = `coin-pop${boostActive ? " boost-pop" : ""}`;
        pop.textContent = "+" + CryptoZoo.formatNumber(clickValue);

        const offsetX = Math.floor(Math.random() * 80) - 40;
        const offsetY = boostActive
            ? -110 - Math.floor(Math.random() * 26)
            : -90 - Math.floor(Math.random() * 20);

        pop.style.left = "50%";
        pop.style.top = "50%";
        pop.style.setProperty("--moveX", offsetX + "px");
        pop.style.setProperty("--moveY", offsetY + "px");

        area.appendChild(pop);

        requestAnimationFrame(() => {
            pop.classList.add("animate");
        });

        tapButton.classList.add("tap-hit");
        setTimeout(() => {
            tapButton.classList.remove("tap-hit");
        }, 120);

        this.createTapFlash(area);
        this.createTapSparks(area, boostActive);

        setTimeout(() => {
            pop.remove();
        }, 980);
    },

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

        if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}m`;
        return `${safe}s`;
    },

    bindClick(id, handler) {
        const el = document.getElementById(id);
        if (el) {
            el.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                handler();
            };
        }
    },

    goToBoostShop() {
        CryptoZoo.navigation?.show?.("shop");

        const boostCard = document.getElementById("boostShopCard");
        if (boostCard) {
            setTimeout(() => {
                boostCard.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 150);
        }
    },

    ensureOfflineInfoBar() {
        const incomeStrip = document.querySelector(".home-income-strip");
        if (!incomeStrip) return null;

        let bar = document.getElementById("homeOfflineInfoBar");

        if (!bar) {
            bar = document.createElement("div");
            bar.id = "homeOfflineInfoBar";
            bar.style.width = "100%";
            bar.style.marginTop = "10px";
            bar.style.marginBottom = "10px";
            bar.style.padding = "10px 12px";
            bar.style.borderRadius = "16px";
            bar.style.background = "linear-gradient(180deg, rgba(18, 28, 48, 0.96) 0%, rgba(10, 17, 31, 0.95) 100%)";
            bar.style.border = "1px solid rgba(255,255,255,0.08)";
            bar.style.boxShadow = "0 12px 22px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255,255,255,0.04)";
            bar.style.color = "#ffffff";
            bar.style.fontSize = "12px";
            bar.style.fontWeight = "700";
            bar.style.lineHeight = "1.4";

            incomeStrip.insertAdjacentElement("afterend", bar);
        }

        return bar;
    },

    removeGuideCard() {
        const oldCard = document.getElementById("homeGuideCard");
        if (oldCard) {
            oldCard.remove();
        }
    },

    renderOfflineInfo() {
        const bar = this.ensureOfflineInfoBar();
        if (!bar) return;

        const maxOfflineSeconds = Math.max(
            0,
            Number(CryptoZoo.state?.offlineMaxSeconds) ||
            Number(CryptoZoo.gameplay?.maxOfflineSeconds) ||
            0
        );

        const maxOfflineHours = maxOfflineSeconds / 3600;
        const maxOfflineLabel = Number.isInteger(maxOfflineHours)
            ? `${maxOfflineHours}h`
            : `${maxOfflineHours.toFixed(1).replace(/\.0$/, "")}h`;

        const offlineBoost = Math.max(1, Number(CryptoZoo.state?.offlineBoost) || 1);

        const boostLabel =
            offlineBoost > 1
                ? `${this.t("activeMultiplier", "Aktywny mnożnik")} offline x${CryptoZoo.formatNumber(offlineBoost)}`
                : `${this.t("standardMultiplier", "Standardowy mnożnik")} offline x1`;

        bar.innerHTML = `
            <div style="font-size:13px; font-weight:900; margin-bottom:4px;">💤 ${this.t("offlineEarnings", "Offline Earnings")}</div>
            <div style="color: rgba(255,255,255,0.78);">
                ${this.t("baseLimit", "Limit bazowy")}: ${maxOfflineLabel} • ${boostLabel}
            </div>
        `;
    },

    renderDailyRewardStatus() {
        const btn = document.getElementById("homeDailyBtn");
        if (!btn) return;

        const titleEl = btn.querySelector(".home-quick-title");
        const subtitleEl = btn.querySelector(".home-quick-subtitle");
        const iconEl = btn.querySelector(".home-quick-icon");

        if (!titleEl || !subtitleEl || !iconEl) return;

        const isUnlocked = CryptoZoo.dailyReward?.isUnlocked?.() || false;
        const canClaim = CryptoZoo.dailyReward?.canClaim?.() || false;
        const timeLeftMs = Math.max(0, Number(CryptoZoo.dailyReward?.getTimeLeftMs?.()) || 0);
        const timeLeftSeconds = Math.ceil(timeLeftMs / 1000);

        const rewardCoins = Math.max(0, Number(CryptoZoo.dailyReward?.getCoinsAmount?.()) || 0);
        const rewardGems = Math.max(0, Number(CryptoZoo.dailyReward?.getGemsAmount?.()) || 0);
        const streak = Math.max(0, Number(CryptoZoo.dailyReward?.getStreak?.()) || 0);
        const streakLabel = `${this.t("day", "Day")} ${Math.max(1, streak || 1)}`;

        titleEl.textContent = this.t("dailyReward", "Daily Reward");
        subtitleEl.style.whiteSpace = "normal";
        subtitleEl.style.wordBreak = "break-word";
        subtitleEl.style.overflowWrap = "anywhere";
        subtitleEl.style.lineHeight = "1.35";

        if (!isUnlocked) {
            subtitleEl.textContent = `${this.t("unlockIn", "Unlock in")} ${this.formatTimeLeft(timeLeftSeconds)}`;
            iconEl.textContent = "🔒";
            return;
        }

        if (canClaim) {
            subtitleEl.textContent =
                rewardGems > 0
                    ? `${streakLabel} • ${this.t("ready", "READY")} • ${CryptoZoo.formatNumber(rewardCoins)} ${this.t("coins", "coins")} + ${CryptoZoo.formatNumber(rewardGems)} ${this.t("gem", "gem")}`
                    : `${streakLabel} • ${this.t("ready", "READY")} • ${CryptoZoo.formatNumber(rewardCoins)} ${this.t("coins", "coins")}`;
            iconEl.textContent = "🎁";
            return;
        }

        subtitleEl.textContent = `${streakLabel} • ${this.t("nextRewardIn", "Next reward in")} ${this.formatTimeLeft(timeLeftSeconds)}`;
        iconEl.textContent = "⏳";
    },

    renderXpBar() {
        const progress = CryptoZoo.gameplay?.getLevelProgressData?.();
        const currentLevel = Math.max(1, Number(CryptoZoo.state?.level) || 1);

        let currentXp = 0;
        let requiredXp = 100;

        if (progress) {
            currentXp = Math.max(0, Number(progress.currentXp) || 0);
            requiredXp = Math.max(1, Number(progress.requiredXp) || 100);
        } else {
            const xp = Math.max(0, Number(CryptoZoo.state?.xp) || 0);
            let req = 100;
            let used = 0;

            while (xp >= used + req) {
                used += req;
                req += 100;
            }

            currentXp = Math.max(0, xp - used);
            requiredXp = req;
        }

        const percent = Math.max(0, Math.min(100, (currentXp / requiredXp) * 100));
        const nextLevel = currentLevel + 1;

        let rewardCoins = 0;
        let rewardGems = 0;

        if (CryptoZoo.gameplay?.getLevelReward) {
            const reward = CryptoZoo.gameplay.getLevelReward(nextLevel);
            rewardCoins = Math.max(0, Number(reward?.coins) || 0);
            rewardGems = Math.max(0, Number(reward?.gems) || 0);
        }

        const fill = document.getElementById("homeXpFill");
        const text = document.getElementById("homeXpText");

        if (fill) {
            fill.style.width = percent + "%";
        }

        if (text) {
            const rewardLabel = rewardGems > 0
                ? `${this.t("nextLvl", "Next lvl")}: +${CryptoZoo.formatNumber(rewardCoins)} ${this.t("coins", "coins")} +${CryptoZoo.formatNumber(rewardGems)} ${this.t("gem", "gem")}`
                : `${this.t("nextLvl", "Next lvl")}: +${CryptoZoo.formatNumber(rewardCoins)} ${this.t("coins", "coins")}`;

            text.textContent = `${CryptoZoo.formatNumber(currentXp)} / ${CryptoZoo.formatNumber(requiredXp)} XP • ${rewardLabel}`;
        }
    },

    getShopTypeLabel(type, effect) {
        const normalizedType = String(type || "").toLowerCase();
        const normalizedEffect = String(effect || "").toLowerCase();

        if (normalizedType === "click") return this.t("clickBoost", "Boost klików");
        if (normalizedType === "income") return this.t("incomeBoost", "Boost dochodu");
        if (normalizedType === "expedition") return this.t("expeditionBoost", "Boost ekspedycji");
        if (normalizedType === "expeditiontime" || normalizedEffect === "expeditiontime") {
            return this.t("timeConsumable", "Skracanie czasu");
        }
        if (normalizedType === "offline") return this.t("offlineBoost", "Boost offline");
        if (normalizedEffect === "extraspin") return this.t("consumable", "Konsumpcyjny");
        return this.t("special", "Specjalny");
    },

    getShopTypeEmoji(type, effect) {
        const normalizedType = String(type || "").toLowerCase();
        const normalizedEffect = String(effect || "").toLowerCase();

        if (normalizedType === "click") return "👆";
        if (normalizedType === "income") return "💰";
        if (normalizedType === "expedition") return "🧭";
        if (normalizedType === "expeditiontime" || normalizedEffect === "expeditiontime") return "⏱";
        if (normalizedType === "offline") return "💤";
        if (normalizedEffect === "extraspin") return "🎡";
        if (normalizedEffect === "skipwheelcooldown") return "⏩";
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
            rewardRarity: "common"
        };

        const commonReward = Number(
            CryptoZoo.expeditions?.getRewardBalanceAmount?.(baseExpedition) || 0
        );

        const epicReward = Number(
            CryptoZoo.expeditions?.getRewardBalanceAmount?.({
                ...baseExpedition,
                rewardRarity: "epic"
            }) || 0
        );

        if (commonReward === epicReward) {
            return `${commonReward.toFixed(3)} ${this.t("rewardWord", "reward")}`;
        }

        return `${commonReward.toFixed(3)} - ${epicReward.toFixed(3)} ${this.t("rewardWord", "reward")}`;
    },

    getShopItemDescription(item) {
        if (!item) return "";

        if (item.type === "click") {
            const bonus = Math.max(1, Number(item.clickValueBonus) || 1);
            return `+${CryptoZoo.formatNumber(bonus)} ${this.t("coinPerClickDesc", "coin za kliknięcie")}`;
        }

        if (item.type === "income") {
            const bonus = Math.max(1, Number(item.incomeBonus) || 1);
            return `+${CryptoZoo.formatNumber(bonus)} ${this.t("levelAllOwnedAnimals", "poziom do wszystkich zwierząt")}`;
        }

        if (item.type === "expedition") {
            const localizedDesc = this.getLocalizedShopItemDesc(item);
            if (localizedDesc) return localizedDesc;

            const rareBonus = Number(item.rareChanceBonus) || 0;
            const epicBonus = Number(item.epicChanceBonus) || 0;

            if (epicBonus > 0) {
                return this.t("increaseEpicChance", "Zwiększa szansę na Epic");
            }

            if (rareBonus > 0) {
                return this.t("increaseRareChance", "Zwiększa szansę na Rare");
            }

            const bonus = Math.max(1, Number(item.expeditionBonus) || 1);
            return `${this.t("increaseExpeditionReward", "Zwiększa reward ekspedycji")} (+${CryptoZoo.formatNumber(bonus)})`;
        }

        if (item.type === "expeditionTime" || item.effect === "expeditionTime") {
            const localizedDesc = this.getLocalizedShopItemDesc(item);
            if (localizedDesc) return localizedDesc;

            const reductionSeconds = Math.max(0, Number(item.timeReductionSeconds) || 0);
            return `${this.t("reduceOneActiveExpedition", "Skraca jedną ekspedycję o")} ${this.formatDurationLabel(reductionSeconds)}`;
        }

        if (item.type === "offline") {
            const localizedDesc = this.getLocalizedShopItemDesc(item);
            if (localizedDesc) return localizedDesc;

            const multiplier = Math.max(1, Number(item.offlineMultiplier) || 2);
            const durationSeconds = Math.max(60, Number(item.offlineDurationSeconds) || 600);
            return `x${CryptoZoo.formatNumber(multiplier)} ${this.t("offlineIncomeFor", "offline income przez")} ${this.formatDurationLabel(durationSeconds)}`;
        }

        if (item.effect === "extraSpin") {
            return this.getLocalizedShopItemDesc(item) || this.t("extraSpinDesc", "Daje 1 dodatkowy spin");
        }

        if (item.effect === "skipWheelCooldown") {
            return this.getLocalizedShopItemDesc(item) || this.t("resetWheelCooldown", "Resetuje cooldown koła");
        }

        if (item.effect === "coinPack") {
            const amount = Math.max(0, Number(item.coinPackAmount) || 0);
            return `+${CryptoZoo.formatNumber(amount)} ${this.t("coins", "coins")}`;
        }

        if (item.effect === "boost2x") {
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
                value: `${CryptoZoo.formatNumber(gemPrice)} ${this.t("gem", "gem")}`
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
            const charges =
                CryptoZoo.expeditions?.getTimeBoostChargesCount?.() ||
                CryptoZoo.state?.expeditionStats?.timeBoostCharges?.length ||
                0;

            return {
                label: this.t("charges", "Ładunki"),
                value: CryptoZoo.formatNumber(charges)
            };
        }

        if (effect === "extraspin") {
            const available = Math.max(0, Number(CryptoZoo.state?.minigames?.extraWheelSpins) || 0);
            return {
                label: this.t("available", "Dostępne"),
                value: CryptoZoo.formatNumber(available)
            };
        }

        const ownedCount = Math.max(0, Number(CryptoZoo.shopSystem?.getOwnedCount?.(item.id)) || 0);
        return {
            label: this.t("owned", "Posiadane"),
            value: CryptoZoo.formatNumber(ownedCount)
        };
    },

    bindHomeButtons() {
        const boostBtn = document.getElementById("homeBoostBtn");
        if (boostBtn && !boostBtn.dataset.bound) {
            boostBtn.dataset.bound = "1";
            boostBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");

                const gems = Number(CryptoZoo.state?.gems) || 0;

                if (CryptoZoo.boostSystem?.isActive?.()) {
                    const left = CryptoZoo.boostSystem?.getTimeLeft?.() || 0;
                    this.showToast(`${this.t("boostActive", "Boost aktywny")}: ${this.formatTimeLeft(left)}`);
                    return;
                }

                if (gems >= 1) {
                    CryptoZoo.boostSystem?.activate?.();
                    return;
                }

                this.goToBoostShop();
                this.showToast(this.t("needGemBoost", "Potrzebujesz 1 gema na X2 Boost"));
            };
        }

        const zooPreviewBtn = document.getElementById("homeZooPreviewBtn");
        if (zooPreviewBtn && !zooPreviewBtn.dataset.bound) {
            zooPreviewBtn.dataset.bound = "1";
            zooPreviewBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                CryptoZoo.navigation?.show?.("zoo");
            };
        }

        const homeDailyBtn = document.getElementById("homeDailyBtn");
        if (homeDailyBtn && !homeDailyBtn.dataset.bound) {
            homeDailyBtn.dataset.bound = "1";
            homeDailyBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                CryptoZoo.dailyReward?.claim?.();
            };
        }

        const homeEventsBtn = document.getElementById("homeEventsBtn");
        if (homeEventsBtn && !homeEventsBtn.dataset.bound) {
            homeEventsBtn.dataset.bound = "1";
            homeEventsBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                this.showToast(this.t("eventsSoon", "Eventy w przygotowaniu"));
            };
        }

        const homeBoostInfoBtn = document.getElementById("homeBoostInfoBtn");
        if (homeBoostInfoBtn && !homeBoostInfoBtn.dataset.bound) {
            homeBoostInfoBtn.dataset.bound = "1";
            homeBoostInfoBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                this.goToBoostShop();
            };
        }

        const animalActions = [
            { buyId: "homeBuyMonkeyBtn", upgradeId: "homeUpgradeMonkeyBtn", type: "monkey" },
            { buyId: "homeBuyPandaBtn", upgradeId: "homeUpgradePandaBtn", type: "panda" },
            { buyId: "homeBuyLionBtn", upgradeId: "homeUpgradeLionBtn", type: "lion" }
        ];

        animalActions.forEach((item) => {
            const buyBtn = document.getElementById(item.buyId);
            if (buyBtn && !buyBtn.dataset.bound) {
                buyBtn.dataset.bound = "1";
                buyBtn.onclick = () => {
                    CryptoZoo.audio?.play?.("click");
                    CryptoZoo.animalsSystem?.buy?.(item.type);
                };
            }

            const upgradeBtn = document.getElementById(item.upgradeId);
            if (upgradeBtn && !upgradeBtn.dataset.bound) {
                upgradeBtn.dataset.bound = "1";
                upgradeBtn.onclick = () => {
                    CryptoZoo.audio?.play?.("click");
                    CryptoZoo.animalsSystem?.upgrade?.(item.type);
                };
            }
        });

        const settingsBtn = document.getElementById("topSettingsBtn");
        if (settingsBtn && !settingsBtn.dataset.bound) {
            settingsBtn.dataset.bound = "1";
            settingsBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                CryptoZoo.uiSettings?.openSettingsModal?.();
            };
        }

        const eventsBtn = document.getElementById("topEventsBtn");
        if (eventsBtn && !eventsBtn.dataset.bound) {
            eventsBtn.dataset.bound = "1";
            eventsBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                this.showToast(this.t("eventsSoon", "Eventy / daily rewards w przygotowaniu"));
            };
        }
    },

    renderBoostStatus() {
        const isActive = CryptoZoo.boostSystem?.isActive?.() || false;
        const left = CryptoZoo.boostSystem?.getTimeLeft?.() || 0;

        const homeStatus = document.getElementById("homeBoostStatus");
        const shopStatus = document.getElementById("boostShopStatus");
        const buyBtn = document.getElementById("buyBoostBtn");
        const homeBtn = document.getElementById("homeBoostBtn");
        const incomeStrip = document.querySelector(".home-income-strip");
        const tapButton = document.getElementById("tapButton");

        if (homeStatus) {
            homeStatus.className = "home-boost-status";
        }

        if (isActive) {
            const timeText = this.formatTimeLeft(left);
            const text = `⚡ ${this.t("active", "Aktywny")} • ${timeText}`;

            if (homeStatus) {
                homeStatus.textContent = text;
                homeStatus.classList.add("boost-active");
            }

            if (shopStatus) {
                shopStatus.textContent = text;
            }

            if (buyBtn) {
                buyBtn.disabled = true;
                buyBtn.textContent = this.t("boostActive", "Boost aktywny");
            }

            if (homeBtn) {
                homeBtn.classList.add("boost-active");
                homeBtn.textContent = this.t("active", "Aktywny");
            }

            if (incomeStrip) {
                incomeStrip.classList.add("boost-active");
            }

            if (tapButton) {
                tapButton.classList.add("boost-active");
            }
        } else {
            if (homeStatus) {
                homeStatus.textContent = this.t("inactive", "Nieaktywny");
                homeStatus.classList.remove("boost-active");
            }

            if (shopStatus) {
                shopStatus.textContent = this.t("inactive", "Nieaktywny");
            }

            if (buyBtn) {
                buyBtn.disabled = false;
                buyBtn.textContent = this.t("buyX2Boost", "Kup X2 Boost");
            }

            if (homeBtn) {
                homeBtn.classList.remove("boost-active");
                homeBtn.textContent = this.t("activate", "Aktywuj");
            }

            if (incomeStrip) {
                incomeStrip.classList.remove("boost-active");
            }

            if (tapButton) {
                tapButton.classList.remove("boost-active");
            }
        }
    },

    renderHome() {
        const state = CryptoZoo.state || {};
        const animals = state.animals || {};
        const animalsConfig = CryptoZoo.config?.animals || {};
        const boostMultiplier = CryptoZoo.boostSystem?.getMultiplier?.() || 1;

        const effectiveCoinsPerClick =
            CryptoZoo.gameplay?.getEffectiveCoinsPerClick?.(1) ||
            Number(state.coinsPerClick) ||
            1;

        const effectiveZooIncome = (Number(state.zooIncome) || 0) * boostMultiplier;

        const monkeyCount = Math.max(0, Number(animals.monkey?.count) || 0);
        const pandaCount = Math.max(0, Number(animals.panda?.count) || 0);
        const lionCount = Math.max(0, Number(animals.lion?.count) || 0);

        const monkeyLevel = monkeyCount > 0 ? Math.max(1, Number(animals.monkey?.level) || 1) : 0;
        const pandaLevel = pandaCount > 0 ? Math.max(1, Number(animals.panda?.level) || 1) : 0;
        const lionLevel = lionCount > 0 ? Math.max(1, Number(animals.lion?.level) || 1) : 0;

        this.updateText("homeCoins", CryptoZoo.formatNumber(state.coins || 0));
        this.updateText("homeGems", CryptoZoo.formatNumber(state.gems || 0));
        this.updateText("homeRewardBalance", CryptoZoo.formatNumber(state.rewardBalance || 0));
        this.updateText("homeLevel", CryptoZoo.formatNumber(state.level || 1));
        this.updateText("homeCoinsPerClick", CryptoZoo.formatNumber(effectiveCoinsPerClick));
        this.updateText("homeZooIncomeStat", CryptoZoo.formatNumber(effectiveZooIncome));
        this.updateText("homeIncomeStripValue", CryptoZoo.formatNumber(effectiveZooIncome));

        this.updateText("homeMonkeyName", this.getLocalizedAnimalName("monkey", animalsConfig.monkey));
        this.updateText("homePandaName", this.getLocalizedAnimalName("panda", animalsConfig.panda));
        this.updateText("homeLionName", this.getLocalizedAnimalName("lion", animalsConfig.lion));

        this.updateText("homeMonkeyCount", CryptoZoo.formatNumber(monkeyCount));
        this.updateText("homeMonkeyLevel", CryptoZoo.formatNumber(monkeyLevel));
        this.updateText("homePandaCount", CryptoZoo.formatNumber(pandaCount));
        this.updateText("homePandaLevel", CryptoZoo.formatNumber(pandaLevel));
        this.updateText("homeLionCount", CryptoZoo.formatNumber(lionCount));
        this.updateText("homeLionLevel", CryptoZoo.formatNumber(lionLevel));

        this.renderXpBar();

        CryptoZoo.uiProfile?.renderTopBarProfile?.();
        CryptoZoo.uiProfile?.bindProfileModal?.();
        CryptoZoo.uiSettings?.bindSettingsModal?.();
        this.bindHomeButtons();
        this.renderBoostStatus();
        this.renderOfflineInfo();
        this.renderDailyRewardStatus();
        this.removeGuideCard();
    },

    renderTopHiddenStats() {
        const state = CryptoZoo.state || {};
        const boostMultiplier = CryptoZoo.boostSystem?.getMultiplier?.() || 1;

        const effectiveCoinsPerClick =
            CryptoZoo.gameplay?.getEffectiveCoinsPerClick?.(1) ||
            Number(state.coinsPerClick) ||
            1;

        const effectiveZooIncome = (Number(state.zooIncome) || 0) * boostMultiplier;

        this.updateText("coins", CryptoZoo.formatNumber(state.coins || 0));
        this.updateText("gems", CryptoZoo.formatNumber(state.gems || 0));
        this.updateText("rewardBalance", CryptoZoo.formatNumber(state.rewardBalance || 0));
        this.updateText("level", CryptoZoo.formatNumber(state.level || 1));
        this.updateText("coinsPerClick", CryptoZoo.formatNumber(effectiveCoinsPerClick));
        this.updateText("zooIncome", CryptoZoo.formatNumber(effectiveZooIncome));
    },

    renderZooList() {
        const zooList = document.getElementById("zooList");
        if (!zooList) return;

        const animalsConfig = CryptoZoo.config?.animals || {};
        const animalsState = CryptoZoo.state?.animals || {};

        zooList.innerHTML = Object.keys(animalsConfig).map((type) => {
            const config = animalsConfig[type];
            const state = animalsState[type] || { count: 0, level: 1 };
            const count = Math.max(0, Number(state.count) || 0);
            const displayLevel = count > 0 ? Math.max(1, Number(state.level) || 1) : 0;
            const upgradeCost = CryptoZoo.animalsSystem?.getUpgradeCost?.(type) || 0;
            const localizedName = this.getLocalizedAnimalName(type, config);

            return `
                <div class="animal-row">
                    <div class="animal-left">
                        <div class="animal-icon">
                            <img src="assets/animals/${config.asset}.png" alt="${localizedName}">
                        </div>

                        <div class="animal-text">
                            <div class="animal-name">${localizedName}</div>
                            <div class="animal-desc">
                                ${this.t("incomePerSec", "Dochód")} ${CryptoZoo.formatNumber(config.baseIncome)}/${this.t("secShort", "sek")} • ${this.t("cost", "Koszt")} ${CryptoZoo.formatNumber(config.buyCost)}
                            </div>
                            <div class="animal-owned">
                                ${this.t("owned", "Posiadane")}: ${CryptoZoo.formatNumber(count)} • ${this.t("level", "Poziom")}: ${CryptoZoo.formatNumber(displayLevel)}
                            </div>
                        </div>
                    </div>

                    <div class="animal-actions">
                        <button id="buy-${type}-btn" type="button">${this.t("buy", "Kup")}</button>
                        <button id="upgrade-${type}-btn" type="button">${this.t("lvlUp", "Lvl Up")} (${CryptoZoo.formatNumber(upgradeCost)})</button>
                    </div>
                </div>
            `;
        }).join("");

        CryptoZoo.animalsSystem?.bindButtons?.();
    },

    renderDailyMissionsSection() {
        const allMissions = CryptoZoo.dailyMissions?.getAll?.() || [];
        const visibleMission =
            CryptoZoo.dailyMissions?.getVisibleMission?.() ||
            allMissions.find((mission) => !mission.claimed) ||
            allMissions[allMissions.length - 1] ||
            null;

        const completedCount = allMissions.filter((mission) => !!mission.claimed).length;
        const totalCount = allMissions.length;
        const remainingCount = Math.max(0, totalCount - completedCount);

        let missionCardHtml = `
            <div class="expedition-card" style="margin-bottom:12px;">
                <h3>🎯 ${this.t("dailyMission", "Daily Mission")}</h3>
                <div style="color:rgba(255,255,255,0.72);">${this.t("noMissionsToday", "Brak misji na dzisiaj")}</div>
            </div>
        `;

        if (visibleMission) {
            const target = Math.max(1, Number(visibleMission.target) || 1);
            const progress = Math.max(0, Number(visibleMission.progress) || 0);
            const safeProgress = Math.min(progress, target);
            const percent = Math.max(0, Math.min(100, (safeProgress / target) * 100));
            const isCompleted = !!CryptoZoo.dailyMissions?.isCompleted?.(visibleMission);
            const isClaimed = !!visibleMission.claimed;
            const isAllClaimed = totalCount > 0 && completedCount >= totalCount;

            let statusText = this.t("inProgress", "In progress");
            if (isClaimed) statusText = this.t("claimed", "Claimed");
            else if (isCompleted) statusText = this.t("ready", "Ready");

            let buttonLabel = this.t("inProgress", "In progress");
            let buttonDisabled = true;

            if (isClaimed) {
                buttonLabel = this.t("claimed", "Claimed");
                buttonDisabled = true;
            } else if (isCompleted) {
                buttonLabel = this.t("claim", "Claim");
                buttonDisabled = false;
            }

            const rewardText = visibleMission.rewardGems > 0
                ? `+${CryptoZoo.formatNumber(visibleMission.rewardCoins)} ${this.t("coins", "coins")} • +${CryptoZoo.formatNumber(visibleMission.rewardGems)} ${this.t("gem", "gem")}`
                : `+${CryptoZoo.formatNumber(visibleMission.rewardCoins)} ${this.t("coins", "coins")}`;

            const queueText = isAllClaimed
                ? this.t("allDailyMissionsCompleted", "All daily missions completed")
                : remainingCount > 1
                    ? `${this.t("nextMissionsLocked", "Next missions locked")}: ${CryptoZoo.formatNumber(Math.max(0, remainingCount - 1))}`
                    : this.t("lastMissionToday", "This is the last mission today");

            missionCardHtml = `
                <div class="expedition-card" style="margin-bottom:12px;">
                    <h3>🎯 ${this.t("dailyMission", "Daily Mission")}</h3>
                    <div style="font-size:15px; font-weight:900; margin-top:6px;">${visibleMission.title}</div>
                    <div style="margin-top:8px;">${this.t("status", "Status")}: ${statusText}</div>
                    <div>${this.t("progress", "Progress")}: ${CryptoZoo.formatNumber(safeProgress)} / ${CryptoZoo.formatNumber(target)}</div>
                    <div style="margin-top:8px; width:100%; height:10px; border-radius:999px; background:rgba(255,255,255,0.08); overflow:hidden;">
                        <div style="width:${percent}%; height:100%; border-radius:999px; background:linear-gradient(90deg,#4facfe 0%, #00f2fe 100%);"></div>
                    </div>
                    <div style="margin-top:8px;">${this.t("reward", "Reward")}: ${rewardText}</div>
                    <div style="margin-top:8px; font-size:12px; color:rgba(255,255,255,0.68);">${queueText}</div>
                    <button
                        id="claim-mission-${visibleMission.id}"
                        type="button"
                        ${buttonDisabled ? "disabled" : ""}
                        style="${buttonDisabled ? "opacity:0.72; cursor:not-allowed;" : ""} margin-top:10px;"
                    >${buttonLabel}</button>
                </div>
            `;
        }

        return `
            <div class="expedition-card" style="margin-bottom:12px;">
                <h3>📅 ${this.t("dailyMissions", "Daily Missions")}</h3>
                <div>${this.t("completed", "Completed")}: ${CryptoZoo.formatNumber(completedCount)} / ${CryptoZoo.formatNumber(totalCount)}</div>
            </div>
            ${missionCardHtml}
        `;
    },

    bindDailyMissionButtons() {
        const mission =
            CryptoZoo.dailyMissions?.getVisibleMission?.() ||
            null;

        if (!mission) return;

        const isCompleted = !!CryptoZoo.dailyMissions?.isCompleted?.(mission);
        if (!isCompleted || mission.claimed) return;

        this.bindClick(`claim-mission-${mission.id}`, () => {
            CryptoZoo.dailyMissions?.claimMission?.(mission.id);
        });
    },

    renderExpeditions() {
        const container = document.getElementById("missionsList");
        if (!container) return;

        const dailyMissionsHtml = this.renderDailyMissionsSection();
        const expedition = CryptoZoo.state?.expedition;

        if (expedition) {
            const now = Date.now();
            const timeLeft = Math.max(0, Math.floor((expedition.endTime - now) / 1000));
            const canCollect = timeLeft <= 0;
            const rewardBalanceAmount = Math.max(
                0,
                Number(CryptoZoo.expeditions?.getRewardBalanceAmount?.(expedition)) || 0
            );

            const expeditionConfig = CryptoZoo.expeditions?.getById?.(expedition.id);
            const expeditionName = expeditionConfig
                ? this.getLocalizedExpeditionName(expeditionConfig)
                : (expedition.name || this.t("activeExpedition", "Aktywna ekspedycja"));

            const rarityMap = {
                common: this.t("common", "Common"),
                rare: this.t("rare", "Rare"),
                epic: this.t("epic", "Epic")
            };

            const timeBoostChargesCount =
                CryptoZoo.expeditions?.getTimeBoostChargesCount?.() ||
                CryptoZoo.state?.expeditionStats?.timeBoostCharges?.length ||
                0;

            container.innerHTML = `
                ${dailyMissionsHtml}
                <div class="expedition-card">
                    <h3>${this.t("activeExpedition", "Aktywna ekspedycja")}: ${expeditionName}</h3>
                    <div>${this.t("timeLeft", "Pozostało")}: ${this.formatTimeLeft(timeLeft)}</div>
                    <div>${this.t("rewardQuality", "Jakość nagrody")}: ${rarityMap[expedition.rewardRarity] || this.t("common", "Common")}</div>
                    <div>
                        ${this.t("expectedReward", "Przewidywana nagroda")}:
                        ${CryptoZoo.formatNumber(expedition.rewardCoins)} ${this.t("coins", "coins")} +
                        ${CryptoZoo.formatNumber(expedition.rewardGems)} ${this.t("gems", "gems")}
                    </div>
                    <div>
                        ${this.t("rewardWallet", "Reward Wallet")}:
                        ${rewardBalanceAmount.toFixed(3)} ${this.t("rewardWord", "reward")}
                    </div>
                    ${
                        canCollect
                            ? `
                                <button id="collect-expedition-btn" type="button">
                                    ${this.t("collectReward", "Odbierz nagrodę")}
                                </button>
                            `
                            : timeBoostChargesCount > 0
                                ? `
                                    <button id="use-expedition-time-boost-btn" type="button">
                                        ⏩ ${this.t("useTimeReduction", "Użyj skracania czasu")} (${CryptoZoo.formatNumber(timeBoostChargesCount)})
                                    </button>
                                `
                                : `
                                    <button id="collect-expedition-btn" type="button" disabled>
                                        ${this.t("expeditionInProgress", "Trwa ekspedycja")}
                                    </button>
                                `
                    }
                </div>
            `;

            this.bindDailyMissionButtons();

            if (canCollect) {
                this.bindClick("collect-expedition-btn", () => {
                    CryptoZoo.expeditions?.collect?.();
                });
            }

            if (!canCollect && timeBoostChargesCount > 0) {
                this.bindClick("use-expedition-time-boost-btn", () => {
                    CryptoZoo.expeditions?.useTimeBoostOnActiveExpedition?.();
                });
            }

            return;
        }

        const expeditions = CryptoZoo.config?.expeditions || [];
        const rareBonus = Math.max(
            0,
            Number(CryptoZoo.expeditions?.getRareChanceBonus?.() || 0)
        );
        const epicBonus = Math.max(
            0,
            Number(CryptoZoo.expeditions?.getEpicChanceBonus?.() || 0)
        );
        const timeBoostChargesCount =
            CryptoZoo.expeditions?.getTimeBoostChargesCount?.() ||
            CryptoZoo.state?.expeditionStats?.timeBoostCharges?.length ||
            0;

        const expeditionInfoCard = `
            <div class="expedition-card" style="margin-bottom:12px;">
                <h3>🧭 ${this.t("expeditionUpgrades", "Expedition Upgrades")}</h3>
                <div>${this.t("rareBonus", "Rare bonus")}: +${(rareBonus * 100).toFixed(0)}%</div>
                <div>${this.t("epicBonus", "Epic bonus")}: +${(epicBonus * 100).toFixed(0)}%</div>
                <div>${this.t("timeBoostsAvailable", "Time boosts available")}: ${CryptoZoo.formatNumber(timeBoostChargesCount)}</div>
            </div>
        `;

        container.innerHTML = dailyMissionsHtml + expeditionInfoCard + expeditions.map((exp) => {
            const rewardRangeText = this.getExpeditionRewardRangeText(exp);
            const isUnlocked = CryptoZoo.expeditions?.isUnlocked?.(exp) || false;
            const requiredLevel = CryptoZoo.expeditions?.getUnlockRequirement?.(exp) || 1;
            const buttonLabel = isUnlocked ? this.t("start", "Start") : `${this.t("lvl", "Lvl")} ${CryptoZoo.formatNumber(requiredLevel)}`;

            const effectiveDuration =
                CryptoZoo.expeditions?.getEffectiveDurationSeconds?.(exp) ||
                Number(exp.duration || 0);

            const effectiveRareChance =
                CryptoZoo.expeditions?.getEffectiveRareChance?.(exp) ||
                Number(exp.rareChance || 0);

            const effectiveEpicChance =
                CryptoZoo.expeditions?.getEffectiveEpicChance?.(exp) ||
                Number(exp.epicChance || 0);

            const expeditionName = this.getLocalizedExpeditionName(exp);

            return `
                <div class="expedition-card">
                    <h3>${expeditionName}</h3>
                    <div>${this.t("time", "Czas")}: ${this.formatTimeLeft(effectiveDuration)}</div>
                    <div>
                        ${this.t("baseReward", "Nagroda bazowa")}:
                        ${CryptoZoo.formatNumber(exp.baseCoins)} ${this.t("coins", "coins")} +
                        ${CryptoZoo.formatNumber(exp.baseGems)} ${this.t("gems", "gems")}
                    </div>
                    <div>
                        ${this.t("rewardWallet", "Reward Wallet")}: ${rewardRangeText}
                    </div>
                    <div>
                        ${this.t("requiredLevel", "Wymagany poziom")}: ${CryptoZoo.formatNumber(requiredLevel)}
                    </div>
                    <div>
                        ${this.t("bonusChance", "Szansa na bonus")}:
                        ${this.t("rare", "Rare")} ${(effectiveRareChance * 100).toFixed(0)}% /
                        ${this.t("epic", "Epic")} ${(effectiveEpicChance * 100).toFixed(0)}%
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

        this.bindDailyMissionButtons();

        expeditions.forEach((exp) => {
            if (CryptoZoo.expeditions?.isUnlocked?.(exp)) {
                this.bindClick(`start-expedition-${exp.id}`, () => {
                    CryptoZoo.expeditions?.start?.(exp.id);
                });
            }
        });
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
};