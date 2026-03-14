
window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.api = {
    async savePlayer() {
        const state = CryptoZoo.state;

        try {
            await fetch("/player/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    telegramId: state.telegramId,
                    username: state.playerUsername,
                    coins: state.coins,
                    level: state.level,
                    coinsPerClick: state.coinsPerClick,
                    upgradeCost: state.upgradeCost,
                    animals: state.animals,
                    lastLogin: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error("Błąd zapisu gracza:", error);
        }
    },

    async loadPlayer() {
        const state = CryptoZoo.state;

        try {
            const response = await fetch(`/player/${state.telegramId}`);
            return await response.json();
        } catch (error) {
            console.error("Błąd pobierania gracza:", error);
            return null;
        }
    },

    async loadRanking() {
        try {
            const response = await fetch("/ranking");
            return await response.json();
        } catch (error) {
            console.error("Błąd pobierania rankingu:", error);
            return [];
        }
    }
};