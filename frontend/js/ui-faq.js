window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiFaq = {
    renderSettingsFaq() {
        const mount = document.getElementById("settingsFaqMount");
        if (!mount) return;

        mount.innerHTML = `
            <div
                id="settingsFaqPanel"
                class="profile-boost-row hidden"
            >
                <div class="profile-boost-left">
                    <div class="profile-boost-label">FAQ / Help</div>
                    <div class="profile-boost-value" style="font-size:14px; line-height:1.45; font-weight:700;">
                        <div style="margin-bottom:10px;">
                            <strong>🎮 Player Level</strong><br>
                            Poziom gracza rośnie za XP. Wyższy poziom odblokowuje kolejne ekspedycje.
                        </div>

                        <div style="margin-bottom:10px;">
                            <strong>🐾 Animal Level</strong><br>
                            Poziom zwierzęcia zwiększa dochód każdej posiadanej sztuki danego gatunku.
                        </div>

                        <div style="margin-bottom:10px;">
                            <strong>🛒 Kup / Buy</strong><br>
                            Kupuje nową sztukę zwierzęcia i zwiększa liczbę posiadanych zwierząt.
                        </div>

                        <div style="margin-bottom:10px;">
                            <strong>⬆ Lvl Up / Ulepsz</strong><br>
                            Zwiększa efektywność już posiadanych sztuk tego zwierzęcia.
                        </div>

                        <div style="margin-bottom:10px;">
                            <strong>💰 Zoo Income</strong><br>
                            To coins zdobywane automatycznie co sekundę z posiadanych zwierząt.
                        </div>

                        <div style="margin-bottom:10px;">
                            <strong>👆 Coins Per Click</strong><br>
                            Określa ile coins dostajesz za jedno kliknięcie / tap.
                        </div>

                        <div style="margin-bottom:10px;">
                            <strong>🎁 Daily Reward</strong><br>
                            Codzienna nagroda odblokowuje się po czasie gry i później działa na cooldownie.
                        </div>

                        <div style="margin-bottom:10px;">
                            <strong>🌍 Expeditions</strong><br>
                            Ekspedycje dają pasywne nagrody po czasie: coins, gems i czasem reward.
                        </div>

                        <div style="margin-bottom:10px;">
                            <strong>⚡ Boosts</strong><br>
                            Boost X2 podwaja klik i dochód zoo na ograniczony czas.
                        </div>

                        <div>
                            <strong>💎 Reward / Wallet</strong><br>
                            Reward to zdobyty zasób. Wallet to miejsce, do którego możesz go przenieść z profilu.
                        </div>
                    </div>

                    <button
                        id="closeFaqBtn"
                        class="profile-close-btn"
                        type="button"
                        style="margin-top:14px; background:linear-gradient(180deg, rgba(42, 52, 76, 0.95) 0%, rgba(25, 32, 48, 0.95) 100%); color:#ffffff; border:1px solid rgba(255,255,255,0.08);"
                    >
                        Zamknij FAQ
                    </button>
                </div>
            </div>
        `;
    },

    init() {
        this.renderSettingsFaq();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    CryptoZoo.uiFaq?.init?.();
});