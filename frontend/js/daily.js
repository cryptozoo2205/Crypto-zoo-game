window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.daily = {

rewards:[
{coins:5000},
{gems:1},
{coins:10000},
{box:"rare"},
{gems:2},
{box:"epic"},
{box:"legendary"}
],

init(){

const lastClaim = localStorage.getItem("dailyLast")
const today = new Date().toDateString()

if(lastClaim === today) return

document.getElementById("dailyReward").style.display="block"

},

claim(){

const day = parseInt(localStorage.getItem("dailyDay") || 0)

const reward = this.rewards[day]

if(reward.coins){
CryptoZoo.state.coins += reward.coins
CryptoZoo.ui.showToast("+"+reward.coins+" coins")
}

if(reward.gems){
CryptoZoo.state.gems += reward.gems
CryptoZoo.ui.showToast("+"+reward.gems+" gems")
}

if(reward.box){
CryptoZoo.boxes.open(reward.box)
}

localStorage.setItem("dailyLast", new Date().toDateString())
localStorage.setItem("dailyDay", (day+1)%7)

CryptoZoo.ui.render()

document.getElementById("dailyReward").style.display="none"

}

}