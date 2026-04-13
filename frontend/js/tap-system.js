window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.tapSystem = {
    getTapCountFromTouches(touchCount) {
        const safeCount = Number(touchCount) || 1;
        return Math.max(1, Math.min(3, safeCount));
    },

    handleTap(tapCount = 1) {
        CryptoZoo.state = CryptoZoo.state || {};

        const safeTapCount = this.getTapCountFromTouches(tapCount);
        const clickValue = CryptoZoo.gameplay?.getEffectiveCoinsPerClick?.(safeTapCount) || 0;

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + clickValue;
        CryptoZoo.state.xp = (Number(CryptoZoo.state.xp) || 0) + safeTapCount;

        CryptoZoo.gameplay?.recalculateLevel?.();

        CryptoZoo.ui?.animateCoin?.(safeTapCount);
        
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        return true;
    },

    bind() {
        const tapButton = document.getElementById("tapButton");
        if (!tapButton) return false;

        tapButton.onclick = (event) => {
            if (event) {
                event.preventDefault();
            }

            if (Date.now() < (Number(CryptoZoo.gameplay?.suppressClickUntil) || 0)) {
                return;
            }

            this.handleTap(1);
        };

        tapButton.addEventListener(
            "touchstart",
            (event) => {
                if (CryptoZoo.gameplay?.touchTapLock) {
                    event.preventDefault();
                    return;
                }

                const touches = this.getTapCountFromTouches(event.touches?.length || 1);

                CryptoZoo.gameplay.touchTapLock = true;
                CryptoZoo.gameplay.suppressClickUntil = Date.now() + 700;

                event.preventDefault();
                this.handleTap(touches);
            },
            { passive: false }
        );

        const unlockTouchTap = () => {
            if (CryptoZoo.gameplay) {
                CryptoZoo.gameplay.touchTapLock = false;
            }
        };

        tapButton.addEventListener("touchend", unlockTouchTap, { passive: true });
        tapButton.addEventListener("touchcancel", unlockTouchTap, { passive: true });

        return true;
    }
};