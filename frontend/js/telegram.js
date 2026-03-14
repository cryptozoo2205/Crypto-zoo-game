window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.telegram = {

setupPlayerIdentity() {

if(!window.CryptoZoo.state){
window.CryptoZoo.state = {};
}

try{

if(window.Telegram && Telegram.WebApp){

const tg = Telegram.WebApp;

tg.ready();
tg.expand();

const user = tg.initDataUnsafe?.user;

if(user){

CryptoZoo.state.telegramUser = {
id: user.id,
username: user.username || "Gracz"
};

localStorage.setItem("telegramId", user.id);
localStorage.setItem("telegramUsername", user.username || "Gracz");

return;

}

}

}catch(e){

console.log("Telegram init skipped");

}

let localId = localStorage.getItem("telegramId");

if(!localId){

localId = "local-player";
localStorage.setItem("telegramId", localId);

}

CryptoZoo.state.telegramUser = {
id: localId,
username: localStorage.getItem("telegramUsername") || "Gracz"
};

}

};