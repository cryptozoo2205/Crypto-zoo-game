window.CryptoZoo = window.CryptoZoo || {};
CryptoZoo.ui = CryptoZoo.ui || {};

Object.assign(CryptoZoo.ui, {
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
        const gameCard = document.querySelector("#screen-game .game-main-card");
        const incomeStrip = document.querySelector(".home-income-strip");

        if (!gameCard || !incomeStrip) return null;

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

        const offlineBoost = Math.max(
            1,
            Number(CryptoZoo.state?.offlineBoost) || 1
        );

        const boostLabel =
            offlineBoost > 1
                ? `Aktywny mnożnik offline x${CryptoZoo.formatNumber(offlineBoost)}`
                : "Standardowy mnożnik offline x1";

        bar.innerHTML = `
            <div style="font-size:13px; font-weight:900; margin-bottom:4px;">💤 Offline Earnings</div>
            <div style="color: rgba(255,255,255,0.78);">
                Limit bazowy: ${maxOfflineLabel} • ${boostLabel}
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
        const timeLeftMs = Math.max(
            0,
            Number(CryptoZoo.dailyReward?.getTimeLeftMs?.()) || 0
        );
        const timeLeftSeconds = Math.ceil(timeLeftMs / 1000);

        const rewardCoins = Math.max(
            0,
            Number(CryptoZoo.dailyReward?.getCoinsAmount?.()) || 0
        );
        const rewardGems = Math.max(
            0,
            Number(CryptoZoo.dailyReward?.getGemsAmount?.()) || 0
        );
        const streak = Math.max(
            0,
            Number(CryptoZoo.dailyReward?.getStreak?.()) || 0
        );
        const streakLabel = `Day ${Math.max(1, streak || 1)}`;

        titleEl.textContent = "Daily Reward";
        subtitleEl.style.whiteSpace = "normal";
        subtitleEl.style.wordBreak = "break-word";
        subtitleEl.style.overflowWrap = "anywhere";
        subtitleEl.style.lineHeight = "1.35";

        if (!isUnlocked) {
            subtitleEl.textContent = `Unlock in ${this.formatTimeLeft(timeLeftSeconds)}`;

            iconEl.textContent = "🔒";
            btn.dataset.dailyState = "locked";
            btn.style.opacity = "0.92";
            btn.style.filter = "none";
            btn.style.transform = "none";
            btn.style.background = "linear-gradient(180deg, rgba(18, 28, 48, 0.96) 0%, rgba(10, 17, 31, 0.95) 100%)";
            btn.style.borderColor = "rgba(255,255,255,0.08)";
            btn.style.boxShadow = "0 12px 22px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255,255,255,0.04)";
            iconEl.style.background = "rgba(255,255,255,0.06)";
            titleEl.style.color = "#ffffff";
            subtitleEl.style.color = "rgba(255,255,255,0.72)";
            return;
        }

        if (canClaim) {
            const rewardText =
                rewardGems > 0
                    ? `${streakLabel} • READY • ${CryptoZoo.formatNumber(rewardCoins)} coins + ${CryptoZoo.formatNumber(rewardGems)} gem`
                    : `${streakLabel} • READY • ${CryptoZoo.formatNumber(rewardCoins)} coins`;

            subtitleEl.textContent = rewardText;

            iconEl.textContent = "🎁";
            btn.dataset.dailyState = "ready";
            btn.style.opacity = "1";
            btn.style.filter = "none";
            btn.style.transform = "none";
            btn.style.background = "linear-gradient(180deg, rgba(34, 50, 84, 0.98) 0%, rgba(18, 28, 48, 0.98) 100%)";
            btn.style.borderColor = "rgba(255, 214, 92, 0.45)";
            btn.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(255,214,92,0.12), 0 0 18px rgba(255,214,92,0.16), inset 0 1px 0 rgba(255,255,255,0.06)";
            iconEl.style.background = "linear-gradient(180deg, rgba(255, 227, 122, 0.22) 0%, rgba(255, 191, 0, 0.10) 100%)";
            titleEl.style.color = "#fff4c4";
            subtitleEl.style.color = "rgba(255,255,255,0.92)";
        } else {
            subtitleEl.textContent = `${streakLabel} • Next reward in ${this.formatTimeLeft(timeLeftSeconds)}`;

            iconEl.textContent = "⏳";
            btn.dataset.dailyState = "cooldown";
            btn.style.opacity = "0.95";
            btn.style.filter = "none";
            btn.style.transform = "none";
            btn.style.background = "linear-gradient(180deg, rgba(18, 28, 48, 0.96) 0%, rgba(10, 17, 31, 0.95) 100%)";
            btn.style.borderColor = "rgba(255,255,255,0.08)";
            btn.style.boxShadow = "0 12px 22px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255,255,255,0.04)";
            iconEl.style.background = "rgba(255,255,255,0.06)";
            titleEl.style.color = "#ffffff";
            subtitleEl.style.color = "rgba(255,255,255,0.72)";
        }
    },

    bindHomeButtons() {
        const boostBtn = document.getElementById("homeBoostBtn");
        if (boostBtn && !boostBtn.dataset.bound) {
            boostBtn.dataset.bound = "1";
            boostBtn.addEventListener("click", () => {
                const gameplay = CryptoZoo.gameplay;
                const state = CryptoZoo.state || {};
                const gems = Number(state.gems) || 0;

                if (gameplay?.isBoost2xActive?.()) {
                    const left = gameplay.getBoost2xTimeLeft?.() || 0;
                    this.showToast(`Boost aktywny: ${this.formatTimeLeft(left)}`);
                    return;
                }

                if (gems >= 1) {
                    gameplay?.activateBoost2x?.();
                    return;
                }

                this.goToBoostShop();
                this.showToast("Potrzebujesz 1 gema na X2 Boost");
            });
        }

        const zooPreviewBtn = document.getElementById("homeZooPreviewBtn");
        if (zooPreviewBtn && !zooPreviewBtn.dataset.bound) {
            zooPreviewBtn.dataset.bound = "1";
            zooPreviewBtn.addEventListener("click", () => {
                CryptoZoo.navigation?.show?.("zoo");
            });
        }

        const homeDailyBtn = document.getElementById("homeDailyBtn");
        if (homeDailyBtn && !homeDailyBtn.dataset.bound) {
            homeDailyBtn.dataset.bound = "1";
            homeDailyBtn.addEventListener("click", () => {
                CryptoZoo.dailyReward?.claim?.();
            });
        }

        const homeEventsBtn = document.getElementById("homeEventsBtn");
        if (homeEventsBtn && !homeEventsBtn.dataset.bound) {
            homeEventsBtn.dataset.bound = "1";
            homeEventsBtn.addEventListener("click", () => {
                this.showToast("Eventy w przygotowaniu");
            });
        }

        const homeBoostInfoBtn = document.getElementById("homeBoostInfoBtn");
        if (homeBoostInfoBtn && !homeBoostInfoBtn.dataset.bound) {
            homeBoostInfoBtn.dataset.bound = "1";
            homeBoostInfoBtn.addEventListener("click", () => {
                this.goToBoostShop();
            });
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
                buyBtn.addEventListener("click", () => {
                    CryptoZoo.gameplay?.buyAnimal?.(item.type);
                });
            }

            const upgradeBtn = document.getElementById(item.upgradeId);
            if (upgradeBtn && !upgradeBtn.dataset.bound) {
                upgradeBtn.dataset.bound = "1";
                upgradeBtn.addEventListener("click", () => {
                    CryptoZoo.gameplay?.upgradeAnimal?.(item.type);
                });
            }
        });

        const settingsBtn = document.getElementById("topSettingsBtn");
        if (settingsBtn && !settingsBtn.dataset.bound) {
            settingsBtn.dataset.bound = "1";
            settingsBtn.addEventListener("click", () => {
                CryptoZoo.uiSettings?.openSettingsModal?.();
            });
        }

        const eventsBtn = document.getElementById("topEventsBtn");
        if (eventsBtn && !eventsBtn.dataset.bound) {
            eventsBtn.dataset.bound = "1";
            eventsBtn.addEventListener("click", () => {
                this.showToast("Eventy / daily rewards w przygotowaniu");
            });
        }
    },

    renderBoostStatus() {
        const gameplay = CryptoZoo.gameplay;
        const isActive = gameplay?.isBoost2xActive?.() || false;
        const left = gameplay?.getBoost2xTimeLeft?.() || 0;

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
            const text = `⚡ Aktywny • ${timeText}`;

            if (homeStatus) {
                homeStatus.textContent = text;
                homeStatus.classList.add("boost-active");
            }

            if (shopStatus) {
                shopStatus.textContent = text;
            }

            if (buyBtn) {
                buyBtn.disabled = true;
                buyBtn.textContent = "Boost aktywny";
            }

            if (homeBtn) {
                homeBtn.classList.add("boost-active");
                homeBtn.textContent = "Aktywny";
            }

            if (incomeStrip) {
                incomeStrip.classList.add("boost-active");
            }

            if (tapButton) {
                tapButton.classList.add("boost-active");
            }
        } else {
            if (homeStatus) {
                homeStatus.textContent = "Nieaktywny";
                homeStatus.classList.remove("boost-active");
            }

            if (shopStatus) {
                shopStatus.textContent = "Nieaktywny";
            }

            if (buyBtn) {
                buyBtn.disabled = false;
                buyBtn.textContent = "Kup X2 Boost";
            }

            if (homeBtn) {
                homeBtn.classList.remove("boost-active");
                homeBtn.textContent = "Aktywuj";
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

        const effectiveCoinsPerClick =
            CryptoZoo.gameplay?.getEffectiveCoinsPerClick?.(1) ||
            Number(state.coinsPerClick) ||
            1;

        const effectiveZooIncome =
            CryptoZoo.gameplay?.getEffectiveZooIncome?.() ??
            ((Number(state.zooIncome) || 0) * (CryptoZoo.gameplay?.getBoost2xMultiplier?.() || 1));

        this.updateText("homeCoins", CryptoZoo.formatNumber(state.coins || 0));
        this.updateText("homeGems", CryptoZoo.formatNumber(state.gems || 0));
        this.updateText("homeRewardBalance", CryptoZoo.formatNumber(state.rewardBalance || 0));
        this.updateText("homeLevel", CryptoZoo.formatNumber(state.level || 1));
        this.updateText("homeCoinsPerClick", CryptoZoo.formatNumber(effectiveCoinsPerClick));
        this.updateText("homeZooIncomeStat", CryptoZoo.formatNumber(effectiveZooIncome));
        this.updateText("homeIncomeStripValue", CryptoZoo.formatNumber(effectiveZooIncome));

        this.updateText("homeMonkeyCount", CryptoZoo.formatNumber(animals.monkey?.count || 0));
        this.updateText("homeMonkeyLevel", CryptoZoo.formatNumber(animals.monkey?.level || 1));
        this.updateText("homePandaCount", CryptoZoo.formatNumber(animals.panda?.count || 0));
        this.updateText("homePandaLevel", CryptoZoo.formatNumber(animals.panda?.level || 1));
        this.updateText("homeLionCount", CryptoZoo.formatNumber(animals.lion?.count || 0));
        this.updateText("homeLionLevel", CryptoZoo.formatNumber(animals.lion?.level || 1));

        CryptoZoo.uiProfile?.renderTopBarProfile?.();
        CryptoZoo.uiProfile?.bindProfileModal?.();
        CryptoZoo.uiSettings?.bindSettingsModal?.();
        this.bindHomeButtons();
        this.renderBoostStatus();
        this.renderOfflineInfo();
        this.renderDailyRewardStatus();
    },

    renderTopHiddenStats() {
        const state = CryptoZoo.state || {};

        const effectiveCoinsPerClick =
            CryptoZoo.gameplay?.getEffectiveCoinsPerClick?.(1) ||
            Number(state.coinsPerClick) ||
            1;

        const effectiveZooIncome =
            CryptoZoo.gameplay?.getEffectiveZooIncome?.() ??
            ((Number(state.zooIncome) || 0) * (CryptoZoo.gameplay?.getBoost2xMultiplier?.() || 1));

        this.updateText("coins", CryptoZoo.formatNumber(state.coins || 0));
        this.updateText("gems", CryptoZoo.formatNumber(state.gems || 0));
        this.updateText("rewardBalance", CryptoZoo.formatNumber(state.rewardBalance || 0));
        this.updateText("level", CryptoZoo.formatNumber(state.level || 1));
        this.updateText("coinsPerClick", CryptoZoo.formatNumber(effectiveCoinsPerClick));
        this.updateText("zooIncome", CryptoZoo.formatNumber(effectiveZooIncome));
    }
});