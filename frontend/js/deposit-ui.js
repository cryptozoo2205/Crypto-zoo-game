window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.depositUI = {
    loading: false,

    init() {
        this.bindButtons();
    },

    bindButtons() {
        const createBtn = document.getElementById("settingsCreateDepositBtn");
        if (!createBtn || createBtn.dataset.depositUiBound === "1") return;

        createBtn.dataset.depositUiBound = "1";
        createBtn.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const amount = this.getSelectedAmountUsd();
            await this.createDeposit(amount);
        });
    },

    getSelectedAmountUsd() {
        const input =
            document.getElementById("settingsDepositAmountInput") ||
            document.getElementById("depositAmountInput");

        const raw =
            input?.value ||
            document.querySelector(".settings-deposit-amount-option.active")?.dataset?.amount ||
            "1";

        const amount = Number(String(raw).replace(",", "."));
        if (!Number.isFinite(amount) || amount <= 0) return 1;
        return Number(amount.toFixed(2));
    },

    setLoading(isLoading) {
        this.loading = Boolean(isLoading);

        const createBtn = document.getElementById("settingsCreateDepositBtn");
        if (createBtn) {
            createBtn.disabled = this.loading;
            createBtn.style.opacity = this.loading ? "0.7" : "1";
            createBtn.style.pointerEvents = this.loading ? "none" : "";
        }

        if (this.loading) {
            CryptoZoo.ui?.showToast?.("Tworzenie depozytu TON...");
        }
    },

    async createDeposit(amountUsd) {
        if (this.loading) return false;

        try {
            const safeAmountUsd = Number(amountUsd || 0);

            if (!Number.isFinite(safeAmountUsd) || safeAmountUsd < 1) {
                throw new Error("Minimalna wpłata to 1$");
            }

            this.setLoading(true);

            const telegramId =
                CryptoZoo.telegramUser?.id ||
                window.Telegram?.WebApp?.initDataUnsafe?.user?.id ||
                String(window.Telegram?.WebApp?.initDataUnsafe?.user?.username || "").trim() ||
                "guest";

            const username =
                CryptoZoo.telegramUser?.username ||
                window.Telegram?.WebApp?.initDataUnsafe?.user?.username ||
                "";

            const response = await fetch("/api/deposit/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    telegramId,
                    username,
                    amountUsd: safeAmountUsd,
                    source: "ton"
                })
            });

            const result = await response.json();

            if (!response.ok || !result?.ok) {
                throw new Error(result?.error || "payment_create_failed");
            }

            const paymentUrl =
                result?.payment?.paymentUrl ||
                result?.paymentUrl ||
                result?.deposit?.paymentUrl ||
                "";

            const payAddress =
                result?.payment?.payAddress ||
                result?.payment?.receiverAddress ||
                result?.deposit?.walletAddress ||
                result?.deposit?.receiverAddress ||
                "";

            const payAmountTon = Number(
                result?.payment?.payAmount ||
                result?.payment?.amount ||
                result?.deposit?.amount ||
                0
            );

            const nanoAmount =
                Number.isFinite(payAmountTon) && payAmountTon > 0
                    ? Math.floor(payAmountTon * 1000000000)
                    : 0;

            const tonDeepLink =
                payAddress && nanoAmount > 0
                    ? `https://app.tonkeeper.com/transfer/${payAddress}?amount=${nanoAmount}`
                    : (payAddress ? `https://app.tonkeeper.com/transfer/${payAddress}` : "");

            const finalUrl = tonDeepLink;

            if (!finalUrl) {
                throw new Error("Brak linku płatności");
            }

            this.lastDepositId = result?.deposit?.id || result?.payment?.depositId || "";

            const paymentId = String(result?.payment?.paymentId || result?.deposit?.paymentId || "");
            const depositId = String(result?.deposit?.id || result?.payment?.depositId || "");
            this.lastDepositId = depositId;

            let mount = document.getElementById("settingsDepositPaymentMount");
            if (!mount) {
                mount = document.createElement("div");
                mount.id = "settingsDepositPaymentMount";
                const btn = document.getElementById("settingsCreateDepositBtn");
                btn?.insertAdjacentElement("afterend", mount);
            }

            mount.innerHTML = `
<div style="margin-top:14px;padding:14px;border-radius:18px;background:linear-gradient(145deg,rgba(25,34,62,.96),rgba(11,18,38,.96));border:1px solid rgba(255,255,255,.14);box-shadow:0 12px 34px rgba(0,0,0,.35);color:#fff;">
<div style="font-size:22px;font-weight:900;text-align:center;margin-bottom:12px;">Doładuj za pomocą TON</div>

<div style="padding:12px;border-radius:14px;background:rgba(255,255,255,.06);margin-bottom:10px;">
<div style="font-size:13px;opacity:.75;">Prześlij dokładnie:</div>
<div style="font-size:25px;font-weight:900;color:#ffd76a;">${payAmountTon} TON</div>
<button id="copyDepositAmountBtn" class="profile-close-btn" type="button" style="margin-top:10px;">Skopiuj Kwotę</button>
</div>

<div style="padding:12px;border-radius:14px;background:rgba(255,255,255,.06);margin-bottom:10px;">
<div style="font-size:13px;opacity:.75;">Portfel:</div>
<div style="font-size:14px;font-weight:800;word-break:break-all;">${payAddress}</div>
<button id="copyDepositWalletBtn" class="profile-close-btn" type="button" style="margin-top:10px;">Skopiuj Portfel</button>
</div>

<div style="padding:12px;border-radius:14px;background:rgba(42,194,255,.10);font-size:13px;color:#bfefff;">
Nagrody zostaną dodane automatycznie po zaksięgowaniu płatności.
</div>

<button id="checkDepositStatusBtn" class="profile-close-btn" type="button" style="margin-top:12px;">Sprawdź status</button>
</div>`;

            const copyText = async (text, msg) => {
                try {
                    await navigator.clipboard.writeText(String(text || ""));
                    CryptoZoo.ui?.showToast?.(msg);
                } catch (_) {}
            };

            document.getElementById("copyDepositAmountBtn")?.addEventListener("click", () => copyText(payAmountTon, "Kwota skopiowana"));
            document.getElementById("copyDepositWalletBtn")?.addEventListener("click", () => copyText(payAddress, "Portfel skopiowany"));
            document.getElementById("checkDepositStatusBtn")?.addEventListener("click", () => this.verifyLastDeposit?.());

            setTimeout(() => {
                this.verifyLastDeposit?.();
            }, 15000);

            return true;
        } catch (error) {
            console.error("CREATE DEPOSIT ERROR:", error);
            CryptoZoo.ui?.showToast?.(
                error?.message || "Nie udało się utworzyć płatności"
            );
            return false;
        } finally {
            this.setLoading(false);
        }
    },

    async verifyLastDeposit() {
        const depositId = String(this.lastDepositId || "").trim();

        if (!depositId) {
            return false;
        }

        try {
            const response = await fetch("/api/deposit/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ depositId })
            });

            const result = await response.json();

            if (result?.matched) {
                if (CryptoZoo.api?.loadPlayer) {
                    await CryptoZoo.api.loadPlayer();
                }
                if (CryptoZoo.ui?.render) {
                    CryptoZoo.ui.render();
                }
                if (CryptoZoo.uiSettings?.loadDepositsHistory) {
                    await CryptoZoo.uiSettings.loadDepositsHistory();
                }
                if (CryptoZoo.uiSettings?.refreshSettingsModalData) {
                    CryptoZoo.uiSettings.refreshSettingsModalData();
                }

                if (result?.alreadyProcessed) {
                    CryptoZoo.ui?.showToast?.("Depozyt już wcześniej rozliczony.");
                } else {
                    CryptoZoo.ui?.showToast?.("Depozyt potwierdzony. Nagrody dodane.");
                }

                return true;
            }

            CryptoZoo.ui?.showToast?.("Depozyt jeszcze niepotwierdzony.");
            return false;
        } catch (error) {
            console.error("VERIFY DEPOSIT ERROR:", error);
            CryptoZoo.ui?.showToast?.("Błąd sprawdzania depozytu");
            return false;
        }
    }
};
