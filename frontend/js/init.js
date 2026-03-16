window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.init = async function () {

console.log("Crypto Zoo start");

try {

/* TELEGRAM INIT */
if (CryptoZoo.telegram && CryptoZoo.telegram.init) {
CryptoZoo.telegram.init();
}

/* LOAD PLAYER DATA */
if (CryptoZoo.api && CryptoZoo.api.loadPlayer) {
await CryptoZoo.api.loadPlayer();
}

/* RENDER UI */
if (CryptoZoo.ui && CryptoZoo.ui.render) {
CryptoZoo.ui.render();
}

/* SHOP INIT */
if (CryptoZoo.shop && CryptoZoo.shop.init) {
CryptoZoo.shop.init();
}

/* BOX SYSTEM INIT */
if (CryptoZoo.boxes && CryptoZoo.boxes.init) {
CryptoZoo.boxes.init();
}

/* MINI GAMES INIT */
if (CryptoZoo.minigames && CryptoZoo.minigames.init) {
CryptoZoo.minigames.init();
}

/* DAILY REWARD INIT */
if (CryptoZoo.daily && CryptoZoo.daily.init) {
CryptoZoo.daily.init();
}

/* GAMEPLAY INIT */
if (CryptoZoo.gameplay && CryptoZoo.gameplay.init) {
CryptoZoo.gameplay.init();
}

} catch (error) {
console.error("Init error:", error);
}

};

document.addEventListener("DOMContentLoaded", function () {
if (CryptoZoo.init) {
CryptoZoo.init();
}
});