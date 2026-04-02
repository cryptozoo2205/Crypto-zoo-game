window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offlinePanelFix = {
    observer: null,

    removeDuplicates() {
        const panels = Array.from(document.querySelectorAll(".home-offline-strip"));

        if (panels.length <= 1) {
            return;
        }

        const preferred =
            document.querySelector("#game .home-offline-strip") ||
            panels[panels.length - 1];

        panels.forEach((panel) => {
            if (panel !== preferred) {
                try {
                    panel.remove();
                } catch (error) {
                    console.warn("Failed to remove duplicate offline panel:", error);
                }
            }
        });
    },

    startObserver() {
        if (this.observer) return;

        this.observer = new MutationObserver(() => {
            this.removeDuplicates();
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    init() {
        this.removeDuplicates();

        setTimeout(() => this.removeDuplicates(), 100);
        setTimeout(() => this.removeDuplicates(), 300);
        setTimeout(() => this.removeDuplicates(), 700);

        this.startObserver();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    CryptoZoo.offlinePanelFix.init();
});