window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.gameplay = {

startExpedition(type){

const expConfig = CryptoZoo.config.expeditions.find(e=>e.id===type);

if(!expConfig) return;

if(CryptoZoo.state.expedition){
CryptoZoo.ui.showToast("Ekspedycja już trwa");
return;
}

const endTime = Date.now() + expConfig.duration*1000;

CryptoZoo.state.expedition={
type:type,
endTime:endTime
};

CryptoZoo.ui.showToast("Ekspedycja rozpoczęta");

CryptoZoo.ui.renderExpeditions();

},

collectExpedition(){

const exp = CryptoZoo.state.expedition;

if(!exp) return;

const expConfig = CryptoZoo.config.expeditions.find(e=>e.id===exp.type);

if(Date.now() < exp.endTime){

CryptoZoo.ui.showToast("Jeszcze trwa");

return;

}

CryptoZoo.state.coins += expConfig.rewardCoins;
CryptoZoo.state.gems += expConfig.rewardGems;

CryptoZoo.state.expedition=null;

CryptoZoo.ui.showToast("Nagroda odebrana");

CryptoZoo.ui.render();
CryptoZoo.ui.renderExpeditions();

}

};