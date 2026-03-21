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

    ensureHomeGuideCard() {
        const quickPanel = document.querySelector("#screen-game .home-quick-panel");
        if (!quickPanel) return null;

        let card = document.getElementById("homeGuideCard");

        if (!card) {
            card = document.createElement("div");
            card.id = "homeGuideCard";
            card.style.width = "100%";
            card.style.marginTop = "12px";
            card.style.padding = "12px 14px";
            card.style.borderRadius = "16px";
            card.style.background = "linear-gradient(180deg, rgba(18, 28, 48, 0.96) 0%, rgba(10, 17, 31, 0.95) 100%)";
            card.style.border = "1px solid rgba(255,255,255,0.08)";
            card.style.boxShadow = "0 12px 22px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255,255,255,0.04)";
            card.style.color = "#ffffff";
            card.style.fontSize = "12px";
            card.style.fontWeight = "700";
            card.style.lineHeight = "1.55";

            quickPanel.insertAdjacentElement("afterend", card);
        }

        return card;
    },

    renderHomeGuide() {
        const card = this.ensureHomeGuideCard();
        if (!card) return;

        const level = Math.max(1, Number(CryptoZoo.state?.level) || 1);
        const nextLevelRequirement = level * 100;
        const expeditionHint = "Wyższy poziom gracza odblokowuje kolejne ekspedycje.";
        const animalHint = "Poziom zwierzęcia zwiększa dochód każdej sztuki tego gatunku.";
        const upgradeHint = "Kup = więcej sztuk. Ulepsz = większy dochód z posiadanych sztuk.";

        card.innerHTML = `
            <div style="font-size:13px; font-weight:900; margin-bottom:6px;">📘 Jak działa progres</div>
            <div style="color: rgba(255,255,255,0.88); margin-bottom:4px;">
                • Poziom gracza rośnie za XP z klikania, income i ekspedycji.
            </div>
            <div style="color: rgba(255,255,255,0.74); margin-bottom:6px;">
                Następny ważny próg XP: ok. ${CryptoZoo.formatNumber(nextLevelRequirement)} • ${expeditionHint}
            </div>
            <div style="color: rgba(255,255,255,0.88); margin-bottom:4px;">
                • ${animalHint}
            </div>
            <div style="color: rgba(255,255,255,0.74);">
                • ${upgradeHint}
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
            btn.style.background = "linear-gradient(180deg, rgba(18, 28, 48, 0.96) 0%, rgba(10, 17, 31, 0.95)