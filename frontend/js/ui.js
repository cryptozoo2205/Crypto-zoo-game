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
            toast.style.bottom = "96px";
            toast.style.transform = "translateX(-50%)";
            toast.style.background = "rgba(10, 18, 35, 0.96)";
            toast.style.color = "#ffffff";
            toast.style.padding = "12px 18px";
            toast.style.borderRadius = "14px";
            toast.style.zIndex = "99999";
            toast.style.display = "none";
            toast.style.fontWeight = "800";
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

    animateCoin() {
        const tapButton = document.getElementById("tapButton");
        if (!tapButton || !tapButton.parentElement) return;

        const area = tapButton.parentElement;
        area.style.position = "relative";

        const baseClickValue =
            Number(CryptoZoo.state?.coinsPerClick) ||
            Number(CryptoZoo.config?.clickValue) ||
            1;

        const multiplier = CryptoZoo.gameplay?.getBoost2xMultiplier?.() || 1;
        const clickValue = baseClickValue * multiplier;

        const pop = document.createElement("div");
        pop.className = "coin-pop";
        pop.textContent = "+" + CryptoZoo.formatNumber(clickValue);

        const offsetX = Math.floor(Math.random() * 80) - 40;
        const offsetY = -90 - Math.floor(Math.random() * 30);

        pop.style.left = "50%";
        pop.style.top = "50%";
        pop.style.setProperty("--moveX", offsetX + "px");
        pop.style.setProperty("--moveY", offsetY + "px");

        area.appendChild(pop);

        requestAnimationFrame(() => {
            pop.classList.add("animate");
        });

        setTimeout(() => {
            pop.remove();
        }, 900);
    },

    updateText(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
    },

    formatTimeLeft(seconds) {
        const safe = Math.max(0, Number(seconds) || 0);
        const minutes = Math.floor(safe / 60);
        const secs = safe % 60;

        return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    },

    bindClick(id, handler) {
        document.getElementById(id)?.addEventListener("click", handler);
    },

    bindHomeButtons() {
        const boostBtn = document.getElementById("homeBoostBtn");
        if (boostBtn && !boostBtn.dataset.bound) {
            boostBtn.dataset.bound = "1";
            boostBtn.addEventListener("click", () => {
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

                this.showToast("Sekcja X2 Boost jest w sklepie");
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
    },

    renderBoostStatus() {
        const isActive = CryptoZoo.gameplay?.isBoost2xActive?.();
        const left = CryptoZoo.gameplay?.getBoost2xTimeLeft?.() || 0;

        const homeStatus = document.getElementById("homeBoostStatus");
        const shopStatus = document.getElementById("boostShopStatus");
        const buyBtn = document.getElementById("buyBoostBtn");
        const homeBtn = document.getElementById("homeBoostBtn");
        const incomeStrip = document.querySelector(".home-income-strip");
        const tapButton = document.getElementById("tapButton");

        if (homeStatus) homeStatus.className = "home-boost-status";

        if (isActive) {
            const text = `⚡ X2 ACTIVE • ${this.formatTimeLeft(left)}`;

            if (homeStatus) {
                homeStatus.textContent = text;
                homeStatus.classList.add("boost-active");
            }

            if (shopStatus) shopStatus.textContent = text;

            if (buyBtn) {
                buyBtn.disabled = true;
                buyBtn.textContent = "Boost aktywny";
            }

            if (homeBtn) homeBtn.classList.add("boost-active");
            if (incomeStrip) incomeStrip.classList.add("boost-active");

            // 🔥 TAP BUTTON GLOW
            if (tapButton) tapButton.classList.add("boost-active");

        } else {
            if (homeStatus) {
                homeStatus.textContent = "Nieaktywny";
                homeStatus.classList.remove("boost-active");
            }

            if (shopStatus) shopStatus.textContent = "Nieaktywny";

            if (buyBtn) {
                buyBtn.disabled = false;
                buyBtn.textContent = "Kup X2 Boost";
            }

            if (homeBtn) homeBtn.classList.remove("boost-active");
            if (incomeStrip) incomeStrip.classList.remove("boost-active");

            // ❌ usuń glow
            if (tapButton) tapButton.classList.remove("boost-active");
        }
    },

    renderHomeOverview() {
        const state = CryptoZoo.state || {};
        const multiplier = CryptoZoo.gameplay?.getBoost2xMultiplier?.() || 1;

        this.updateText("homeCoins", CryptoZoo.formatNumber(state.coins || 0));
        this.updateText("homeGems", CryptoZoo.formatNumber(state.gems || 0));
        this.updateText("homeRewardBalance", CryptoZoo.formatNumber(state.rewardBalance || 0));
        this.updateText("homeLevel", CryptoZoo.formatNumber(state.level || 1));
        this.updateText("homeCoinsPerClick", CryptoZoo.formatNumber((state.coinsPerClick || 1) * multiplier));
        this.updateText("homeIncomeStripValue", CryptoZoo.formatNumber((state.zooIncome || 0) * multiplier));

        this.bindHomeButtons();
        this.renderBoostStatus();
    },

    render() {
        this.renderHomeOverview();
    }
};