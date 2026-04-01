window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.audio = {
    enabled: true,
    basePath: "assets/sounds/",
    sounds: {},
    unlocked: false,
    unlockBound: false,

    config: {
        tap: { file: "tap.wav", volume: 0.28, poolSize: 2 },
        click: { file: "click.wav", volume: 0.42, poolSize: 2 },
        spin: { file: "spin.mp3", volume: 0.5, poolSize: 1 },
        win: { file: "win.mp3", volume: 0.62, poolSize: 1 },
        flip: { file: "flip.wav", volume: 0.38, poolSize: 1 },
        match: { file: "match.wav", volume: 0.55, poolSize: 1 },
        boost: { file: "boost.wav", volume: 0.6, poolSize: 1 }
    },

    init() {
        this.loadSettings();
        this.sounds = {};
        this.bindUnlock();
    },

    loadSettings() {
        try {
            const saved = localStorage.getItem("cz_sounds");
            this.enabled = saved !== "off";
        } catch (error) {
            this.enabled = true;
        }
    },

    saveSettings() {
        try {
            localStorage.setItem("cz_sounds", this.enabled ? "on" : "off");
        } catch (error) {
            console.warn("Audio settings save error:", error);
        }
    },

    setEnabled(value) {
        this.enabled = !!value;
        this.saveSettings();
        return this.enabled;
    },

    toggle() {
        this.enabled = !this.enabled;
        this.saveSettings();
        return this.enabled;
    },

    bindUnlock() {
        if (this.unlockBound) return;
        this.unlockBound = true;

        const unlock = () => {
            this.unlocked = true;
            document.removeEventListener("touchstart", unlock, true);
            document.removeEventListener("pointerdown", unlock, true);
            document.removeEventListener("click", unlock, true);
        };

        document.addEventListener("touchstart", unlock, true);
        document.addEventListener("pointerdown", unlock, true);
        document.addEventListener("click", unlock, true);
    },

    createAudioInstance(src, volume) {
        const audio = new Audio();
        audio.preload = "none";
        audio.src = src;
        audio.volume = Math.max(0, Math.min(1, Number(volume) || 0.5));
        return audio;
    },

    ensurePool(name) {
        if (this.sounds[name]) {
            return this.sounds[name];
        }

        const item = this.config[name];
        if (!item) return null;

        const safePoolSize = Math.max(1, Number(item.poolSize) || 1);
        const src = this.basePath + item.file;

        const entry = {
            index: 0,
            pool: Array.from({ length: safePoolSize }, () => {
                return this.createAudioInstance(src, item.volume);
            })
        };

        this.sounds[name] = entry;
        return entry;
    },

    getNextAudio(name) {
        const entry = this.ensurePool(name);
        if (!entry || !Array.isArray(entry.pool) || entry.pool.length === 0) {
            return null;
        }

        const audio = entry.pool[entry.index];
        entry.index = (entry.index + 1) % entry.pool.length;
        return audio;
    },

    play(name) {
        if (!this.enabled) return;
        if (!name) return;
        if (!this.unlocked) return;

        const audio = this.getNextAudio(name);
        if (!audio) return;

        try {
            audio.pause();
            audio.currentTime = 0;

            const playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(() => {});
            }
        } catch (error) {
            console.warn("Audio play error:", error);
        }
    },

    stop(name) {
        const entry = this.sounds[name];
        if (!entry) return;

        entry.pool.forEach((audio) => {
            try {
                audio.pause();
                audio.currentTime = 0;
            } catch (error) {
                console.warn("Audio stop error:", error);
            }
        });
    },

    stopAll() {
        Object.keys(this.sounds).forEach((name) => {
            this.stop(name);
        });
    }
};