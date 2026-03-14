window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.config = {

economy: {
startCoins: 0,
startGems: 0,
startLevel: 1,
startCoinsPerClick: 1,
startUpgradeCost: 50,
clickUpgradeMultiplier: 2.4,
levelDivider: 5000,
passiveIncomeIntervalMs: 1000,
gemsPerLevel: 1
},

animals: {

monkey:{
key:"monkey",
name:"Monkey",
buyCost:100,
baseIncome:1,
upgradeBaseCost:150
},

rabbit:{
key:"rabbit",
name:"Rabbit",
buyCost:300,
baseIncome:2,
upgradeBaseCost:400
},

fox:{
key:"fox",
name:"Fox",
buyCost:800,
baseIncome:4,
upgradeBaseCost:1000
},

wolf:{
key:"wolf",
name:"Wolf",
buyCost:2000,
baseIncome:8,
upgradeBaseCost:3000
},

panda:{
key:"panda",
name:"Panda",
buyCost:6000,
baseIncome:15,
upgradeBaseCost:8000
},

tiger:{
key:"tiger",
name:"Tiger",
buyCost:15000,
baseIncome:30,
upgradeBaseCost:20000
},

gorilla:{
key:"gorilla",
name:"Gorilla",
buyCost:50000,
baseIncome:70,
upgradeBaseCost:70000
},

lion:{
key:"lion",
name:"Lion",
buyCost:150000,
baseIncome:150,
upgradeBaseCost:200000
},

elephant:{
key:"elephant",
name:"Elephant",
buyCost:500000,
baseIncome:400,
upgradeBaseCost:700000
},

giraffe:{
key:"giraffe",
name:"Giraffe",
buyCost:1500000,
baseIncome:900,
upgradeBaseCost:2000000
}

}

};

window.CryptoZoo.formatNumber=function(num){

num=Number(num)||0;

if(num>=1e12)return(num/1e12).toFixed(2)+"T";
if(num>=1e9)return(num/1e9).toFixed(2)+"B";
if(num>=1e6)return(num/1e6).toFixed(2)+"M";
if(num>=1e3)return(num/1e3).toFixed(2)+"K";

return Math.floor(num).toString();

};