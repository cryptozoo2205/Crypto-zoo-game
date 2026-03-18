window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ui = {
    toastTimeout: null,

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

    animateCoin() {
        const tapButton = document.getElementById("tapButton");
        if (!tapButton || !tapButton.parentElement) return;

        const area = tapButton.parentElement;
        area.style.position = "relative";

        const clickValue =
            CryptoZoo.gameplay?.getEffectiveCoinsPerClick?.(1) ||
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
        if (homeDailyBtn && !homeDailyBtn.dataset.bound) {
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

        const settingsIds = ["topSettingsBtn", "topSettingsBtnFallback"];
        settingsIds.forEach((id) => {
            const btn = document.getElementById(id);
            if (btn && !btn.dataset.bound) {
                btn.dataset.bound = "1";
                btn.addEventListener("click", () => {
                    this.showToast("Settings panel będzie dodany w następnym etapie");
                });
            }
        });

        const eventsIds = ["topEventsBtn", "topEventsBtnFallback"];
        eventsIds.forEach((id) => {
            const btn = document.getElementById(id);
            if (btn && !btn.dataset.bound) {
                btn.dataset.bound = "1";
                btn.addEventListener("click", () => {
                    this.showToast("Eventy / daily rewards w przygotowaniu");
                });
            }
        });
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

        this.bindHomeButtons();
        this.renderBoostStatus();
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

        container.innerHTML = expeditions.map((exp) => `
            <div class="expedition-card">
                <h3>${exp.name}</h3>
                <div>Czas: ${this.formatTimeLeft(exp.duration)}</div>
                <div>
                    Nagroda bazowa:
                    ${CryptoZoo.formatNumber(exp.baseCoins)} coins +
                    ${CryptoZoo.formatNumber(exp.baseGems)} gems
                </div>
                <div>
                    Szansa na bonus:
                    Rare ${(exp.rareChance * 100).toFixed(0)}% /
                    Epic ${(exp.epicChance * 100).toFixed(0)}%
                </div>
                <button id="start-expedition-${exp.id}" type="button">Start</button>
            </div>
        `).join("");

        expeditions.forEach((exp) => {
            this.bindClick(`start-expedition-${exp.id}`, () => {
                CryptoZoo.gameplay?.startExpedition?.(exp.id);
            });
        });
    },

    renderShopItems() {
        const shopList = document.getElementById("shopList");
        if (!shopList) return;

        const items = CryptoZoo.config?.shopItems || [];

        shopList.innerHTML = items.map((item) => `
            <div class="shop-item">
                <h3>${item.name}</h3>
                <div>${item.desc}</div>
                <div>Koszt: ${CryptoZoo.formatNumber(item.price)} coins</div>
                <button id="buy-shop-${item.id}" type="button">Kup</button>
            </div>
        `).join("");

        CryptoZoo.gameplay?.bindShopButtons?.();
    },

    renderBoxes() {
        const container = document.getElementById("boxesList");
        if (!container) return;

        const boxes = CryptoZoo.state?.boxes || {
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 0
        };

        const types = [
            { key: "common", label: "Common Box" },
            { key: "rare", label: "Rare Box" },
            { key: "epic", label: "Epic Box" },
            { key: "legendary", label: "Legendary Box" }
        ];

        container.innerHTML = types.map((box) => `
            <div class="shop-item">
                <h3>${box.label}</h3>
                <div>Posiadasz: ${CryptoZoo.formatNumber(boxes[box.key] || 0)}</div>
                <button id="open-box-${box.key}" type="button">Otwórz</button>
            </div>
        `).join("");

        types.forEach((box) => {
            this.bindClick(`open-box-${box.key}`, () => {
                CryptoZoo.boxes?.open?.(box.key);
            });
        });
    },

    async renderRanking() {
        const rankingList = document.getElementById("rankingList");
        if (!rankingList) return;

        rankingList.innerHTML = "<li>Ładowanie rankingu...</li>";

        try {
            const ranking = await CryptoZoo.api?.loadRanking?.();
            const safeRanking = Array.isArray(ranking) ? ranking : [];

            if (!safeRanking.length) {
                rankingList.innerHTML = "<li>Brak danych rankingu</li>";
                return;
            }

            rankingList.innerHTML = safeRanking.map((row, index) => `
                <li>${index + 1}. ${row.username || row.name || "Gracz"} — ${CryptoZoo.formatNumber(row.coins || 0)} coins</li>
            `).join("");
        } catch (error) {
            console.error("Ranking render error:", error);
            rankingList.innerHTML = "<li>Błąd ładowania rankingu</li>";
        }
    },

    render() {
        this.renderHome();
        this.renderTopHiddenStats();
        this.renderZooList();
        this.renderExpeditions();
        this.renderShopItems();
        this.renderBoxes();
        this.renderRanking();
    }
};