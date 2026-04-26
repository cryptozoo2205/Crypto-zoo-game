window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.api = window.CryptoZoo.api || {
    testResetMode: false,

    localSaveKeyPrefix: "cryptozoo_save_v2_",
    legacyLocalSaveKey: "cryptozoo_save",

    testLocalSaveKeyPrefix: "cryptozoo_test_save_",
    legacyTestLocalSaveKey: "cryptozoo_test_save",

    initialized: false,
    initPromise: null,
    lifecycleBound: false,
    ensurePlayerPromise: null,

    saveInProgress: false,
    saveQueued: false,
    saveTimer: null,
    lastSaveStartedAt: 0,
    lastSavedSnapshot: "",
    pendingDirty: false,

    requestTimeoutMs: 8000,
    minSaveIntervalMs: 30000,
    saveDebounceMs: 4000,
    saveFailCooldownMs: 15000
};
CryptoZoo.api.createDepositWithTonPay = async function(amount){
    const r = await fetch(this.apiBase + '/tonpay/create', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            telegramId: CryptoZoo.telegramUser?.id || null,
            usdAmount: amount
        })
    });

    const data = await r.json();

    if (!data.ok) {
        throw new Error(data.error || 'tonpay_failed');
    }

    if (data.paymentUrl) {
        window.open(data.paymentUrl, '_blank');
    }

    return data;
};

