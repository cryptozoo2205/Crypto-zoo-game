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

    openSettingsModal() {
        const modal = document.getElementById("settingsModal");
        if (!modal) return;

        this.refreshSettingsModalData();
        modal.classList.remove("hidden");
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
    }
};