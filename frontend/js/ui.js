window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ui = {

render(){

this.update("coins-count",CryptoZoo.state.coins);
this.update("gems-count",CryptoZoo.state.gems);
this.update("level",CryptoZoo.state.level);
this.update("coins-per-click",CryptoZoo.state.coinsPerClick);

this.renderExpeditions();

},

update(id,value){

const el=document.getElementById(id);

if(el){
el.innerText=value;
}

},

renderExpeditions(){

const container=document.getElementById("expeditions-list");

if(!container) return;

container.innerHTML="";

const expedition=CryptoZoo.state.expedition;

if(expedition){

const timeLeft = Math.max(0,Math.floor((expedition.endTime-Date.now())/1000));

container.innerHTML=`
<div class="expedition-card">
Trwa ekspedycja<br>
Pozostało: ${timeLeft}s<br>
<button onclick="CryptoZoo.gameplay.collectExpedition()">Odbierz</button>
</div>
`;

return;

}

CryptoZoo.config.expeditions.forEach(exp=>{

const el=document.createElement("div");

el.className="expedition-card";

el.innerHTML=`
<h3>${exp.name}</h3>
Czas: ${exp.duration}s<br>
Nagroda: ${exp.rewardCoins} coins + ${exp.rewardGems} gems<br>
<button onclick="CryptoZoo.gameplay.startExpedition('${exp.id}')">
Start
</button>
`;

container.appendChild(el);

});

},

showToast(text){

alert(text);

}

};