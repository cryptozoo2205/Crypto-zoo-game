window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.init = {
    started: false,

    log(msg) {
        console.log("[INIT]", msg);

        const el = document.getElementById("debugBox");
        if (el) {
            el.innerHTML += `<div>${msg}</div>`;
            el.scrollTop = el.scrollHeight;
        }
    },

    createDebugOverlay() {
        if (document.getElementById("debugBox")) return;

        const box = document.createElement("div");
        box.id = "debugBox";
        box.style.position = "fixed";
        box.style.top = "0";
        box.style.left = "0";
        box.style.right = "0";
        box.style.maxHeight = "40%";
        box.style.overflow = "auto";
        box.style.background = "rgba(0,0,0,0.8)";
        box.style.color = "#00ff88";
        box.style.fontSize = "11px";
        box.style.zIndex = "999999";
        box.style.padding = "6px";
        box.style.pointerEvents = "none";

        document.body.appendChild(box);
    },

    bindGlobalDebug() {
        // JS ERROR
        window.onerror = (msg) => {
            this.log("❌ ERROR: " + msg);
        };

        window.addEventListener("unhandledrejection", () => {
            this.log("❌ PROMISE ERROR");
        });

        // TOUCH / CLICK DEBUG
        document.addEventListener("touchstart", (e) => {
            const t = e.target;
            this.log(`👆 TOUCH: ${t.tagName}#${t.id}.${t.className}`);
        }, { passive: true });

        document.addEventListener("click", (e) => {
            const t = e.target;
            this.log(`🖱 CLICK: ${t.tagName}#${t.id}.${t.className}`);
        });
    },

    async start() {
        if (this.started) return;
        this.started = true;

        this.createDebugOverlay();
        this.bindGlobalDebug();

        this.log("🚀 INIT START");

        try {
            CryptoZoo.lang?.init?.();
            this.log("lang ok");

            CryptoZoo.uiSettings?.initSettings?.();
            this.log("settings ok");

            CryptoZoo.audio?.init?.();
            this.log("audio ok");

            CryptoZoo.telegram?.init?.();
            this.log("telegram ok");

            await CryptoZoo.api?.init?.();
            this.log("api ok");

            CryptoZoo.gameplay?.init?.();
            this.log("gameplay ok");

            CryptoZoo.depositBind?.init?.();
            this.log("deposit ok");

            CryptoZoo.depositVerifyUI?.init?.();
            this.log("verify ok");

            CryptoZoo.minigames?.init?.();
            this.log("minigames ok");

            CryptoZoo.ui?.render?.();
            this.log("ui render ok");

            CryptoZoo.ui?.bindHomeButtons?.();
            this.log("bind buttons ok");

            CryptoZoo.uiSettings?.bindSettingsModal?.();
            CryptoZoo.uiProfile?.bindProfileModal?.();

            this.log("✅ INIT DONE");

            // 🔥 FIX: usuń loading screen (TO BLOKOWAŁO KLIKI)
            const screen = document.getElementById("loading-screen");
            if (screen) {
                screen.style.opacity = "0";
                screen.style.pointerEvents = "none";

                setTimeout(() => {
                    screen.style.display = "none";
                }, 200);
            }

        } catch (e) {
            console.error(e);
            this.log("❌ INIT CRASH");
        }
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    await CryptoZoo.init.start();
});