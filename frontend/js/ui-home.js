window.CryptoZoo = window.CryptoZoo || {};
CryptoZoo.ui = CryptoZoo.ui || {};

Object.assign(CryptoZoo.ui, {
    getOfflineAdRewardHours() {
        const value = Number(CryptoZoo.offlineAds?.HOURS_PER_AD);
        return Number.isFinite(value) && value > 0 ? value : 0.5;
    },

    renderOfflineInfo() {
        const mainText = document.getElementById("homeOfflineMainText");
        const subText = document.getElementById("homeOfflineSubText");
        const adBtn = document.getElementById("watchOfflineAdBtn");

        if (!mainText || !subText || !adBtn) return;

        CryptoZoo.offlineAds?.ensureState?.();

        const adsHours = Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getCurrentHours?.() || 0)
        );

        const maxAds = Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getMaxHours?.() || 3)
        );

        const canWatchAd = !!CryptoZoo.offlineAds?.canWatchAd?.();

        const adRewardHours = Math.max(0.5, Number(this.getOfflineAdRewardHours()) || 0.5);
        const maxSlots = Math.max(1, Math.round(maxAds / adRewardHours));
        const activeSlots = Math.max(0, Math.min(maxSlots, Math.round(adsHours / adRewardHours)));

        let barsHtml = '<div class="home-offline-bars" style="display:flex;gap:6px;align-items:center;flex-wrap:nowrap;margin-top:2px;">';

        for (let i = 0; i < maxSlots; i++) {
            const active = i < activeSlots;

            barsHtml += `
                <div
                    style="
                        width:18px;
                        height:8px;
                        border-radius:999px;
                        background:${active ? "linear-gradient(180deg,#53f28a 0%,#1db954 100%)" : "rgba(255,255,255,0.14)"};
                        border:1px solid ${active ? "rgba(110,255,160,0.55)" : "rgba(255,255,255,0.08)"};
                        box-shadow:${active ? "0 0 10px rgba(83,242,138,0.28)" : "none"};
                        flex:0 0 auto;
                    "
                ></div>
            `;
        }

        barsHtml += "</div>";

        mainText.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="font-size:14px;font-weight:800;color:#ffffff;line-height:1.1;">
                    ${activeSlots}/${maxSlots} aktywne
                </div>
                ${barsHtml}
            </div>
        `;

        const currentMinutes = Math.max(0, Math.floor(adsHours * 60));
        const maxMinutes = Math.max(0, Math.floor(maxAds * 60));

        if (activeSlots <= 0) {
            subText.textContent = `Pakiet offline: 0m / ${maxMinutes}m`;
        } else if (activeSlots >= maxSlots) {
            subText.textContent = `Pakiet offline: ${currentMinutes}m / ${maxMinutes}m • MAX`;
        } else {
            subText.textContent = `Pakiet offline: ${currentMinutes}m / ${maxMinutes}m`;
        }

        if (CryptoZoo.ads?.isLoading) {
            adBtn.disabled = true;
            adBtn.textContent = "⏳ Reklama...";
            return;
        }

        if (!canWatchAd) {
            adBtn.disabled = true;
            adBtn.textContent = "⏳ MAX";
            return;
        }

        adBtn.disabled = false;
        adBtn.textContent = "📺 +30m";
    },

    ensureOfflineInfoTimerRunning() {
        if (this.offlineInfoTimer) return;

        this.offlineInfoTimer = setInterval(() => {
            const activeScreen = CryptoZoo.gameplay?.activeScreen || "game";
            if (activeScreen !== "game") return;

            this.renderOfflineInfo();
        }, 1000);
    },

    getDailyRewardDisplayDay() {
        const dailyReward = CryptoZoo.dailyReward;
        if (!dailyReward) return 1;

        const hasClaimedAtLeastOnce = !!dailyReward.hasClaimedAtLeastOnce?.();
        if (!hasClaimedAtLeastOnce) {
            return 1;
        }

        return Math.max(1, Number(dailyReward.getNextClaimDay?.()) || 1);
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
        const displayDay = this.getDailyRewardDisplayDay();

        titleEl.textContent = this.t("dailyReward", "Daily Reward");

        subtitleEl.style.whiteSpace = "";
        subtitleEl.style.wordBreak = "";
        subtitleEl.style.overflowWrap = "";
        subtitleEl.style.lineHeight = "";

        if (!isUnlocked) {
            const unlockSeconds = Math.max(
                0,
                Number(CryptoZoo.dailyReward?.getRemainingUnlockSeconds?.()) || 0
            );

            subtitleEl.textContent = `🔒 ${this.formatTimeLeft(unlockSeconds)}`;
            iconEl.textContent = "🔒";
            return;
        }

        if (canClaim) {
            subtitleEl.textContent = `${this.t("day", "Day")} ${displayDay} • ${this.t("ready", "READY")}`;
            iconEl.textContent = "🎁";
            return;
        }

        subtitleEl.textContent = `${this.t("day", "Day")} ${displayDay} • ${this.formatTimeLeft(timeLeftSeconds)}`;
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

                if (gems >= 3) {
                    CryptoZoo.state.gems = Math.max(0, gems - 3);

                    CryptoZoo.boostSystem?.activate?.();
                    CryptoZoo.ui?.render?.();
                    CryptoZoo.api?.savePlayer?.();
                    return;
                }

                this.goToBoostShop();
                this.showToast(this.t("needGemBoost", "Potrzebujesz 3 gemy na X2 Boost"));
            };
        }

        const zooPreviewBtn = document.getElementById("homeZooPreviewBtn");
        if (zooPreviewBtn && !zooPreviewBtn.dataset.bound) {
            zooPreviewBtn.dataset.bound = "1";
            zooPreviewBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                CryptoZoo.gameplay?.showScreen?.("zoo");
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
        this.renderDailyRewardStatus();
        this.renderOfflineInfo();
        this.ensureOfflineInfoTimerRunning();
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
    }
});