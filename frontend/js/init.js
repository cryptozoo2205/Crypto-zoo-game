window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.init = {
    started: false,

    log(msg) {
        console.log("[INIT]", msg);

        const el = document.getElementById("debugBox");
        if (el) {
            const row = document.createElement("div");
            row.textContent = msg;
            el.appendChild(row);
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
        box.style.maxHeight = "42%";
        box.style.overflow = "auto";
        box.style.background = "rgba(0,0,0,0.82)";
        box.style.color = "#00ff88";
        box.style.fontSize = "11px";
        box.style.lineHeight = "1.35";
        box.style.zIndex = "999999";
        box.style.padding = "6px";
        box.style.pointerEvents = "none";
        box.style.whiteSpace = "pre-wrap";
        box.style.wordBreak = "break-word";

        document.body.appendChild(box);
    },

    describeElement(el) {
        if (!el) return "null";

        const tag = String(el.tagName || "unknown").toUpperCase();
        const id = el.id ? `#${el.id}` : "";
        const cls = typeof el.className === "string" && el.className.trim()
            ? "." + el.className.trim().replace(/\s+/g, ".")
            : "";

        return `${tag}${id}${cls}`;
    },

    logPointTarget(x, y, label) {
        const el = document.elementFromPoint(Number(x) || 0, Number(y) || 0);
        this.log(`${label} @ ${Math.floor(Number(x) || 0)},${Math.floor(Number(y) || 0)} -> ${this.describeElement(el)}`);
    },

    bindGlobalDebug() {
        window.onerror = (msg) => {
            this.log("❌ ERROR: " + msg);
        };

        window.addEventListener("unhandledrejection", () => {
            this.log("❌ PROMISE ERROR");
        });

        const touchHandler = (e) => {
            const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || null;
            const target = e.target;
            this.log(`👆 ${e.type} target=${this.describeElement(target)}`);

            if (touch) {
                this.logPointTarget(touch.clientX, touch.clientY, "POINT");
            }
        };

        const mouseHandler = (e) => {
            const target = e.target;
            this.log(`🖱 ${e.type} target=${this.describeElement(target)}`);
            this.logPointTarget(e.clientX, e.clientY, "POINT");
        };

        window.addEventListener("touchstart", touchHandler, { capture: true, passive: true });
        window.addEventListener("touchend", touchHandler, { capture: true, passive: true });
        document.addEventListener("touchstart", touchHandler, { capture: true, passive: true });
        document.addEventListener("touchend", touchHandler, { capture: true, passive: true });

        window.addEventListener("click", mouseHandler, true);
        document.addEventListener("click", mouseHandler, true);

        this.log("debug listeners ok");
    },

    removeLoadingScreen() {
        const screen = document.getElementById("loading-screen");
        if (!screen) {
            this.log("loading screen already removed");
            return;
        }

        screen.style.pointerEvents = "none";
        screen.style.opacity = "0";
        screen.style.visibility = "hidden";
        screen.style.display = "none";
        screen.setAttribute("hidden", "hidden");

        const allLoadingChildren = screen.querySelectorAll("*");
        allLoadingChildren.forEach((el) => {
            el.style.pointerEvents = "none";
            el.style.display = "none";
            el.style.visibility = "hidden";
        });

        setTimeout(() => {
            try {
                screen.remove();
                this.log("loading screen removed from DOM");
            } catch (error) {
                this.log("loading remove failed");
            }
        }, 50);
    },

    forceHiddenModalsSafe() {
        const ids = [
            "profileModal",
            "settingsModal",
            "dailyRewardModal"
        ];

        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;

            if (el.classList.contains("hidden")) {
                el.style.pointerEvents = "none";
                el.style.display = "";
            } else {
                el.style.pointerEvents = "auto";
            }
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
            this.log("modals bind ok");

            this.removeLoadingScreen();
            this.forceHiddenModalsSafe();

            setTimeout(() => {
                this.removeLoadingScreen();
                this.forceHiddenModalsSafe();
            }, 150);

            setTimeout(() => {
                this.removeLoadingScreen();
                this.forceHiddenModalsSafe();
            }, 500);

            this.log("✅ INIT DONE");
        } catch (e) {
            console.error(e);
            this.log("❌ INIT CRASH");
        }
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    await CryptoZoo.init.start();
});