window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.ui = {

getEl(id){
return document.getElementById(id);
},

showToast(message){

const toast=this.getEl("toast");
if(!toast)return;

toast.textContent=message;
toast.style.display="block";

clearTimeout(window.toastTimeout);

window.toastTimeout=setTimeout(()=>{
toast.style.display="none";
},2000);

},

showScreen(screenId){

const screens=document.querySelectorAll(".screen");
const navButtons=document.querySelectorAll(".nav-btn");

screens.forEach(s=>{
s.classList.remove("active-screen");
});

navButtons.forEach(b=>{
b.classList.remove("active-nav");
});

const target=document.getElementById(screenId);

if(target){
target.classList.add("active-screen");
}

navButtons.forEach(btn=>{
if(btn.dataset.screen===screenId){
btn.classList.add("active-nav");
}
});

},

renderZoo(){

const zooContainer=document.getElementById("zoo-list");

if(!zooContainer)return;

zooContainer.innerHTML="";

const animals=CryptoZoo.config.animals;

Object.keys(animals).forEach(key=>{

const a=animals[key];

const row=document.createElement("div");
row.className="animal-row";

row.innerHTML=`

<div class="animal-left">

<div class="animal-icon">🐾</div>

<div class="animal-text">

<div class="animal-name">${a.name}</div>

<div class="animal-desc">
Dochód ${a.baseIncome}/sek • Koszt ${CryptoZoo.formatNumber(a.buyCost)}
</div>

<div class="animal-owned">
Posiadasz: <span id="${key}-count">0</span>
</div>

</div>

</div>

<div class="animal-actions">

<button id="buy-${key}">
Kup
</button>

<button id="upgrade-${key}">
Lvl Up
</button>

</div>

`;

zooContainer.appendChild(row);

});

},

render(){

const state=CryptoZoo.state;

this.getEl("coins-count").textContent=
CryptoZoo.formatNumber(state.coins);

this.getEl("level").textContent=
CryptoZoo.formatNumber(state.level);

this.getEl("coins-per-click").textContent=
CryptoZoo.formatNumber(state.coinsPerClick);

this.getEl("zoo-income").textContent=
CryptoZoo.formatNumber(state.zooIncome);

}

};