window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.telegramAdsUi = {
    sdkLoaded: false,
    sdkLoading: false,
    sdkLoadPromise: null,
    initialized: false,
    buttonId: "watchOfflineAdBtn",
    infoId: "watchOfflineAdInfo",
    sectionId: "offlineAdRewardSection",

    // USTAW TO NA SWÓJ ZONE ID Z PANELU REKLAM
    zoneId: "",

    // Możesz zmienić na true, jeśli chcesz widzieć przycisk też poza Telegramem podczas testów
    allowBrowserDebug: true,

    init() {
        if (this.initialized) return;
        this.initialized = true;

        this.resolveZoneId();
        this.ensureSection();
        this.bindEvents();
        this.render();
    },

    resolveZoneId() {
        const configZoneId =
            String(
                CryptoZoo.config?.telegramAds?.zoneId ||
                window.CRYPTOZOO_TMA_AD_ZONE ||
                ""
            ).trim();

        if (configZoneId) {
            this.zoneId = configZoneId;
        }
    },

    isTelegramWebApp() {
        return Boolean(window.Telegram?.WebApp);
    },

    canRunInCurrentEnvironment() {
        if (this.isTelegramWebApp()) return true;
        return this.allowBrowserDebug;
    },

    getSdkScriptUrl() {
        if (!this.zoneId) return "";
        return `https://domain.com/sdk.js?zone=${encodeURIComponent(this.zoneId)}`;
    },

    getShowFunctionName() {
        if (!this.zoneId) return "";
        return `show_${this.zoneId}`;
    },

    getShowFunction() {
        const fnName = this.getShowFunctionName();
        if (!fnName) return null;

        const fn = window[fnName];
        return typeof fn === "function" ? fn : null;
    },

    async loadSdk() {
        if (!this.zoneId) {
            throw new Error("Brak zoneId dla reklam");
        }

        const existingFn = this.getShowFunction();
        if (existingFn) {
            this.sdkLoaded = true;
            return existingFn;
        }

        if (this.sdkLoadPromise) {
            await this.sdkLoadPromise;
            return this.getShowFunction();
        }

        this.sdkLoading = true;

        this.sdkLoadPromise = new Promise((resolve, reject) => {
            const existingScript = document.getElementById("telegramAdsSdkScript");
            if (existingScript) {
                const checkLoaded = () => {
                    const fn = this.getShowFunction();
                    if (fn) {
                        this.sdkLoaded = true;
                        this.sdkLoading = false;
                        resolve(fn);
                        return;
                    }

                    this.sdkLoading = false;
                    reject(new Error("SDK załadowany, ale brak funkcji reklamy"));
                };

                if (existingScript.dataset.loaded === "1") {
                    checkLoaded();
                    return;
                }

                existingScript.addEventListener("load", checkLoaded, { once: true });
                existingScript.addEventListener(
                    "error",
                    () => {
                        this.sdkLoading = false;
                        reject(new Error("Nie udało się załadować SDK reklam"));
                    },
                    { once: true }
                );
                return;
            }

            const script = document.createElement("script");
            script.id = "telegramAdsSdkScript";
            script.async = true;

            // Dokumentacja SDK dla TMA przewiduje ładowanie przez osobny skrypt
            // i globalną funkcję show_XXX() dla zone ID.
            // Podmień domenę, jeśli dostawca reklam da Ci inną.
            script.src = "https://domain.com/sdk.js";
            script.setAttribute("data-zone", this.zoneId);
            script.setAttribute("data-sdk", this.getShowFunctionName());

            script.onload = () => {
                script.dataset.loaded = "1";

                const fn = this.getShowFunction();
                this.sdkLoading = false;

                if (!fn) {
                    reject(new Error("SDK załadowany, ale brak funkcji reklamy"));
                    return;
                }

                this.sdkLoaded = true;
                resolve(fn);
            };

            script.onerror = () => {
                this.sdkLoading = false;
                reject(new Error("Nie udało się załadować SDK reklam"));
            };

            document.head.appendChild(script);
        });

        await this.sdkLoadPromise;
        return this.getShowFunction();
    },

    ensureSection() {
        if (document.getElementById(this.sectionId)) {
            return;
        }

        const settingsModal =
            document.getElementById("settingsModal") ||
            document.querySelector(".settings-modal") ||
            document.body;

        const section = document.createElement("div");
        section.id = this.sectionId;
        section.style.marginTop = "14px";
        section.style.borderRadius = "18px";
        section.style.padding = "14px";
        section.style.background = "linear-gradient(180deg, rgba(18,29,74,0.96) 0%, rgba(7,16,47,0.96) 100%)";
        section.style.border = "1px solid rgba(255,255,255,0.08)";
        section.style.boxShadow = "0 10px 24px rgba(0,0,0,0.18)";

        section.innerHTML = `
            <div style="font-size:13px;opacity:0.8;margin-bottom:6px;">OFFLINE ADS</div>
            <div style="font-weight:800;font-size:20px;margin-bottom:6px;">Oglądaj reklamę i odbierz +2h offline</div>
            <div id="${this.infoId}" style="font-size:13px;opacity:0.85;margin-bottom:12px;"></div>
            <button
                id="${this.buttonId}"
                type="button"
                style="
                    width:100%;
                    min-height:52px;
                    border:none;
                    border-radius:16px;
                    font-weight:900;
                    font-size:18px;
                    cursor:pointer;
                    background:linear-gradient(180deg,#ffd94d 0%, #f0b90b 100%);
                    color:#1f1f1f;
                    box-shadow:0 8px 18px rgba(240,185,11,0.28);
                "
            >
                📺 Obejrzyj reklamę (+2h)
            </button>
        `;

        const insertTargets = [
            settingsModal.querySelector?.(".profile-card"),
            settingsModal.querySelector?.(".profile-modal"),
            settingsModal.querySelector?.(".profile-content"),
            settingsModal.querySelector?.(".settings-content"),
            settingsModal.querySelector?.(".modal-content"),
            settingsModal
        ].filter(Boolean);

        const target = insertTargets[0] || document.body;
        target.appendChild(section);
    },

    bindEvents() {
        document.addEventListener("click", async (event) => {
            const btn = event.target?.closest?.(`#${this.buttonId}`);
            if (!btn) return;

            event.preventDefault();
            await this.handleRewardedAd();
        });

        document.addEventListener("visibilitychange", () => {
            this.render();
        });

        setInterval(() => {
            this.render();
        }, 1000);
    },

    setButtonState({ disabled = false, text = "" } = {}) {
        const btn = document.getElementById(this.buttonId);
        if (!btn) return;

        btn.disabled = disabled;
        btn.style.opacity = disabled ? "0.65" : "1";
        btn.style.cursor = disabled ? "not-allowed" : "pointer";

        if (text) {
            btn.textContent = text;
        }
    },

    render() {
        const info = document.getElementById(this.infoId);
        const btn = document.getElementById(this.buttonId);

        if (!info || !btn) {
            this.ensureSection();
            return;
        }

        const currentHours = Math.max(
            0,
            Number(CryptoZoo.state?.offlineAdsHours) || 0
        );

        const maxHours = Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getMaxHours?.() || 12)
        );

        const rewardHours = Math.max(
            1,
            Number(CryptoZoo.offlineAds?.getRewardHoursPerAd?.() || 2)
        );

        const remaining = Math.max(0, maxHours - currentHours);
        const adsLeft = Math.ceil(remaining / rewardHours);

        info.textContent =
            `Masz ${currentHours}h / ${maxHours}h z reklam. ` +
            (remaining > 0
                ? `Do limitu zostało ${remaining}h (${adsLeft} rekl.).`
                : "Osiągnięto maksymalny limit reklam offline.");

        if (!this.zoneId) {
            this.setButtonState({
                disabled: true,
                text: "📺 Ustaw zoneId reklamy"
            });
            return;
        }

        if (!this.canRunInCurrentEnvironment()) {
            this.setButtonState({
                disabled: true,
                text: "📺 Reklamy działają w Telegram WebApp"
            });
            return;
        }

        if (remaining <= 0) {
            this.setButtonState({
                disabled: true,
                text: "📺 Limit 12h osiągnięty"
            });
            return;
        }

        if (this.sdkLoading) {
            this.setButtonState({
                disabled: true,
                text: "⏳ Ładowanie reklamy..."
            });
            return;
        }

        this.setButtonState({
            disabled: false,
            text: `📺 Obejrzyj reklamę (+${rewardHours}h)`
        });
    },

    async handleRewardedAd() {
        const currentHours = Math.max(
            0,
            Number(CryptoZoo.state?.offlineAdsHours) || 0
        );
        const maxHours = Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getMaxHours?.() || 12)
        );

        if (currentHours >= maxHours) {
            CryptoZoo.ui?.showToast?.("Masz już maksymalny limit reklam offline 12h");
            this.render();
            return false;
        }

        if (!this.zoneId) {
            CryptoZoo.ui?.showToast?.("Brak zoneId reklamy");
            this.render();
            return false;
        }

        this.setButtonState({
            disabled: true,
            text: "⏳ Przygotowanie reklamy..."
        });

        try {
            const showAd = await this.loadSdk();

            if (typeof showAd !== "function") {
                throw new Error("Brak funkcji reklamy");
            }

            // SDK dla TMA zwraca Promise po show() — reward nadajemy po resolve.
            await showAd({
                requestVar: "offline_income_reward",
                ymid: String(CryptoZoo.state?.telegramUser?.id || CryptoZoo.state?.telegramId || "guest")
            });

            const rewarded = CryptoZoo.gameplay?.grantOfflineAdReward?.();

            if (!rewarded) {
                CryptoZoo.ui?.showToast?.("Reklama zakończona, ale limit offline jest już pełny");
                this.render();
                return false;
            }

            this.render();
            return true;
        } catch (error) {
            console.error("Rewarded ad error:", error);
            CryptoZoo.ui?.showToast?.("Reklama chwilowo niedostępna");
            this.render();
            return false;
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    try {
        CryptoZoo.telegramAdsUi.init();
    } catch (error) {
        console.error("telegram-ads-ui init error:", error);
    }
});