window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiHome = {
    bindHomeButtons() {
        const boostBtn = document.getElementById("homeBoostBtn");
        if (boostBtn && !boostBtn.dataset.bound) {
            boostBtn.dataset.bound = "1";
            boostBtn.onclick = () => {
                const gems = Number(CryptoZoo.state?.gems) || 0;

                if (CryptoZoo.boostSystem?.isActive?.()) {
                    const left = CryptoZoo.boostSystem?.getTimeLeft?.() || 0;
                    CryptoZoo.ui?.showToast?.(`Boost aktywny: ${CryptoZoo.ui?.formatTimeLeft?.(left) || "00:00:00"}`);
                    return;
                }

                if (gems >= 1) {
                    CryptoZoo.boostSystem?.activate?.();
                    return;
                }

                CryptoZoo.ui?.goToBoostShop?.();
                CryptoZoo.ui?.showToast?.("Potrzebujesz 1 gema na X2 Boost");
            };
        }

        const zooPreviewBtn = document.getElementById("homeZooPreviewBtn");
        if (zooPreviewBtn && !zooPreviewBtn.dataset.bound) {
            zooPreviewBtn.dataset.bound = "1";
            zooPreviewBtn.onclick = () => {
                CryptoZoo.navigation?.show?.("zoo");
            };
        }

        const homeDailyBtn = document.getElementById("homeDailyBtn");
        if (homeDailyBtn && !homeDailyBtn.dataset.bound) {
            homeDailyBtn.dataset.bound = "1";
            homeDailyBtn.onclick = () => {
                CryptoZoo.dailyReward?.claim?.();
            };
        }

        const homeEventsBtn = document.getElementById("homeEventsBtn");
        if (homeEventsBtn && !homeEventsBtn.dataset.bound) {
            homeEventsBtn.dataset.bound = "1";
            homeEventsBtn.onclick = () => {
                CryptoZoo.ui?.showToast?.("Eventy w przygotowaniu");
            };
        }

        const homeBoostInfoBtn = document.getElementById("homeBoostInfoBtn");
        if (homeBoostInfoBtn && !homeBoostInfoBtn.dataset.bound) {
            homeBoostInfoBtn.dataset.bound = "1";
            homeBoostInfoBtn.onclick = () => {
                CryptoZoo.ui?.goToBoostShop?.();
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
                    CryptoZoo.animalsSystem?.buy?.(item.type);
                };
            }

            const upgradeBtn = document.getElementById(item.upgradeId);
            if (upgradeBtn && !upgradeBtn.dataset.bound) {
                upgradeBtn.dataset.bound = "1";
                upgradeBtn.onclick = () => {
                    CryptoZoo.animalsSystem?.upgrade?.(item.type);
                };
            }
        });

        const settingsBtn = document.getElementById("topSettingsBtn");
        if (settingsBtn && !settingsBtn.dataset.bound) {
            settingsBtn.dataset.bound = "1";
            settingsBtn.onclick = () => {
                CryptoZoo.uiSettings?.openSettingsModal?.();
            };
        }

        const eventsBtn = document.getElementById("topEventsBtn");
        if (eventsBtn && !eventsBtn.dataset.bound) {
            eventsBtn.dataset.bound = "1";
            eventsBtn.onclick = () => {
                CryptoZoo.ui?.showToast?.("Eventy / daily rewards w przygotowaniu");
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
            const timeText = CryptoZoo.ui?.formatTimeLeft?.(left) || "00:00:00";
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
        const timeLeftMs = Math.max(0, Number(CryptoZoo.dailyReward?.getTimeLeftMs?.()) || 0);
        const timeLeftSeconds = Math.ceil(timeLeftMs / 1000);

        const rewardCoins = Math.max(0, Number(CryptoZoo.dailyReward?.getCoinsAmount?.()) || 0);
        const rewardGems = Math.max(0, Number(CryptoZoo.dailyReward?.getGemsAmount?.()) || 0);
        const streak = Math.max(0, Number(CryptoZoo.dailyReward?.getStreak?.()) || 0);
        const streakLabel = `Day ${Math.max(1, streak || 1)}`;

        titleEl.textContent = "Daily Reward";
        subtitleEl.style.whiteSpace = "normal";
        subtitleEl.style.wordBreak = "break-word";
        subtitleEl.style.overflowWrap = "anywhere";
        subtitleEl.style.lineHeight = "1.35";

        if (!isUnlocked) {
            subtitleEl.textContent = `Unlock in ${CryptoZoo.ui?.formatTimeLeft?.(timeLeftSeconds) || "00:00:00"}`;
            iconEl.textContent = "🔒";
            return;
        }

        if (canClaim) {
            subtitleEl.textContent =
                rewardGems > 0
                    ? `${streakLabel} • READY • ${CryptoZoo.formatNumber(rewardCoins)} coins + ${CryptoZoo.formatNumber(rewardGems)} gem`
                    : `${streakLabel} • READY • ${CryptoZoo.formatNumber(rewardCoins)} coins`;
            iconEl.textContent = "🎁";
            return;
        }

        subtitleEl.textContent = `${streakLabel} • Next reward in ${CryptoZoo.ui?.formatTimeLeft?.(timeLeftSeconds) || "00:00:00"}`;
        iconEl.textContent = "⏳";
    },

    renderHome() {
        const state = CryptoZoo.state || {};
        const animals = state.animals || {};
        const boostMultiplier = CryptoZoo.boostSystem?.getMultiplier?.() || 1;

        const effectiveCoinsPerClick =
            CryptoZoo.gameplay?.getEffectiveCoinsPerClick?.(1) ||
            Number(state.coinsPerClick) ||
            1;

        const effectiveZooIncome =
            CryptoZoo.gameplay?.getEffectiveZooIncome?.() ??
            ((Number(state.zooIncome) || 0) * boostMultiplier);

        const monkeyCount = Math.max(0, Number(animals.monkey?.count) || 0);
        const pandaCount = Math.max(0, Number(animals.panda?.count) || 0);
        const lionCount = Math.max(0, Number(animals.lion?.count) || 0);

        const monkeyLevel = monkeyCount > 0 ? Math.max(1, Number(animals.monkey?.level) || 1) : 0;
        const pandaLevel = pandaCount > 0 ? Math.max(1, Number(animals.panda?.level) || 1) : 0;
        const lionLevel = lionCount > 0 ? Math.max(1, Number(animals.lion?.level) || 1) : 0;

        CryptoZoo.ui?.updateText?.("homeCoins", CryptoZoo.formatNumber(state.coins || 0));
        CryptoZoo.ui?.updateText?.("homeGems", CryptoZoo.formatNumber(state.gems || 0));
        CryptoZoo.ui?.updateText?.("homeRewardBalance", CryptoZoo.formatNumber(state.rewardBalance || 0));
        CryptoZoo.ui?.updateText?.("homeLevel", CryptoZoo.formatNumber(state.level || 1));
        CryptoZoo.ui?.updateText?.("homeCoinsPerClick", CryptoZoo.formatNumber(effectiveCoinsPerClick));
        CryptoZoo.ui?.updateText?.("homeZooIncomeStat", CryptoZoo.formatNumber(effectiveZooIncome));
        CryptoZoo.ui?.updateText?.("homeIncomeStripValue", CryptoZoo.formatNumber(effectiveZooIncome));

        CryptoZoo.ui?.updateText?.("homeMonkeyCount", CryptoZoo.formatNumber(monkeyCount));
        CryptoZoo.ui?.updateText?.("homeMonkeyLevel", CryptoZoo.formatNumber(monkeyLevel));
        CryptoZoo.ui?.updateText?.("homePandaCount", CryptoZoo.formatNumber(pandaCount));
        CryptoZoo.ui?.updateText?.("homePandaLevel", CryptoZoo.formatNumber(pandaLevel));
        CryptoZoo.ui?.updateText?.("homeLionCount", CryptoZoo.formatNumber(lionCount));
        CryptoZoo.ui?.updateText?.("homeLionLevel", CryptoZoo.formatNumber(lionLevel));

        CryptoZoo.uiProfile?.renderTopBarProfile?.();
        CryptoZoo.uiProfile?.bindProfileModal?.();
        CryptoZoo.uiSettings?.bindSettingsModal?.();

        this.bindHomeButtons();
        this.renderBoostStatus();
        this.renderOfflineInfo();
        this.renderDailyRewardStatus();

        const oldGuideCard = document.getElementById("homeGuideCard");
        if (oldGuideCard) {
            oldGuideCard.remove();
        }
    }
};