(function () {
"use strict";

window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.autoMining = {
init() {
this.inject();
this.render();
},

inject() {
if (document.getElementById("autoMiningStyles")) return;

const style = document.createElement("style");
style.id = "autoMiningStyles";
style.textContent = `
.cz-auto-mining-wrap{
margin-top:12px;
width:100%;
}

.cz-auto-mining-card{
position:relative;
width:100%;
min-height:96px;
padding:14px;
border-radius:18px;
border:1px solid rgba(255,255,255,.10);
background:linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.02));
box-shadow:0 10px 28px rgba(0,0,0,.28);
opacity:.88;
filter:saturate(.78);
display:flex;
flex-direction:column;
justify-content:space-between;
cursor:pointer;
}

.cz-auto-mining-top{
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:8px;
}

.cz-auto-mining-lock{
width:34px;
height:34px;
border-radius:12px;
display:flex;
align-items:center;
justify-content:center;
background:rgba(255,255,255,.07);
font-size:16px;
}

.cz-auto-mining-badge{
padding:4px 10px;
border-radius:999px;
font-size:10px;
font-weight:800;
background:rgba(255,255,255,.08);
color:rgba(255,255,255,.72);
letter-spacing:.08em;
}

.cz-auto-mining-title{
font-size:17px;
font-weight:900;
color:#fff;
}

.cz-auto-mining-sub{
font-size:13px;
font-weight:800;
color:#ffd76a;
margin-top:4px;
}

.cz-auto-mining-desc{
font-size:12px;
color:rgba(255,255,255,.65);
margin-top:4px;
}
`;
document.head.appendChild(style);
},

render() {
const boost =
document.querySelector("#boostCenterCard") ||
document.querySelector("[data-feature-card='boost-center']") ||
document.querySelector(".boost-center-card");

if (!boost || !boost.parentNode) return;
if (document.querySelector("#autoMiningCard")) return;

const wrap = document.createElement("div");
wrap.className = "cz-auto-mining-wrap";

wrap.innerHTML = `
<div id="autoMiningCard" class="cz-auto-mining-card">
<div class="cz-auto-mining-top">
<div class="cz-auto-mining-lock">🔒</div>
<div class="cz-auto-mining-badge">SOON</div>
</div>

<div class="cz-auto-mining-title">Auto Mining</div>
<div class="cz-auto-mining-sub">Wkrótce</div>
<div class="cz-auto-mining-desc">System automatycznego wydobycia reward.</div>
</div>
`;

boost.insertAdjacentElement("afterend", wrap);

const card = document.getElementById("autoMiningCard");
if (card) {
card.addEventListener("click", () => {
alert("Auto Mining wkrótce dostępny");
});
}
}
};

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", () => {
window.CryptoZoo.autoMining.init();
});
} else {
window.CryptoZoo.autoMining.init();
}

})();
