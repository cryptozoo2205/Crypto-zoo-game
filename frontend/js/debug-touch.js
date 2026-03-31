window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.debugTouch = {
    enabled: true,
    maxLines: 120,
    overlayId: "cz-debug-overlay",
    contentId: "cz-debug-content",
    started: false,

    start() {
        if (this.started) return;
        this.started = true;

        this.createOverlay();
        this.log("DEBUG START");

        this.bindErrorLogs();
        this.bindPointerLogs();
        this.bindStateChecks();

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
        wrap.style.maxHeight = "42%";
        wrap.style.overflow = "hidden";
        wrap.style.background = "rgba(0,0,0,0.84)";
        wrap.style.color = "#00ff88";
        wrap.style.fontSize = "11px";
        wrap.style.lineHeight = "1.35";
        wrap.style.zIndex = "999999";
        wrap.style.padding = "6px";
        wrap.style.boxSizing = "border-box";
        wrap.style.pointerEvents = "none";
        wrap.style.borderBottom = "1px solid rgba(255,255,255,0.12)";
        wrap.style.fontFamily = "monospace";

        const content = document.createElement("div");
        content.id = this.contentId;
        content.style.maxHeight = "calc(42vh - 12px)";
        content.style.overflow = "auto";
        content.style.whiteSpace = "pre-wrap";
        content.style.wordBreak = "break-word";
        content.style.pointerEvents = "none";

        wrap.appendChild(content);
        document.body.appendChild(wrap);
    },

    getContentEl() {
        return document.getElementById(this.contentId);
    },

    log(text) {
        if (!this.enabled) return;

        const el = this.getContentEl();
        if (!el) return;

        const row = document.createElement("div");
        row.textContent = String(text);
        el.appendChild(row);

        while (el.children.length > this.maxLines) {
            el.removeChild(el.firstChild);
        }

        el.scrollTop = el.scrollHeight;
        console.log("[CZ-DEBUG]", text);
    },

    safeText(value, fallback = "") {
        if (value === null || value === undefined) return fallback;
        return String(value);
    },

    describeElement(el) {
        if (!el) return "null";

        const tag = this.safeText(el.tagName, "unknown").toUpperCase();
        const id = el.id ? `#${el.id}` : "";
        const cls = typeof el.className === "string" && el.className.trim()
            ? "." + el.className.trim().replace(/\s+/g, ".")
            : "";

        return `${tag}${id}${cls}`;
    },

    getElementAtPoint(x, y) {
        try {
            return document.elementFromPoint(Number(x) || 0, Number(y) || 0);
        } catch (e) {
            return null;
        }
    },

    getOpenModalInfo() {
        const ids = [
            "loading-screen",
            "profileModal",
            "settingsModal",
            "dailyRewardModal",
            "depositPaymentModal"
        ];

        return ids.map((id) => {
            const el = document.getElementById(id);
            if (!el) return `${id}:missing`;

            const hiddenClass = el.classList.contains("hidden");
            const style = window.getComputedStyle(el);

            return `${id}:{hiddenClass=${hiddenClass},display=${style.display},visibility=${style.visibility},pointer=${style.pointerEvents}}`;
        }).join(" | ");
    },

    bindErrorLogs() {
        window.addEventListener("error", (event) => {
            const msg = this.safeText(event.message, "Unknown error");
            const src = this.safeText(event.filename, "");
            const line = Number(event.lineno) || 0;
            this.log(`JS ERROR -> ${msg} @ ${src}:${line}`);
        });

        window.addEventListener("unhandledrejection", (event) => {
            let reason = "unknown";
            try {
                reason = this.safeText(event.reason?.message || event.reason, "unknown");
            } catch (e) {
                reason = "unknown";
            }
            this.log(`PROMISE ERROR -> ${reason}`);
        });
    },

    bindPointerLogs() {
        const touchHandler = (e) => {
            const touch =
                (e.touches && e.touches[0]) ||
                (e.changedTouches && e.changedTouches[0]) ||
                null;

            const targetDesc = this.describeElement(e.target);

            if (!touch) {
                this.log(`${e.type} target=${targetDesc}`);
                return;
            }

            const x = Math.floor(Number(touch.clientX) || 0);
            const y = Math.floor(Number(touch.clientY) || 0);
            const pointEl = this.getElementAtPoint(x, y);
            const pointDesc = this.describeElement(pointEl);

            this.log(`${e.type} target=${targetDesc} | point=${x},${y} -> ${pointDesc}`);
        };

        const clickHandler = (e) => {
            const x = Math.floor(Number(e.clientX) || 0);
            const y = Math.floor(Number(e.clientY) || 0);
            const pointEl = this.getElementAtPoint(x, y);
            const pointDesc = this.describeElement(pointEl);
            const targetDesc = this.describeElement(e.target);

            this.log(`click target=${targetDesc} | point=${x},${y} -> ${pointDesc}`);
        };

        window.addEventListener("touchstart", touchHandler, { capture: true, passive: true });
        window.addEventListener("touchend", touchHandler, { capture: true, passive: true });
        document.addEventListener("touchstart", touchHandler, { capture: true, passive: true });
        document.addEventListener("touchend", touchHandler, { capture: true, passive: true });

        window.addEventListener("click", clickHandler, true);
        document.addEventListener("click", clickHandler, true);
    },

    bindStateChecks() {
        setInterval(() => {
            const activeScreen = this.safeText(window.CryptoZoo?.gameplay?.activeScreen, "unknown");
            const loadingEl = document.getElementById("loading-screen");
            const loadingExists = !!loadingEl;

            let loadingInfo = "loading-screen:missing";
            if (loadingEl) {
                const style = window.getComputedStyle(loadingEl);
                loadingInfo = `loading-screen:{display=${style.display},visibility=${style.visibility},pointer=${style.pointerEvents},opacity=${style.opacity}}`;
            }

            this.log(`STATE -> screen=${activeScreen} | ${loadingInfo}`);
            this.log(`MODALS -> ${this.getOpenModalInfo()}`);
        }, 4000);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    window.CryptoZoo?.debugTouch?.start?.();
});