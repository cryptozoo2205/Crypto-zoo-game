window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.audio = {
    enabled: true,
    basePath: "assets/sounds/",
    sounds: {},

    config: {
        tap: { file: "tap.wav", volume: 0.28, poolSize: 5 },
        click: { file: "click.wav", volume: 0.42, poolSize: 3 },
        spin: { file: "spin.mp3", volume: 0.5, poolSize: 2 },
        win: { file: "win.mp3", volume: 0.62, poolSize: 3 },
        flip: { file: "flip.wav", volume: 0.38, poolSize: 4 },
        match: { file: "match.wav", volume: 0.55, poolSize: 3 },
        boost: { file: "boost.wav", volume: 0.6, poolSize: 2 }
    },

    init() {
        this.loadSettings();
        this.buildPools();
        this.preload();
    },

    loadSettings() {
        const saved = localStorage.getItem("cz_sounds");
        this.enabled = saved !== "off";
    },

    saveSettings() {
        localStorage.setItem("cz_sounds", this.enabled ? "on" : "off");
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

    createAudioInstance(src, volume) {
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.volume = Math.max(0, Math.min(1, Number(volume) || 0.5));
        return audio;
    },

    buildPools() {
        this.sounds = {};

        Object.keys(this.config).forEach((name) => {
            const item = this.config[name];
            const safePoolSize = Math.max(1, Number(item.poolSize) || 1);
            const src = this.basePath + item.file;

            this.sounds[name] = {
                index: 0,
                pool: Array.from({ length: safePoolSize }, () => {
                    return this.createAudioInstance(src, item.volume);
                })
            };
        });
    },

    preload() {
        Object.values(this.sounds).forEach((entry) => {
            entry.pool.forEach((audio) => {
                try {
                    audio.load();
                } catch (error) {
                    console.warn("Audio preload error:", error);
                }
            });
        });
    },

    getNextAudio(name) {
        const entry = this.sounds[name];
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