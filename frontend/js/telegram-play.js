window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.telegramPlay = {
    init() {
        this.inject();
        this.bind();
    },

    inject() {
        if (document.getElementById("telegramPlayBar")) return;

        const div = document.createElement("div");
        div.id = "telegramPlayBar";

        div.innerHTML = `
            <button id="telegramPlayBtn">▶ Play</button>
        `;

        document.body.appendChild(div);
    },

    bind() {
        const btn = document.getElementById("telegramPlayBtn");
        if (!btn) return;

        btn.addEventListener("click", () => {
            CryptoZoo.audio?.play?.("click");
            CryptoZoo.ui?.showScreen?.("game");
        });
    }
};

// AUTO INIT
document.addEventListener("DOMContentLoaded", () => {
    CryptoZoo.telegramPlay.init();
});