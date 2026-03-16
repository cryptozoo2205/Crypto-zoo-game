window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.minigames = {

spinWheel() {

const roll = Math.random()

if (roll < 0.5) {

const coins = Math.floor(Math.random()*5000)+1000
CryptoZoo.state.coins += coins
CryptoZoo.ui.showToast("Coins +" + coins)

}

else if (roll < 0.8) {

const gems = 1
CryptoZoo.state.gems += gems
CryptoZoo.ui.showToast("Gem +1")

}

else {

CryptoZoo.state.rewardBalance += 0.01
CryptoZoo.ui.showToast("Reward Balance +0.01")

}

CryptoZoo.ui.render()
CryptoZoo.api.savePlayer()

}

};