window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.audio = {
    enabled: true,
    sounds: {},

    init() {
        this.loadSettings();
        this.loadSounds();
    },

    loadSettings() {
        const saved = localStorage.getItem("cz_sounds");
        this.enabled = saved !== "off";
    },

    saveSettings() {
        localStorage.setItem("cz_sounds", this.enabled ? "on" : "off");
    },

    toggle() {
        this.enabled = !this.enabled;
        this.saveSettings();
        return this.enabled;
    },

    loadSounds() {
        const base = "assets/sounds/";

        this.sounds = {
            tap: new Audio(base + "tap.wav"),
            spin: new Audio(base + "spin.mp3"),
            win: new Audio(base + "win.mp3"),
            click: new Audio(base + "click.wav"),
            flip: new Audio(base + "flip.wav"),
            match: new Audio(base + "match.wav"),
            boost: new Audio(base + "boost.wav")
        };

        Object.values(this.sounds).forEach((sound) => {
            sound.volume = 0.6;
        });
    },

    play(name) {
        if (!this.enabled) return;

        const sound = this.sounds[name];
        if (!sound) return;

        try {
            sound.currentTime = 0;
            sound.play();
        } catch (e) {}
    }
};