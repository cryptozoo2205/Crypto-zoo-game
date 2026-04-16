window.CryptoZoo = window.CryptoZoo || {};
CryptoZoo.ui = CryptoZoo.ui || {};

Object.assign(CryptoZoo.ui, {
    toastTimeout: null,
    rankingCache: null,
    rankingLoading: false,
    rankingLastFetchAt: 0,
    rankingCacheTtl: 15000,
    offlineInfoTimer: null,

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

    isProfileModalOpen() {
        const modal = document.getElementById("profileModal");
        return !!(modal && !modal.classList.contains("hidden"));
    },

    isSettingsModalOpen() {
        const modal = document.getElementById("settingsModal");
        return !!(modal && !modal.classList.contains("hidden"));
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
            expeditionTime3: "shopExpeditionTime3",
            expeditionTime4: "shopExpeditionTime4"
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
            jungle_scout: "expeditionJungleScout",
            jungle_river: "expeditionJungleRiver",
            jungle_ruins: "expeditionJungleRuins",
            jungle_canopy: "expeditionJungleCanopy",
            jungle_depths: "expeditionJungleDepths",
            jungle_temple: "expeditionJungleTemple",
            jungle_king: "expeditionJungleKing",
            desert_outpost: "expeditionDesertOutpost",
            desert_dunes: "expeditionDesertDunes",

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

    getSelectedAnimalsLabel(selectedAnimals) {
        const safeList = Array.isArray(selectedAnimals) ? selectedAnimals : [];
        if (!safeList.length) return "";

        const animalsConfig = CryptoZoo.config?.animals || {};

        return safeList
            .map((entry) => {
                const type = String(entry?.type || "");
                if (!type) return "";

                const count = Math.max(1, Number(entry?.count) || 1);
                const config = animalsConfig[type] || {};
                const name = this.getLocalizedAnimalName(type, config);

                return `${name} x${CryptoZoo.formatNumber(count)}`;
            })
            .filter(Boolean)
            .join(", ");
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
            CryptoZoo.gameplay?.getEffectiveCoinsPerClick?.() ||
            Number(CryptoZoo.state?.coinsPerClick) ||
            Number(CryptoZoo.config?.clickValue) ||
            1;

        const safeTapCount = Math.max(1, Math.floor(Number(tapCount) || 1));
        const totalDisplayValue = clickValue * safeTapCount;

        const boostActive = (CryptoZoo.boostSystem?.getMultiplier?.() || 1) > 1;

        const pop = document.createElement("div");
        pop.className = `coin-pop${boostActive ? " boost-pop" : ""}`;
        pop.textContent = "+" + CryptoZoo.formatNumber(totalDisplayValue);

        const offsetX = Math.floor(Math.random() * 40) - 20;
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

    formatHoursShort(hoursValue) {
        const safeHours = Math.max(0, Number(hoursValue) || 0);
        const totalSeconds = Math.max(0, Math.floor(safeHours * 3600));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        if (hours > 0 && minutes > 0) {
            return `${hours}h ${minutes}m`;
        }

        if (hours > 0) {
            return `${hours}h`;
        }

        if (minutes > 0) {
            return `${minutes}m`;
        }

        return "0m";
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
        CryptoZoo.gameplay?.showScreen?.("shop");

        const boostCard = document.getElementById("boostShopCard");
        if (boostCard) {
            setTimeout(() => {
                boostCard.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 150);
        }
    }
});