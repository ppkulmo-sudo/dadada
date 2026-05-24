function resolveAccountApiBase() {
    if (window.__API_BASE__ && window.__API_BASE__.length > 0) {
        return window.__API_BASE__.replace(/\/+$/, "");
    }

    const metaApiBase = document.querySelector('meta[name="api-base"]');
    if (metaApiBase && metaApiBase.content) {
        return metaApiBase.content.replace(/\/+$/, "");
    }

    if (window.location.protocol === "file:") {
        return "http://127.0.0.1:9000";
    }

    const host = window.location.hostname;
    if (host === "127.0.0.1" || host === "localhost") {
        return window.location.protocol + "//" + host + ":9000";
    }

    return window.location.protocol + "//api." + host;
}

function accountCurrentLang() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("lang") || "").toLowerCase() || "en";
}

function accountWithLang(path) {
    const lang = accountCurrentLang();
    if (!path || lang === "en") {
        return path;
    }

    const url = new URL(path, window.location.origin);
    if (url.origin !== window.location.origin) {
        return path;
    }
    url.searchParams.set("lang", lang);
    return url.pathname + url.search + url.hash;
}

function accountApiUrl(path) {
    const base = resolveAccountApiBase();
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    if (path.startsWith("/")) {
        return base + path;
    }
    return base + "/" + path.replace(/^\/+/, "");
}

async function accountRequest(path, options) {
    const config = Object.assign(
        {
            credentials: "include",
            headers: {}
        },
        options || {}
    );

    if (config.body && !(config.body instanceof FormData)) {
        config.headers["Content-Type"] = "application/json";
        config.body = JSON.stringify(config.body);
    }

    return fetch(accountApiUrl(path), config);
}

function updateAccountText(user) {
    document.querySelectorAll("[data-user-email]").forEach((node) => {
        node.textContent = user.email;
    });

    document.querySelectorAll("[data-user-created]").forEach((node) => {
        node.textContent = new Date(user.created_at).toLocaleString();
    });

    document.querySelectorAll("[data-user-status]").forEach((node) => {
        node.textContent = user.verification_status;
    });
}

function renderBalances(balances) {
    const tableBody = document.querySelector("[data-balance-table]");
    if (!tableBody) {
        return;
    }

    const entries = Object.entries(balances || {});
    if (entries.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="2" class="account-muted">No balances yet.</td></tr>';
        return;
    }

    tableBody.innerHTML = entries
        .map(([symbol, value]) => {
            return `<tr><td>${symbol}</td><td>${value.first}</td></tr>`;
        })
        .join("");
}

function applyPageSpecificState() {
    const page = document.body.dataset.accountPage;
    const currencyNode = document.querySelector("[data-current-currency]");
    const depositBanner = document.querySelector("[data-wallet-banner]");

    if (currencyNode) {
        const currency = new URLSearchParams(window.location.search).get("currency") || "BTC";
        currencyNode.textContent = currency.toUpperCase();
    }

    if (page === "wallet" && depositBanner) {
        const action = new URLSearchParams(window.location.search).get("action");
        if (action === "deposit") {
            depositBanner.hidden = false;
        }
    }
}

function patchAccountLinks() {
    document.querySelectorAll('a[href]').forEach((anchor) => {
        const href = anchor.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
            return;
        }
        anchor.setAttribute("href", accountWithLang(href));
    });
}

async function hydrateAccount() {
    try {
        const meResponse = await accountRequest("/api/user/me");
        if (!meResponse.ok) {
            window.location.replace(accountWithLang("/signin/"));
            return;
        }

        const me = await meResponse.json();
        if (!me.authenticated) {
            window.location.replace(accountWithLang("/signin/"));
            return;
        }

        updateAccountText(me);
        applyPageSpecificState();
        patchAccountLinks();

        const balancesResponse = await accountRequest("/api/user/balances");
        if (balancesResponse.ok) {
            const balances = await balancesResponse.json();
            renderBalances(balances);
        }

        const root = document.querySelector("[data-account-root]");
        if (root) {
            root.hidden = false;
        }

        const loading = document.querySelector("[data-account-loading]");
        if (loading) {
            loading.hidden = true;
        }
    } catch (error) {
        const loading = document.querySelector("[data-account-loading]");
        const errorPanel = document.querySelector("[data-account-error]");

        if (loading) {
            loading.hidden = true;
        }

        if (errorPanel) {
            errorPanel.hidden = false;
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const logoutButton = document.querySelector("[data-account-logout]");
    if (logoutButton) {
        logoutButton.addEventListener("click", async function() {
            await accountRequest("/api/auth/logout", { method: "POST", body: {} });
            window.location.replace(accountWithLang("/signin/"));
        });
    }

    patchAccountLinks();
    hydrateAccount();
});
