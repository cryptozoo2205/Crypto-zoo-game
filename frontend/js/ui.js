window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.ui = {

toastTimeout:null,

showToast(text){

let toast=document.getElementById("toast");

if(!toast){

toast=document.createElement("div");

toast.id="toast";

toast.style.position="fixed";
toast.style.bottom="90px";
toast.style.left="50%";
toast.style.transform="translateX(-50%)";

toast.style.background="rgba(0,0,0,0.8)";
toast.style.color="white";

toast.style.padding="12px 20px";
toast.style.borderRadius="12px";

toast.style.fontSize="14px";

toast.style.zIndex="999";

document.body.appendChild(toast);

}

toast.innerText=text;
toast.style.display="block";

clearTimeout(this.toastTimeout);

this.toastTimeout=setTimeout(()=>{

toast.style.display="none";

},2000);

},

update(id,value){

const el=document.getElementById(id);

if(el){
el.innerText=value;
}

},

render(){

const state=CryptoZoo.state;

this.update("coins-count",CryptoZoo.formatNumber(state.coins));
this.update("gems-count",CryptoZoo.formatNumber(state.gems));
this.update("level",state.level);
this.update("coins-per-click",state.coinsPerClick);
this.update("zoo-income",CryptoZoo.formatNumber(state.zooIncome));

}

};