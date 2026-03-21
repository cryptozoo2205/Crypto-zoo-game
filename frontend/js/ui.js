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

        const boostActive = (CryptoZoo.gameplay?.getBoost2xMultiplier?.() || 1) > 1;

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

    goToBoostShop() {
        const shopButton = document.querySelector('[data-nav="shop"]');

        if (shopButton) {
            shopButton.click();
        } else if (CryptoZoo.gameplay?.showScreen) {
            CryptoZoo.gameplay.showScreen("shop");
        }

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

        const canClaim = CryptoZoo.gameplay?.canClaimDailyReward?.() || false;
        const timeLeftMs = Math.max(
            0,
            Number(CryptoZoo.gameplay?.getDailyRewardTimeLeftMs?.()) || 0
        );
        const timeLeftSeconds = Math.ceil(timeLeftMs / 1000);

        const rewardCoins = Math.max(
            0,
            Number(CryptoZoo.gameplay?.getDailyRewardCoinsAmount?.()) || 0
        );
        const rewardGems = Math.max(
            0,
            Number(CryptoZoo.gameplay?.getDailyRewardGemsAmount?.()) || 0
        );
        const streak = Math.max(
            0,
            Number(CryptoZoo.gameplay?.getDailyRewardStreak?.()) || 0
        );
        const streakLabel = `Day ${Math.max(1, streak || 1)}`;

        titleEl.textContent = "Daily Reward";
        subtitleEl.style.whiteSpace = "normal";
        subtitleEl.style.wordBreak = "break-word";
        subtitleEl.style.overflowWrap = "anywhere";
        subtitleEl.style.lineHeight = "1.35";

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
                const zooButton = document.querySelector('[data-nav="zoo"]');
                if (zooButton) {
                    zooButton.click();
                    return;
                }

                if (CryptoZoo.gameplay?.showScreen) {
                    CryptoZoo.gameplay.showScreen("zoo");
                }
            });
        }

        const homeDailyBtn = document.getElementById("homeDailyBtn");
        if (
            homeDailyBtn &&
            !homeDailyBtn.dataset.bound &&
            !CryptoZoo.gameplay?.bindDailyRewardButton
        ) {
            homeDailyBtn.dataset.bound = "1";
            homeDailyBtn.addEventListener("click", () => {
                this.showToast("Daily Reward w przygotowaniu");
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
};