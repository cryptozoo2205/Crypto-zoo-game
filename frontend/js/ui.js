window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ui = {
    toastTimeout: null,
    rankingCache: null,
    rankingLoading: false,
    rankingLastFetchAt: 0,
    rankingCacheTtl: 15000,

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
            el.onclick = handler;
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

    ensureGuideCard() {
        const quickPanel = document.querySelector(".home-quick-panel");
        if (!quickPanel) return null;

        let card = document.getElementById("homeGuideCard");

        if (!card) {
            card = document.createElement("div");
            card.id = "homeGuideCard";
            card.style.width = "100%";
            card.style.marginTop = "10px";
            card.style.padding = "12px 14px";
            card.style.borderRadius = "16px";
            card.style.background = "linear-gradient(180deg, rgba(18, 28, 48, 0.96) 0%, rgba(10, 17, 31, 0.95) 100%)";
            card.style.border = "1px solid rgba(255,255,255,0.08)";
            card.style.boxShadow = "0 12px 22px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255,255,255,0.04)";
            card.style.color = "#ffffff";
            card.style.fontSize = "12px";
            card.style.fontWeight = "700";
            card.style.lineHeight = "1.5";

            quickPanel.insertAdjacentElement("afterend", card);
        }

        return card;
    },

    renderGuideCard() {
        const card = this.ensureGuideCard();
        if (!card) return;

        const level = Math.max(1, Number(CryptoZoo.state?.level) || 1);
        const zooIncome = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        const clickValue = Math.max(1, Number(CryptoZoo.state?.coinsPerClick) || 1);
        const nextLevelHint = CryptoZoo.formatNumber(level * 100);

        card.innerHTML = `
            <div style="font-size:13px; font-weight:900; margin-bottom:6px;">📘 Jak działa gra</div>
            <div style="color: rgba(255,255,255,0.88); margin-bottom:4px;">
                • Klikanie daje coins i XP. Im większy click value, tym mocniejsze tapnięcie.
            </div>
            <div style="color: rgba(255,255,255,0.88); margin-bottom:4px;">
                • Poziom gracza rośnie za XP i odblokowuje lepsze ekspedycje.
            </div>
            <div style="color: rgba(255,255,255,0.88); margin-bottom:4px;">
                • Kup zwierzę = więcej sztuk. Lvl Up = każda posiadana sztuka daje więcej income.
            </div>
            <div style="color: rgba(255,255,255,0.72);">
                Teraz: click ${CryptoZoo.formatNumber(clickValue)} • zoo ${CryptoZoo.formatNumber(zooIncome)}/sek • kolejny ważny próg levelu około ${nextLevelHint} XP
            </div>
        `;
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
            subtitleEl.textContent = `Unlock in ${this.formatTimeLeft(timeLeftSeconds)} • Daily odblokowuje się po czasie gry`;
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

        subtitleEl.textContent = `${streakLabel} • Next reward in ${this.formatTimeLeft(timeLeftSeconds)}`;
        iconEl.textContent = "⏳";
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
            endTime: Number(expeditionConfig.duration || 0) * 1000,
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
            return `${CryptoZoo.formatNumber(commonReward)} reward`;
        }

        return `${CryptoZoo.formatNumber(commonReward)} - ${CryptoZoo.formatNumber(epicReward)} reward`;
    },

    getShopItemDescription(item) {
        if (!item) return "";

        if (item.type === "click") {
            const bonus = Math.max(1, Number(item.clickValueBonus) || 1);
            return `Stały bonus: +${CryptoZoo.formatNumber(bonus)} do coins per click.`;
        }

        if (item.type === "income") {
            return "Stały bonus do dochodu zoo. Wzmacnia progres pasywny.";
        }

        if (item.type === "expedition") {
            return "Stały bonus do nagród z ekspedycji.";
        }

        if (item.type === "offline") {
            const multiplier = Math.max(1, Number(item.offlineMultiplier) || 2);
            const durationSeconds = Math.max(60, Number(item.offlineDurationSeconds) || 600);
            return `Czasowy bonus: x${CryptoZoo.formatNumber(multiplier)} offline income przez ${this.formatDurationLabel(durationSeconds)}.`;
        }

        return item.desc || "";
    },

    getShopItemPriceMeta(item) {
        if (!item) {
            return { label: "Koszt", value: "0" };
        }

        if (CryptoZoo.shopSystem?.getCurrentPriceMeta) {
            return CryptoZoo.shopSystem.getCurrentPriceMeta(item);
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
        return Math.max(0, Number(item.gemPrice) || 0) > 0 ? "Kup za gemy" : "Kup";
    },

    bindHomeButtons() {
        const boostBtn = document.getElementById("homeBoostBtn");
        if (boostBtn && !boostBtn.dataset.bound) {
            boostBtn.dataset.bound = "1";
            boostBtn.onclick = () => {
                const gems = Number(CryptoZoo.state?.gems) || 0;

                if (CryptoZoo.boostSystem?.isActive?.()) {
                    const left = CryptoZoo.boostSystem?.getTimeLeft?.() || 0;
                    this.showToast(`Boost aktywny: ${this.formatTimeLeft(left)}`);
                    return;
                }

                if (gems >= 1) {
                    CryptoZoo.boostSystem?.activate?.();
                    return;
                }

                this.goToBoostShop();
                this.showToast("Potrzebujesz 1 gema na X2 Boost");
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
                this.showToast("Eventy w przygotowaniu");
            };
        }

        const homeBoostInfoBtn = document.getElementById("homeBoostInfoBtn");
        if (homeBoostInfoBtn && !homeBoostInfoBtn.dataset.bound) {
            homeBoostInfoBtn.dataset.bound = "1";
            homeBoostInfoBtn.onclick = () => {
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
                this.showToast("Eventy / daily rewards w przygotowaniu");
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

        this.updateText("homeMonkeyCount", CryptoZoo.formatNumber(monkeyCount));
        this.updateText("homeMonkeyLevel", CryptoZoo.formatNumber(monkeyLevel));
        this.updateText("homePandaCount", CryptoZoo.formatNumber(pandaCount));
        this.updateText("homePandaLevel", CryptoZoo.formatNumber(pandaLevel));
        this.updateText("homeLionCount", CryptoZoo.formatNumber(lionCount));
        this.updateText("homeLionLevel", CryptoZoo.formatNumber(lionLevel));

        const monkeyUpgradeBtn = document.getElementById("homeUpgradeMonkeyBtn");
        if (monkeyUpgradeBtn) monkeyUpgradeBtn.title = "Lvl Up zwiększa dochód każdej posiadanej Monkey.";

        const pandaUpgradeBtn = document.getElementById("homeUpgradePandaBtn");
        if (pandaUpgradeBtn) pandaUpgradeBtn.title = "Lvl Up zwiększa dochód każdej posiadanej Panda.";

        const lionUpgradeBtn = document.getElementById("homeUpgradeLionBtn");
        if (lionUpgradeBtn) lionUpgradeBtn.title = "Lvl Up zwiększa dochód każdej posiadanej Lion.";

        CryptoZoo.uiProfile?.renderTopBarProfile?.();
        CryptoZoo.uiProfile?.bindProfileModal?.();
        CryptoZoo.uiSettings?.bindSettingsModal?.();
        this.bindHomeButtons();
        this.renderBoostStatus();
        this.renderOfflineInfo();
        this.renderDailyRewardStatus();
        this.renderGuideCard();
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
            const totalIncome = count * Math.max(1, displayLevel || 1) * (Number(config.baseIncome) || 0);

            return `
                <div class="animal-row">
                    <div class="animal-left">
                        <div class="animal-icon">
                            <img src="assets/animals/${config.asset}.png" alt="${config.name}">
                        </div>

                        <div class="animal-text">
                            <div class="animal-name">${config.name}</div>
                            <div class="animal-desc">
                                Bazowy dochód ${CryptoZoo.formatNumber(config.baseIncome)}/sek • Koszt kupna ${CryptoZoo.formatNumber(config.buyCost)}
                            </div>
                            <div class="animal-owned">
                                Posiadasz: ${CryptoZoo.formatNumber(count)} • Poziom: ${CryptoZoo.formatNumber(displayLevel)}
                            </div>
                            <div class="animal-owned" style="color:rgba(255,255,255,0.70);">
                                Kup zwiększa liczbę sztuk • Lvl Up zwiększa dochód każdej sztuki
                            </div>
                            <div class="animal-owned" style="color:rgba(255,255,255,0.60);">
                                Aktualny dochód tego gatunku: ${CryptoZoo.formatNumber(count > 0 ? totalIncome : 0)}/sek
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

        CryptoZoo.animalsSystem?.bindButtons?.();
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
                Number(CryptoZoo.expeditions?.getRewardBalanceAmount?.(expedition)) || 0
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
                    <div style="margin-top:6px; color:rgba(255,255,255,0.68); font-size:12px;">
                        Ekspedycje dają pasywne nagrody. Im dalej w grze, tym bardziej opłaca się wysyłać lepsze wyprawy.
                    </div>
                    <button id="collect-expedition-btn" type="button" ${canCollect ? "" : "disabled"}>
                        ${canCollect ? "Odbierz nagrodę" : "Trwa ekspedycja"}
                    </button>
                </div>
            `;

            this.bindClick("collect-expedition-btn", () => {
                CryptoZoo.expeditions?.collect?.();
            });

            return;
        }

        const expeditions = CryptoZoo.config?.expeditions || [];

        container.innerHTML = expeditions.map((exp) => {
            const rewardRangeText = this.getExpeditionRewardRangeText(exp);
            const isUnlocked = CryptoZoo.expeditions?.isUnlocked?.(exp) || false;
            const requiredLevel = CryptoZoo.expeditions?.getUnlockRequirement?.(exp) || 1;
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
                        Wymagany poziom gracza: ${CryptoZoo.formatNumber(requiredLevel)}
                    </div>
                    <div>
                        Szansa na bonus:
                        Rare ${(exp.rareChance * 100).toFixed(0)}% /
                        Epic ${(exp.epicChance * 100).toFixed(0)}%
                    </div>
                    <div style="margin-top:6px; color:rgba(255,255,255,0.68); font-size:12px;">
                        Wyższy poziom gracza odblokowuje kolejne ekspedycje.
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