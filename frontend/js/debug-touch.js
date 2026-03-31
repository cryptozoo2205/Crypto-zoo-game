window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.debugTouch = {
    started: false,
    overlayId: "cz-debug-overlay",
    contentId: "cz-debug-content",
    maxLines: 80,
    tick: 0,

    start() {
        if (this.started) return;
        this.started = true;

        this.createOverlay();
        this.log("DEBUG START");

        this.bindErrors();
        this.bindHeartbeat();
        this.bindDirectElementLogs();
        this.bindGlobalLogs();

        this.log("DEBUG READY");
    },

    createOverlay() {
        if (document.getElementById(this.overlayId)) return;

        const wrap = document.createElement("div");
        wrap.id = this.overlayId;
        wrap.style.position = "fixed";
        wrap.style.top = "0";
        wrap.style.left = "0";
        wrap.style.right = "0";
        wrap.style.maxHeight = "34%";
        wrap.style.overflow = "hidden";
        wrap.style.background = "rgba(0,0,0,0.82)";
        wrap.style.color = "#00ff88";
        wrap.style.fontSize = "11px";
        wrap.style.lineHeight = "1.35";
        wrap.style.zIndex = "999999";
        wrap.style.padding = "6px";
        wrap.style.boxSizing = "border-box";
        wrap.style.pointerEvents = "none";
        wrap.style.fontFamily = "monospace";
        wrap.style.borderBottom = "1px solid rgba(255,255,255,0.12)";

        const content = document.createElement("div");
        content.id = this.contentId;
        content.style.maxHeight = "calc(34vh - 12px)";
        content.style.overflow = "hidden";
        content.style.whiteSpace = "pre-wrap";
        content.style.wordBreak = "break-word";
        content.style.pointerEvents = "none";

        wrap.appendChild(content);
        document.body.appendChild(wrap);
    },

    getBox() {
        return document.getElementById(this.contentId);
    },

    log(text) {
        const box = this.getBox();
        if (!box) return;

        const row = document.createElement("div");
        row.textContent = String(text);
        box.appendChild(row);

        while (box.children.length > this.maxLines) {
            box.removeChild(box.firstChild);
        }

        console.log("[CZ-DEBUG]", text);
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

    bindErrors() {
        window.addEventListener("error", (event) => {
            this.log(`JS ERROR -> ${event.message || "unknown"}`);
        });

        window.addEventListener("unhandledrejection", (event) => {
            const reason = event?.reason?.message || String(event?.reason || "unknown");
            this.log(`PROMISE ERROR -> ${reason}`);
        });
    },

    bindHeartbeat() {
        setInterval(() => {
            this.tick += 1;

            const activeScreen = window.CryptoZoo?.gameplay?.activeScreen || "unknown";
            const loading = document.getElementById("loading-screen");
            const tapButton = document.getElementById("tapButton");
            const tapArea = document.querySelector(".tap-area");
            const menuButtons = document.querySelectorAll(".menu-btn").length;

            this.log(
                `TICK ${this.tick} | screen=${activeScreen} | loading=${!!loading} | tapButton=${!!tapButton} | tapArea=${!!tapArea} | menuBtns=${menuButtons}`
            );
        }, 3000);
    },

    bindDirectElementLogs() {
        const bind = () => {
            const tapButton = document.getElementById("tapButton");
            const tapArea = document.querySelector(".tap-area");
            const menuButtons = document.querySelectorAll(".menu-btn");
            const topProfileBtn = document.getElementById("topProfileBtn");
            const topSettingsBtn = document.getElementById("topSettingsBtn");

            if (tapButton && tapButton.dataset.debugBound !== "1") {
                tapButton.dataset.debugBound = "1";

                tapButton.addEventListener("touchstart", () => {
                    this.log("DIRECT tapButton touchstart");
                }, { passive: true });

                tapButton.addEventListener("touchend", () => {
                    this.log("DIRECT tapButton touchend");
                }, { passive: true });

                tapButton.addEventListener("click", () => {
                    this.log("DIRECT tapButton click");
                }, true);
            }

            if (tapArea && tapArea.dataset.debugBound !== "1") {
                tapArea.dataset.debugBound = "1";

                tapArea.addEventListener("touchstart", () => {
                    this.log("DIRECT tapArea touchstart");
                }, { passive: true });

                tapArea.addEventListener("touchend", () => {
                    this.log("DIRECT tapArea touchend");
                }, { passive: true });

                tapArea.addEventListener("click", () => {
                    this.log("DIRECT tapArea click");
                }, true);
            }

            menuButtons.forEach((btn, index) => {
                if (btn.dataset.debugBound === "1") return;
                btn.dataset.debugBound = "1";

                btn.addEventListener("touchstart", () => {
                    this.log(`DIRECT menuBtn[${index}] touchstart nav=${btn.getAttribute("data-nav") || ""}`);
                }, { passive: true });

                btn.addEventListener("touchend", () => {
                    this.log(`DIRECT menuBtn[${index}] touchend nav=${btn.getAttribute("data-nav") || ""}`);
                }, { passive: true });

                btn.addEventListener("click", () => {
                    this.log(`DIRECT menuBtn[${index}] click nav=${btn.getAttribute("data-nav") || ""}`);
                }, true);
            });

            [topProfileBtn, topSettingsBtn].forEach((btn) => {
                if (!btn || btn.dataset.debugBound === "1") return;
                btn.dataset.debugBound = "1";

                btn.addEventListener("touchstart", () => {
                    this.log(`DIRECT ${btn.id} touchstart`);
                }, { passive: true });

                btn.addEventListener("click", () => {
                    this.log(`DIRECT ${btn.id} click`);
                }, true);
            });
        };

        bind();
        setInterval(bind, 1000);
    },

    bindGlobalLogs() {
        const touchHandler = (e) => {
            const touch =
                (e.touches && e.touches[0]) ||
                (e.changedTouches && e.changedTouches[0]) ||
                null;

            const target = this.describeElement(e.target);

            if (!touch) {
                this.log(`GLOBAL ${e.type} -> ${target}`);
                return;
            }

            const x = Math.floor(Number(touch.clientX) || 0);
            const y = Math.floor(Number(touch.clientY) || 0);
            const pointEl = document.elementFromPoint(x, y);

            this.log(`GLOBAL ${e.type} -> ${target} | point=${x},${y} -> ${this.describeElement(pointEl)}`);
        };

        const clickHandler = (e) => {
            const x = Math.floor(Number(e.clientX) || 0);
            const y = Math.floor(Number(e.clientY) || 0);
            const pointEl = document.elementFromPoint(x, y);

            this.log(`GLOBAL click -> ${this.describeElement(e.target)} | point=${x},${y} -> ${this.describeElement(pointEl)}`);
        };

        document.addEventListener("touchstart", touchHandler, true);
        document.addEventListener("touchend", touchHandler, true);
        document.addEventListener("click", clickHandler, true);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    window.CryptoZoo?.debugTouch?.start?.();
});