window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.gameplay = {

MAX_OFFLINE_SECONDS:28800,

click(){

CryptoZoo.state.coins+=CryptoZoo.state.coinsPerClick;

CryptoZoo.ui.render();

},

buyAnimal(type){

const state=CryptoZoo.state;
const config=CryptoZoo.config.animals[type];

if(state.coins<config.buyCost){

CryptoZoo.ui.showToast("Za mało monet");

return;

}

state.coins-=config.buyCost;

state.animals[type].count+=1;

CryptoZoo.ui.showToast("Kupiono "+config.name);

this.updateIncome();

CryptoZoo.ui.render();

},

upgradeAnimal(type){

const state=CryptoZoo.state;

const config=CryptoZoo.config.animals[type];

const cost=config.upgradeBaseCost*state.animals[type].level;

if(state.coins<cost){

CryptoZoo.ui.showToast("Za mało monet");

return;

}

state.coins-=cost;

state.animals[type].level+=1;

CryptoZoo.ui.showToast("Ulepszono "+config.name);

this.updateIncome();

CryptoZoo.ui.render();

},

updateIncome(){

let income=0;

Object.keys(CryptoZoo.state.animals).forEach(type=>{

const a=CryptoZoo.state.animals[type];
const c=CryptoZoo.config.animals[type];

income+=a.count*a.level*c.baseIncome;

});

CryptoZoo.state.zooIncome=income;

},

startPassiveIncome(){

setInterval(()=>{

CryptoZoo.state.coins+=CryptoZoo.state.zooIncome;

CryptoZoo.ui.render();

},1000);

},

calculateOfflineIncome(){

const now=Date.now();

const last=CryptoZoo.state.lastLogin||now;

let seconds=Math.floor((now-last)/1000);

seconds=Math.min(seconds,this.MAX_OFFLINE_SECONDS);

const reward=seconds*CryptoZoo.state.zooIncome;

if(reward>0){

CryptoZoo.state.coins+=reward;

CryptoZoo.ui.showToast(
"Offline zarobek: "+CryptoZoo.formatNumber(reward)
);

}

CryptoZoo.state.lastLogin=now;

},

init(){

this.calculateOfflineIncome();

this.startPassiveIncome();

}

};