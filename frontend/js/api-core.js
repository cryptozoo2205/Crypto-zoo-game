window.CryptoZoo = window.CryptoZoo || {};
window.CryptoZoo.api = window.CryptoZoo.api || {};

Object.assign(window.CryptoZoo.api, {
    getApiBase() {
        const fromConfig =
            window.CryptoZoo?.config?.apiBase ||
            window.CryptoZoo?.config?.API_BASE ||
            window.CryptoZoo?.config?.backendUrl ||
            window.CryptoZoo?.config?.serverUrl ||
            window.CRYPTOZOO_API_BASE ||
            "";

        const pageOrigin = String(window.location?.origin || "").replace(/\/+$/, "");
        const isLocalHost =
            /localhost|127\.0\.0\.1/i.test(pageOrigin) ||
            /^file:/i.test(String(window.location?.protocol || ""));

        if (fromConfig) {
            const cleaned = String(fromConfig).replace(/\/+$/, "");

            if (!isLocalHost && pageOrigin) {
                if (/^https?:\/\/[^/]+:\d+$/i.test(cleaned)) {
                    return `${pageOrigin}/api`;
                }

                if (/^https?:\/\/[^/]+$/i.test(cleaned)) {
                    return `${cleaned}/api`;
                }

                return cleaned;
            }

            return cleaned;
        }

        if (!isLocalHost && pageOrigin) {
            return `${pageOrigin}/api`;
        }

        return "/api";
    },

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    },

    wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    },

    isTransientNetworkError(error) {
        const message = String(error?.message || "").toLowerCase();

        return (
            message.includes("failed to fetch") ||
            message.includes("networkerror") ||
            message.includes("load failed") ||
            message.includes("the network connection was lost") ||
            message.includes("network request failed")
        );
    },

    async request(path, options = {}) {
        const retryCount = Math.max(0, Number(options.retryCount ?? 1));
        const retryDelayMs = Math.max(0, Number(options.retryDelayMs ?? 700));
        let lastError = null;

        for (let attempt = 0; attempt <= retryCount; attempt += 1) {
            const controller = new AbortController();
            const timeoutMs = Math.max(
                1000,
                Number(options.timeoutMs) || this.requestTimeoutMs || 8000
            );
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, timeoutMs);

            try {
                const config = {
                    method: options.method || "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(options.headers || {})
                    },
                    ...options,
                    signal: controller.signal
                };

                delete config.timeoutMs;
                delete config.retryCount;
                delete config.retryDelayMs;

                const response = await fetch(`${this.getApiBase()}${path}`, config);

                if (!response.ok) {
                    let errorText = "";

                    try {
                        errorText = await response.text();
                    } catch (_) {
                        errorText = "";
                    }

                    throw new Error(
                        `HTTP ${response.status}${errorText ? ` - ${errorText}` : ""}`
                    );
                }

                const contentType = response.headers.get("content-type") || "";

                if (contentType.includes("application/json")) {
                    return response.json();
                }

                return null;
            } catch (error) {
                if (error?.name === "AbortError") {
                    lastError = new Error(`Request timeout after ${timeoutMs}ms: ${path}`);
                } else {
                    lastError = error;
                }

                const canRetry =
                    attempt < retryCount && this.isTransientNetworkError(lastError);

                if (!canRetry) {
                    throw lastError;
                }

                console.warn(`Retrying request after transient error: ${path}`, lastError);
                await this.wait(retryDelayMs);
            } finally {
                clearTimeout(timeoutId);
            }
        }

        throw lastError || new Error(`Unknown request failure: ${path}`);
    }
});