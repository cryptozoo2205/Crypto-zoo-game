window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiSettings = {
    storageKey: "cryptozoo_settings",

    getDefaultSettings() {
        return {
            language: "pl",
            sound: true
        };
    },

    getSettings() {
        const defaults = this.getDefaultSettings();

        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) {
                return { ...defaults };
            }

            const parsed = JSON.parse(raw);

            return {
                language: parsed?.language === "en" ? "en" : defaults.language,
                sound: typeof parsed?.sound === "boolean" ? parsed.sound : defaults.sound
            };
        } catch (error) {
            console.error("Settings parse error:", error);
            return { ...defaults };
        }
    },

    saveSettings(nextSettings) {
        const defaults = this.getDefaultSettings();
        const safeSettings = {
            language: nextSettings?.language === "en" ? "en" : defaults.language,
            sound: typeof nextSettings?.sound === "boolean" ? nextSettings.sound : defaults.sound
        };

        localStorage.setItem(this.storageKey, JSON.stringify(safeSettings));
        return safeSettings;
    },

    applySettings(settings) {
        const safeSettings = settings || this.getSettings();

        document.documentElement.setAttribute("lang", safeSettings.language);
        document.documentElement.dataset.gameLanguage = safeSettings.language;
        document.documentElement.dataset.gameSound = safeSettings.sound ? "on" : "off";

        CryptoZoo.settings = CryptoZoo.settings || {};
        CryptoZoo.settings.language = safeSettings.language;
        CryptoZoo.settings.sound = safeSettings.sound;
    },

    initSettings() {
        const settings = this.getSettings();
        this.applySettings(settings);
        this.refreshSettingsModalData();
    },

    getLanguageLabel(language) {
        return language === "en" ? "English" : "Polski";
    },

    getSoundLabel(sound) {
        return sound ? "ON" : "OFF";
    },

    refreshSettingsModalData() {
        const settings = this.getSettings();

        CryptoZoo.ui?.updateText?.(
            "settingsLanguageValue",
            this.getLanguageLabel(settings.language)
        );

        CryptoZoo.ui?.updateText?.(
            "settingsSoundValue",
            this.getSoundLabel(settings.sound)
        );
    },

    toggleLanguage() {
        const current = this.getSettings();
        const next = {
            ...current,
            language: current.language === "pl" ? "en" : "pl"
        };

        const saved = this.saveSettings(next);
        this.applySettings(saved);
        this.refreshSettingsModalData();

        CryptoZoo.ui?.showToast?.(
            saved.language === "en" ? "Language: English" : "Język: Polski"
        );
    },

    toggleSound() {
        const current = this.getSettings();
        const next = {
            ...current,
            sound: !current.sound
        };

        const saved = this.saveSettings(next);
        this.applySettings(saved);
        this.refreshSettingsModalData();

        CryptoZoo.ui?.showToast?.(
            saved.sound ? "Dźwięki: ON" : "Dźwięki: OFF"
        );
    },

    openSettingsModal() {
        const modal = document.getElementById("settingsModal");
        if (!modal) return;

        this.refreshSettingsModalData();
        modal.classList.remove("hidden");

        const card = modal.querySelector(".profile-card");
        if (card) {
            card.scrollTop = 0;
        }
    },

    closeSettingsModal() {
        document.getElementById("settingsModal")?.classList.add("hidden");
    },

    bindSettingsModal() {
        const closeBtn = document.getElementById("closeSettingsBtn");
        if (closeBtn && !closeBtn.dataset.bound) {
            closeBtn.dataset.bound = "1";
            closeBtn.addEventListener("click", () => {
                this.closeSettingsModal();
            });
        }

        const backdrop = document.getElementById("settingsBackdrop");
        if (backdrop && !backdrop.dataset.bound) {
            backdrop.dataset.bound = "1";
            backdrop.addEventListener("click", () => {
                this.closeSettingsModal();
            });
        }

        const languageValue = document.getElementById("settingsLanguageValue");
        const languageBox = languageValue?.closest(".profile-box");

        if (languageBox && !languageBox.dataset.bound) {
            languageBox.dataset.bound = "1";
            languageBox.style.cursor = "pointer";
            languageBox.addEventListener("click", () => {
                this.toggleLanguage();
            });
        }

        const soundValue = document.getElementById("settingsSoundValue");
        const soundBox = soundValue?.closest(".profile-box");

        if (soundBox && !soundBox.dataset.bound) {
            soundBox.dataset.bound = "1";
            soundBox.style.cursor = "pointer";
            soundBox.addEventListener("click", () => {
                this.toggleSound();
            });
        }
    }
};

CryptoZoo.uiSettings.initSettings();