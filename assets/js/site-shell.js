(function () {
    var STORAGE_KEY = "wixi_auth_user";
    var state = {
        apiBase: "",
        locale: null,
        user: null,
        authResolved: false,
        supportedLangs: ["en", "tr", "de", "es", "it", "fr", "pt", "zh", "zh-sg", "ja"],
        guestMarkup: "",
        routePrefix: ""
    };

    function getCookie(name) {
        var parts = document.cookie ? document.cookie.split("; ") : [];
        for (var i = 0; i < parts.length; i += 1) {
            var part = parts[i];
            if (part.indexOf(name + "=") === 0) {
                return decodeURIComponent(part.substring(name.length + 1));
            }
        }
        return "";
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function resolveApiBase() {
        if (state.apiBase) {
            return state.apiBase;
        }

        if (window.__API_BASE__ && window.__API_BASE__.length > 0) {
            return window.__API_BASE__.replace(/\/+$/, "");
        }

        var metaApiBase = document.querySelector('meta[name="api-base"]');
        if (metaApiBase && metaApiBase.content) {
            return metaApiBase.content.replace(/\/+$/, "");
        }

        if (window.location.protocol === "file:") {
            return "http://127.0.0.1:9000";
        }

        var host = window.location.hostname;
        if (host === "127.0.0.1" || host === "localhost") {
            return window.location.origin;
        }

        return window.location.protocol + "//api." + host;
    }

    function resolveApiUrl(url) {
        if (!url) {
            return url;
        }

        if (/^https?:\/\//i.test(url) || url.indexOf("//") === 0) {
            return url;
        }

        if (url.indexOf("/api/") === 0) {
            return resolveApiBase() + url;
        }

        return url;
    }

    function normalizePrefix(prefix) {
        if (!prefix) {
            return "";
        }

        var normalized = String(prefix).trim();
        if (!normalized || normalized === "/") {
            return "";
        }

        normalized = normalized.replace(/\/+$/, "");
        if (normalized.charAt(0) !== "/") {
            normalized = "/" + normalized;
        }

        return normalized;
    }

    function currentPathWithoutPrefix() {
        var pathname = window.location.pathname || "/";
        if (state.routePrefix && pathname.indexOf(state.routePrefix) === 0) {
            pathname = pathname.substring(state.routePrefix.length) || "/";
        }
        if (pathname.charAt(0) !== "/") {
            pathname = "/" + pathname;
        }
        return pathname;
    }

    function isProfileRoute() {
        var pathname = currentPathWithoutPrefix();
        return pathname === "/profile" || pathname === "/profile/" || pathname.indexOf("/profile/") === 0;
    }

    function isAuthRoute() {
        var pathname = currentPathWithoutPrefix();
        return pathname === "/signin" || pathname === "/signin/" || pathname === "/signup" || pathname === "/signup/" || pathname === "/forgot-password" || pathname === "/forgot-password/";
    }

    function assetUrl(path) {
        if (!path) {
            return path;
        }

        if (/^https?:\/\//i.test(path) || path.indexOf("//") === 0 || path.indexOf("#") === 0 || path.indexOf("mailto:") === 0 || path.indexOf("tel:") === 0) {
            return path;
        }

        var cleanPath = String(path);
        if (cleanPath.charAt(0) !== "/") {
            cleanPath = "/" + cleanPath;
        }

        if (state.routePrefix && (cleanPath === state.routePrefix || cleanPath.indexOf(state.routePrefix + "/") === 0)) {
            return cleanPath;
        }

        if (cleanPath.indexOf("/assets/") === 0 || cleanPath.indexOf("/fonts/") === 0) {
            return (state.routePrefix || "") + cleanPath;
        }

        return cleanPath;
    }

    function isStaticAssetPath(pathname) {
        return pathname.indexOf("/assets/") === 0
            || pathname.indexOf("/fonts/") === 0
            || pathname.indexOf("/cdn-cgi/") === 0
            || pathname.indexOf("/api/") === 0
            || (state.routePrefix && (pathname.indexOf(state.routePrefix + "/assets/") === 0 || pathname.indexOf(state.routePrefix + "/fonts/") === 0));
    }

    function routeUrl(path) {
        if (!path) {
            return path;
        }

        if (path.charAt && path.charAt(0) === "?") {
            return (window.location.pathname || "/") + path;
        }

        if (/^https?:\/\//i.test(path) || path.indexOf("//") === 0 || path.indexOf("#") === 0 || path.indexOf("mailto:") === 0 || path.indexOf("tel:") === 0) {
            return path;
        }

        var cleanPath = String(path);
        if (cleanPath.indexOf("/assets/") === 0 || cleanPath.indexOf("/fonts/") === 0) {
            return assetUrl(cleanPath);
        }

        if (cleanPath.indexOf("/api/") === 0 || cleanPath.indexOf("/cdn-cgi/") === 0) {
            return cleanPath;
        }

        if (cleanPath.charAt(0) !== "/") {
            cleanPath = "/" + cleanPath;
        }

        if (state.routePrefix && (cleanPath === state.routePrefix || cleanPath.indexOf(state.routePrefix + "/") === 0)) {
            return cleanPath;
        }

        return (state.routePrefix || "") + cleanPath;
    }

    function readPersistedUser() {
        try {
            var raw = window.localStorage ? window.localStorage.getItem(STORAGE_KEY) : "";
            if (!raw) {
                return null;
            }

            var parsed = JSON.parse(raw);
            if (!parsed || parsed.authenticated !== true) {
                return null;
            }

            return parsed;
        } catch (error) {
            return null;
        }
    }

    function persistUser(user) {
        if (!user || user.authenticated !== true) {
            return;
        }

        var payload = {
            authenticated: true,
            id: user.id || null,
            email: user.email || "",
            verification_status: user.verification_status || "unverified",
            google_2fa_enabled: !!user.google_2fa_enabled,
            anti_phishing_enabled: !!user.anti_phishing_enabled,
            profile_photo_url: user.profile_photo_url || ""
        };

        try {
            if (window.localStorage) {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            }
        } catch (error) {
        }
    }

    function clearUser() {
        state.user = null;
        try {
            if (window.localStorage) {
                window.localStorage.removeItem(STORAGE_KEY);
            }
        } catch (error) {
        }
    }

    function getUserAvatarUrl(user) {
        return user && user.profile_photo_url ? user.profile_photo_url : "/assets/img/profile/avatar.svg";
    }

    function currentLang() {
        try {
            var url = new URL(window.location.href);
            var lang = (url.searchParams.get("lang") || getCookie("lang") || "en").toLowerCase();
            return state.supportedLangs.indexOf(lang) !== -1 ? lang : "en";
        } catch (error) {
            return "en";
        }
    }

    function withCurrentLang(rawUrl) {
        var lang = currentLang();
        if (!rawUrl || lang === "en") {
            return routeUrl(rawUrl);
        }

        try {
            var url = new URL(routeUrl(rawUrl), window.location.origin);
            var managedExternal = /(^|\.)nohex\.exchange$/i.test(url.hostname);
            if (url.origin !== window.location.origin && !managedExternal) {
                return rawUrl;
            }
            if (isStaticAssetPath(url.pathname)) {
                return rawUrl;
            }
            var explicitLang = (url.searchParams.get("lang") || "").toLowerCase();
            if (explicitLang && state.supportedLangs.indexOf(explicitLang) !== -1) {
                return url.pathname + url.search + url.hash;
            }
            url.searchParams.set("lang", lang);
            return url.pathname + url.search + url.hash;
        } catch (error) {
            return routeUrl(rawUrl);
        }
    }

    function redirectToSignin() {
        if (isAuthRoute()) {
            return;
        }
        window.location.replace(withCurrentLang("/signin"));
    }

    function enforceGuestProfileRedirect() {
        if (isProfileRoute() && state.authResolved !== true) {
            return false;
        }
        if (isProfileRoute() && (!state.user || state.user.authenticated !== true)) {
            redirectToSignin();
            return true;
        }
        return false;
    }

    function shouldTreatAsGuest() {
        if (state.user && state.user.authenticated === true) {
            return false;
        }
        if (isProfileRoute() && state.authResolved !== true) {
            return false;
        }
        return true;
    }

    function isProtectedProfileTarget(rawUrl) {
        if (!rawUrl) {
            return false;
        }

        try {
            var resolved = new URL(rawUrl, window.location.href);
            if (resolved.origin !== window.location.origin) {
                return false;
            }

            var pathname = resolved.pathname || "/";
            if (state.routePrefix && pathname.indexOf(state.routePrefix) === 0) {
                pathname = pathname.substring(state.routePrefix.length) || "/";
            }

            if (pathname.charAt(0) !== "/") {
                pathname = "/" + pathname;
            }

            return pathname === "/profile"
                || pathname === "/profile/"
                || pathname.indexOf("/profile/") === 0;
        } catch (error) {
            return false;
        }
    }

    function rewriteManagedAssets(root) {
        root.querySelectorAll("[src]").forEach(function (node) {
            var src = node.getAttribute("src");
            if (src && (src.indexOf("/assets/") === 0 || src.indexOf("/fonts/") === 0)) {
                node.setAttribute("src", assetUrl(src));
            }
        });

        root.querySelectorAll("[href]").forEach(function (node) {
            var href = node.getAttribute("href");
            if (href && (href.indexOf("/assets/") === 0 || href.indexOf("/fonts/") === 0)) {
                node.setAttribute("href", assetUrl(href));
            }
        });

        root.querySelectorAll("a").forEach(function (node) {
            var text = (node.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
            var onclick = node.getAttribute("onclick") || "";
            if (!text || text.indexOf("margin") !== 0) {
                return;
            }
            if (onclick.indexOf("verificationPopup") === -1) {
                return;
            }
            node.setAttribute("href", withCurrentLang("/profile/trading?mode=margin"));
            node.removeAttribute("onclick");
        });
    }

    function getText(key, fallback, replacers) {
        var value = fallback;

        if (state.locale && Object.prototype.hasOwnProperty.call(state.locale, key) && state.locale[key]) {
            value = state.locale[key];
        }

        if (replacers && replacers.length) {
            replacers.forEach(function (replacer, index) {
                value = String(value).replace("{" + index + "}", replacer);
            });
        }

        return value;
    }

    function verificationLabel(user) {
        var status = String(user && user.verification_status || "").toLowerCase();
        if (status === "pending") {
            return getText("settings.verification.pending", "Pending");
        }
        if (status === "verified") {
            return getText("settings.verification.verified", "Verified");
        }
        return getText("settings.verification.unverified", "Unverified");
    }

    function maskEmail(email) {
        var raw = String(email || "").trim();
        var parts = raw.split("@");
        if (parts.length !== 2) {
            return raw || "user";
        }

        var local = parts[0];
        var domain = parts[1];
        var maskedLocal = local.length <= 3 ? local.charAt(0) + "***" : local.slice(0, 3) + "***";
        var domainRoot = domain.split(".")[0] || "";
        var maskedDomain = domainRoot.length <= 1 ? "****" : domainRoot.charAt(0) + "****";
        return maskedLocal + "@" + maskedDomain;
    }

    function seedFromExistingShell() {
        if (state.user || readPersistedUser()) {
            return;
        }

        var titleNode = document.querySelector(".profile-user-title");
        if (!titleNode) {
            return;
        }

        var uidNode = document.querySelector(".profile-uid");
        var verificationNode = document.querySelector(".profile-user-feature-unverified, .profile-user-feature-verified");

        persistUser({
            authenticated: true,
            id: uidNode ? uidNode.textContent.replace(/[^\d]/g, "") : null,
            email: (titleNode.textContent || "").trim(),
            verification_status: verificationNode && /verified/i.test(verificationNode.textContent || "") ? "verified" : "unverified",
            google_2fa_enabled: false,
            anti_phishing_enabled: false
        });
    }

    function ensureAuthorizedInput(isAuthorized) {
        var input = document.getElementById("user-authorized");
        if (!input) {
            input = document.createElement("input");
            input.type = "hidden";
            input.hidden = true;
            input.id = "user-authorized";
            document.body.appendChild(input);
        }
        input.value = isAuthorized ? "true" : "false";
    }

    function isProfileRoute() {
        return currentPathWithoutPrefix().indexOf("/profile/") === 0;
    }

    function dispatchUserEvent(user) {
        try {
            window.dispatchEvent(new CustomEvent("wixi:user", {
                detail: {
                    user: user && user.authenticated ? user : null
                }
            }));
        } catch (_error) {
        }
    }

    function dispatchBalancesEvent(balances) {
        try {
            window.dispatchEvent(new CustomEvent("wixi:balances", {
                detail: {
                    balances: balances || {}
                }
            }));
        } catch (_error) {
        }
    }

    function shellMarkup(user) {
        var safeUid = escapeHtml(user && user.id ? String(user.id) : "");
        var safeEmail = escapeHtml(maskEmail(user && user.email));
        var safeVerification = escapeHtml(verificationLabel(user));
        var avatarUrl = escapeHtml(getUserAvatarUrl(user));

        return `
            <div class="main-menu main-menu__menu-controls unified-auth-shell">
                <button type="button" class="main-menu__menu-controls_top-up v-btn v-btn--is-elevated v-btn--has-bg theme--light v-size--default main-menu__deposit-btn unified-auth-deposit">
                    <span class="v-btn__content">
                        <svg fill="none" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg" class="top-up-icon">
                            <path d="M15.75 5.75L7.75 13.75M7.75 13.75V7.75M7.75 13.75H13.75M4.75 19.25H19.25" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                        ${escapeHtml(getText("profile.deposit.btn", "Deposit"))}
                    </span>
                </button>
                <div class="main-menu__section main-menu unified-shell-menu">
                    <button type="button" class="main-menu__section__nav-button v-btn v-btn--is-elevated v-btn--has-bg theme--light v-size--default unified-shell-toggle">
                        <span class="v-btn__content">
                            <img src="/assets/img/profile/wallet.svg" alt="wallet" style="width:18px;height:18px;margin-right:8px;display:inline-block;vertical-align:middle;">
                            ${escapeHtml(getText("profile.assets", "Assets"))}
                            <i aria-hidden="true" class="v-icon notranslate main-menu__section__nav-button__icon mdi mdi-chevron-down theme--light"></i>
                        </span>
                    </button>
                    <div class="main-menu__section__menu main-menu__section__block unified-shell-dropdown" style="display: none; padding: 0;">
                        <div class="assets-overview">
                            <h3>
                                ${escapeHtml(getText("profile.assets", "Assets"))}
                                <img class="assets-hide-show" src="/assets/img/profile/hide.svg" alt="hide" style="cursor: pointer;" onclick="onAssetsHideShow(event)">
                            </h3>
                            <div class="assets-overview-balance unified-shell-wallet-link">
                                <div class="balance">
                                    <span id="usd-balance" usd-balance="0" style="font-size: 24px; color: #fff;">0 USD</span>
                                    <span id="btc-balance" btc-balance="0">≈ 0 BTC</span>
                                </div>
                                <p>${escapeHtml(getText("header.profile.data.delayed", "*Data may be delayed."))}</p>
                                <div class="buttons">
                                    <a href="${escapeHtml(withCurrentLang("/profile/wallet/?action=deposit"))}" onclick="event.stopPropagation()">
                                        <img src="/assets/img/profile/deposit.svg" alt="deposit">
                                        ${escapeHtml(getText("profile.deposit.btn", "Deposit"))}
                                    </a>
                                    <a href="${escapeHtml(withCurrentLang("/profile/wallet/?action=withdraw"))}" onclick="event.stopPropagation()">
                                        <img src="/assets/img/profile/withdraw.svg" alt="withdraw">
                                        ${escapeHtml(getText("transactions.type.withdraw", "Withdraw"))}
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="assets-balances">
                            <a class="assets-item">
                                <div class="assets-item-columns">
                                    <span class="assets-item-label">${escapeHtml(getText("header.trading.spot.title", "Spot"))}</span>
                                    <span id="spot-balance-percent" class="assets-item-val">0.0%</span>
                                </div>
                                <span id="spot-balance" class="assets-item-label-end">$0.00</span>
                            </a>
                            <a class="assets-item" data-assets-bucket="trading">
                                <div class="assets-item-columns">
                                    <span class="assets-item-label">Trading</span>
                                    <span id="margin-balance-percent" class="assets-item-val">0.0%</span>
                                </div>
                                <span id="margin-balance" class="assets-item-label-end">$0.00</span>
                            </a>
                            <a class="assets-item" data-assets-bucket="futures">
                                <div class="assets-item-columns">
                                    <span class="assets-item-label">${escapeHtml(getText("header.futures.title", "Futures"))}</span>
                                    <span id="futures-balance-percent" class="assets-item-val">0.0%</span>
                                </div>
                                <span id="futures-balance" class="assets-item-label-end">$0.00</span>
                            </a>
                            <a class="assets-item" style="margin-bottom: 10px">
                                <div class="assets-item-columns">
                                    <span class="assets-item-label">${escapeHtml(getText("header.earn.title", "Earn"))}</span>
                                    <span id="earn-balance-percent" class="assets-item-val">0.0%</span>
                                </div>
                                <span id="earn-balance" class="assets-item-label-end">$0.00</span>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="main-menu__section main-menu unified-shell-menu">
                    <button type="button" class="main-menu__section__nav-button v-btn v-btn--is-elevated v-btn--has-bg theme--light v-size--default unified-shell-toggle">
                        <span class="v-btn__content">
                            ${escapeHtml(getText("profile.history.btn", "History"))}
                            <i aria-hidden="true" class="v-icon notranslate main-menu__section__nav-button__icon mdi mdi-chevron-down theme--light"></i>
                        </span>
                    </button>
                    <div class="main-menu__section__menu main-menu__section__block unified-shell-dropdown" style="display: none; width: 260px; padding: 0;">
                        <a class="profile-item" href="${escapeHtml(withCurrentLang("/profile/history?type=all"))}">
                            ${escapeHtml(getText("header.history.all", "All transactions"))}
                            <img src="/assets/img/profile/arrow-right.svg" alt="arrow">
                        </a>
                        <a class="profile-item" href="${escapeHtml(withCurrentLang("/profile/history?type=deposit"))}">
                            ${escapeHtml(getText("header.history.deposit", "Deposits"))}
                            <img src="/assets/img/profile/arrow-right.svg" alt="arrow">
                        </a>
                        <a class="profile-item" href="${escapeHtml(withCurrentLang("/profile/history?type=withdraw"))}">
                            ${escapeHtml(getText("header.history.withdraw", "Withdrawals"))}
                            <img src="/assets/img/profile/arrow-right.svg" alt="arrow">
                        </a>
                        <a class="profile-item" href="${escapeHtml(withCurrentLang("/profile/history?type=transfer"))}">
                            ${escapeHtml(getText("header.history.transfer", "Transfers"))}
                            <img src="/assets/img/profile/arrow-right.svg" alt="arrow">
                        </a>
                        <a class="profile-item" href="${escapeHtml(withCurrentLang("/profile/history?type=earning"))}">
                            ${escapeHtml(getText("header.history.earning", "Earnings"))}
                            <img src="/assets/img/profile/arrow-right.svg" alt="arrow">
                        </a>
                    </div>
                </div>
                <div class="main-menu__section main-menu__section__profile unified-shell-profile">
                    <img style="cursor: pointer; border-radius: 50%;" src="${avatarUrl}" alt="avatar" width="36px" height="36px" class="unified-shell-avatar">
                    <div class="main-menu__section__menu profile-menu main-menu__section__block unified-shell-dropdown" style="display: none; padding: 0px;">
                        <div class="profile-overview mobile-menu__verification verification-full-screen verification-warning unified-shell-wallet-link">
                            <div class="profile-user-header">
                                <img src="${avatarUrl}" alt="avatar" width="42px" height="42px" style="border-radius: 50%;">
                                <div class="profile-user-info">
                                    <div class="profile-user-title">${safeEmail}</div>
                                    <div class="profile-uid">UID ${safeUid}</div>
                                </div>
                            </div>
                            <div class="profile-user-features">
                                <div class="profile-user-feature profile-user-feature-not-vip">VIP</div>
                                <div class="profile-user-feature profile-user-feature-unverified">${safeVerification}</div>
                            </div>
                        </div>
                        <div style="border-top: 1px solid #404347;">
                            <a class="profile-item" href="${escapeHtml(withCurrentLang("/profile/wallet/"))}">
                                ${escapeHtml(getText("header.profile.wallet", "Wallet"))}
                                <img src="/assets/img/profile/arrow-right.svg" alt="arrow">
                            </a>
                            <a class="profile-item" href="${escapeHtml(withCurrentLang("/profile/settings"))}">
                                ${escapeHtml(getText("settings.menu.account.settings", "Settings"))}
                                <img src="/assets/img/profile/arrow-right.svg" alt="arrow">
                            </a>
                            <a class="profile-item" href="${escapeHtml(withCurrentLang("/profile/security"))}">
                                ${escapeHtml(getText("header.profile.security", "Security"))}
                                <img src="/assets/img/profile/arrow-right.svg" alt="arrow">
                            </a>
                            <a class="profile-item" href="${escapeHtml(withCurrentLang("/profile/verification"))}">
                                ${escapeHtml(getText("header.profile.identity.verification", "Identity Verification"))}
                                <img src="/assets/img/profile/arrow-right.svg" alt="arrow">
                            </a>
                            <a class="profile-item" href="${escapeHtml(withCurrentLang("/profile/promo"))}">
                                ${escapeHtml(getText("promocodes.title", "Promo codes"))}
                                <img src="/assets/img/profile/arrow-right.svg" alt="arrow">
                            </a>
                            <a class="profile-item" href="${escapeHtml(withCurrentLang("/profile/referral"))}">
                                ${escapeHtml(getText("header.profile.referral", "Referral program"))}
                                <img src="/assets/img/profile/arrow-right.svg" alt="arrow">
                            </a>
                            <a class="profile-item" href="${escapeHtml(withCurrentLang("/profile/api"))}">
                                ${escapeHtml(getText("api.management.title", "API Management"))}
                                <img src="/assets/img/profile/arrow-right.svg" alt="arrow">
                            </a>
                            <div id="mobile-app-btn" class="profile-item">
                                ${escapeHtml(getText("header.profile.mobile.app", "Mobile app"))}
                                <img src="/assets/img/profile/arrow-right.svg" alt="arrow">
                            </div>
                            <div style="border-top: 1px solid #404347;"></div>
                            <div class="profile-item-logout unified-shell-logout">${escapeHtml(getText("header.logout", "Log out"))}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function enforceAssetsLabels(root) {
        (root || document).querySelectorAll("*").forEach(function (node) {
            if (node.children.length > 0) {
                return;
            }
            if ((node.textContent || "").trim() !== "Balances") {
                return;
            }
            node.textContent = "Assets";
            var parent = node.parentElement;
            if (parent && parent.classList.contains("v-btn__content") && !parent.querySelector('img[src*="/assets/img/profile/wallet.svg"]')) {
                parent.insertAdjacentHTML("afterbegin", '<img src="/assets/img/profile/wallet.svg" alt="wallet" style="width:18px;height:18px;margin-right:8px;display:inline-block;vertical-align:middle;">');
            }
        });
    }

    var assetsLabelObserverStarted = false;

    function ensureAssetsLabelObserver() {
        if (assetsLabelObserverStarted || !document.body || typeof MutationObserver === "undefined") {
            return;
        }
        assetsLabelObserverStarted = true;
        var observer = new MutationObserver(function () {
            enforceAssetsLabels(document);
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    function guestMarkup() {
        return `
            <a href="${escapeHtml(withCurrentLang("/signin"))}" class="main-header__nav-button login-btn v-btn v-btn--is-elevated v-btn--has-bg v-btn--router theme--light v-size--default">
                <span class="v-btn__content">${escapeHtml(getText("header.login", "Log In"))}</span>
            </a>
            <a href="${escapeHtml(withCurrentLang("/signup"))}" style="display: flex;" class="main-header__nav-button-primary v-btn v-btn--is-elevated v-btn--has-bg v-btn--router theme--light v-size--default">
                <span class="v-btn__content">${escapeHtml(getText("header.signup", "Sign Up"))}</span>
            </a>
        `;
    }

    function closeMenus() {
        document.querySelectorAll(".unified-auth-shell .unified-shell-dropdown").forEach(function (menu) {
            menu.style.display = "none";
        });
        document.querySelectorAll(".unified-auth-shell .main-menu__section__nav-button").forEach(function (button) {
            button.classList.remove("active");
        });
    }

    function toggleMenu(section) {
        var button = section.querySelector(".main-menu__section__nav-button");
        var menu = section.querySelector(".unified-shell-dropdown");
        if (!menu) {
            return;
        }

        var isOpen = menu.style.display && menu.style.display !== "none";
        closeMenus();
        if (!isOpen) {
            if (button) {
                button.classList.add("active");
            }
            menu.style.display = "block";
        }
    }

    function wireShell() {
        var shell = document.querySelector(".unified-auth-shell");
        if (!shell || shell.dataset.bound === "1") {
            return;
        }
        shell.dataset.bound = "1";

        var deposit = shell.querySelector(".unified-auth-deposit");
        if (deposit) {
            deposit.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                window.location.assign(withCurrentLang("/profile/wallet/?action=deposit"));
            });
        }

        shell.querySelectorAll(".unified-shell-menu").forEach(function (section) {
            var button = section.querySelector(".unified-shell-toggle");
            if (!button) {
                return;
            }

            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                toggleMenu(section);
            });

            section.addEventListener("mouseenter", function () {
                if (window.innerWidth >= 1400) {
                    toggleMenu(section);
                }
            });

            section.addEventListener("mouseleave", function () {
                if (window.innerWidth >= 1400) {
                    closeMenus();
                }
            });
        });

        var profileSection = shell.querySelector(".unified-shell-profile");
        if (profileSection) {
            var avatar = profileSection.querySelector(".unified-shell-avatar");
            var walletLinks = profileSection.querySelectorAll(".unified-shell-wallet-link");
            var logout = profileSection.querySelector(".unified-shell-logout");

            if (avatar) {
                avatar.addEventListener("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleMenu(profileSection);
                });
            }

            walletLinks.forEach(function (node) {
                node.addEventListener("click", function (event) {
                    event.preventDefault();
                    window.location.assign(withCurrentLang("/profile/wallet/"));
                });
            });

            if (logout) {
                logout.addEventListener("click", function (event) {
                    event.preventDefault();
                    clearUser();
                    fetch(resolveApiUrl("/api/auth/logout"), {
                        method: "GET",
                        credentials: "include"
                    }).finally(function () {
                        window.location.replace(withCurrentLang("/"));
                    });
                });
            }

            profileSection.addEventListener("mouseenter", function () {
                if (window.innerWidth >= 1400) {
                    toggleMenu(profileSection);
                }
            });

            profileSection.addEventListener("mouseleave", function () {
                if (window.innerWidth >= 1400) {
                    closeMenus();
                }
            });
        }
    }

    function syncProfilePageUserData() {
        if (!state.user || state.user.authenticated !== true) {
            return;
        }

        var avatarUrl = getUserAvatarUrl(state.user);
        document.querySelectorAll('img[alt="avatar"], img[src*="avatar.svg"], img[src*="/api/user/profile-photo"]').forEach(function (node) {
            node.setAttribute("src", avatarUrl);
        });

        document.querySelectorAll(".settings-account-info-email").forEach(function (node) {
            node.textContent = state.user.email || "";
        });

        document.querySelectorAll(".settings-account-info-uid").forEach(function (node) {
            node.textContent = "UID " + (state.user.id || "");
        });
    }

    function tightenMobileHeaderGap(headerContent) {
        if (!headerContent) {
            return;
        }

        var profileSection = headerContent.querySelector(".unified-shell-profile");
        var langMenu = headerContent.querySelector(".lang-button");
        var mobileButton = headerContent.querySelector(".mobile-menu-button");

        if (window.innerWidth > 768) {
            if (profileSection) {
                profileSection.style.removeProperty("margin-right");
                profileSection.style.removeProperty("padding-right");
            }
            if (langMenu) {
                langMenu.style.removeProperty("margin-left");
                langMenu.style.removeProperty("margin-right");
            }
            if (mobileButton) {
                mobileButton.style.removeProperty("margin-left");
            }
            return;
        }

        if (profileSection) {
            profileSection.style.setProperty("margin-right", "0", "important");
            profileSection.style.setProperty("padding-right", "0", "important");
        }

        if (langMenu) {
            langMenu.style.setProperty("margin-left", "-8px", "important");
            langMenu.style.setProperty("margin-right", "0", "important");
        }

        if (mobileButton) {
            mobileButton.style.setProperty("margin-left", "0", "important");
        }
    }

    function renderShell() {
        if (!state.user || state.user.authenticated !== true) {
            return;
        }

        var headerContent = document.querySelector(".main-header .v-toolbar__content");
        if (!headerContent) {
            return;
        }

        var existing = headerContent.querySelector(".main-menu__menu-controls");
        if (existing) {
            existing.outerHTML = shellMarkup(state.user);
        } else {
            headerContent.querySelectorAll(".login-btn, .main-header__nav-button-primary").forEach(function (node) {
                node.remove();
            });

            var langButton = headerContent.querySelector(".lang-button");
            var insertBeforeNode = langButton ? langButton.closest(".main-menu") : headerContent.querySelector(".mobile-menu-button");
            if (insertBeforeNode) {
                insertBeforeNode.insertAdjacentHTML("beforebegin", shellMarkup(state.user));
            } else {
                headerContent.insertAdjacentHTML("beforeend", shellMarkup(state.user));
            }
        }

        rewriteManagedAssets(headerContent);
        enforceAssetsLabels(headerContent);
        ensureAssetsLabelObserver();
        wireShell();
        tightenMobileHeaderGap(headerContent);
        syncProfilePageUserData();
        updateBalances();
        applyCurrentLangToLinks();
    }

    function renderGuestShell() {
        if (window.location.pathname.indexOf("/profile/") === 0) {
            return;
        }

        var headerContent = document.querySelector(".main-header .v-toolbar__content");
        if (!headerContent) {
            return;
        }

        var authShell = headerContent.querySelector(".main-menu__menu-controls");
        if (authShell) {
            authShell.remove();
        }

        headerContent.querySelectorAll(".login-btn, .main-header__nav-button-primary").forEach(function (node) {
            node.remove();
        });

        var langButton = headerContent.querySelector(".lang-button");
        var insertBeforeNode = langButton ? langButton.closest(".main-menu") : headerContent.querySelector(".mobile-menu-button");
        var markup = state.guestMarkup || guestMarkup();

        if (insertBeforeNode) {
            insertBeforeNode.insertAdjacentHTML("beforebegin", markup);
        } else {
            headerContent.insertAdjacentHTML("beforeend", markup);
        }

        rewriteManagedAssets(headerContent);
        enforceAssetsLabels(headerContent);
        ensureAssetsLabelObserver();
        tightenMobileHeaderGap(headerContent);
        applyCurrentLangToLinks();
    }

    function updateBalances() {
        if (!state.user || state.user.authenticated !== true) {
            return;
        }

        var cachedSummary = typeof window.getCachedAssetsSummary === "function"
            ? window.getCachedAssetsSummary(60000)
            : null;

        Promise.all([
            fetch(resolveApiUrl("/api/user/balances"), {
                credentials: "include"
            }).then(function (response) {
                if (!response.ok) {
                    throw new Error("balances");
                }
                return response.json();
            }),
            fetch(resolveApiUrl("/api/user/trading"), {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: "GET_FUTURES_BALANCE",
                    quote_coin: "USDT"
                })
            }).then(function (response) {
                if (!response.ok) {
                    return { available_margin: "0", futures_equity: "0", positions_margin: "0" };
                }
                return response.json().catch(function () {
                    return { available_margin: "0", futures_equity: "0", positions_margin: "0" };
                });
            }).catch(function () {
                return { available_margin: "0", futures_equity: "0", positions_margin: "0" };
            }),
            Promise.resolve(cachedSummary)
        ]).then(function (results) {
            var balances = results[0] || {};
            var marginData = results[1] || {};
            var summary = results[2] || null;

            var totalUsd = summary ? parseFloat(summary.total_usd || "0") : 0;
            var earnUsd = summary ? parseFloat(summary.earn_usd || "0") : 0;
            var totalUsdText = Number.isFinite(totalUsd) ? totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
            var btcText = summary && summary.btc_approx ? String(summary.btc_approx) : "0.00000000";

            var usdNode = document.getElementById("usd-balance");
            var btcNode = document.getElementById("btc-balance");
            var spotNode = document.getElementById("spot-balance");
            var marginNode = document.getElementById("margin-balance");
            var futuresNode = document.getElementById("futures-balance");
            var earnNode = document.getElementById("earn-balance");
            var formatPercent = function (value) {
                return value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
            };
            var formatUsd = function (value) {
                return "$" + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };
            var updateDropdownRow = function (amountNode, percentNode, amountText, percentText, labelNode, labelText) {
                if (percentNode) {
                    percentNode.textContent = percentText;
                }
                if (amountNode) {
                    amountNode.setAttribute("data-visible-text", amountText);
                    amountNode.textContent = amountText;
                }
                if (labelNode && labelText) {
                    labelNode.textContent = labelText;
                }
            };
            var positionsMarginUsd = parseFloat((marginData && marginData.positions_margin) || "0");
            var tradingUsd = summary ? parseFloat(summary.trading_usd || "0") : (Number.isFinite(positionsMarginUsd) ? Math.max(positionsMarginUsd, 0) : 0);
            var futuresUsd = summary ? parseFloat(summary.futures_usd || "0") : 0;
            var spotUsd = summary ? parseFloat(summary.spot_usd || "0") : Math.max(totalUsd - earnUsd - tradingUsd, 0);
            var spotPercent = summary ? parseFloat(summary.spot_percent || "0") : 0;
            var tradingPercent = summary ? parseFloat(summary.trading_percent || "0") : 0;
            var futuresPercent = summary ? parseFloat(summary.futures_percent || "0") : 0;
            var earnPercent = summary ? parseFloat(summary.earn_percent || "0") : 0;
            var spotUsdText = formatUsd(Number.isFinite(spotUsd) ? spotUsd : 0);
            var tradingUsdText = formatUsd(Number.isFinite(tradingUsd) ? tradingUsd : 0);
            var futuresUsdText = formatUsd(Number.isFinite(futuresUsd) ? futuresUsd : 0);
            var earnUsdText = formatUsd(Number.isFinite(earnUsd) ? earnUsd : 0);

            if (usdNode) {
                usdNode.setAttribute("usd-balance", totalUsdText);
                usdNode.textContent = totalUsdText + " USD";
            }
            if (btcNode) {
                btcNode.setAttribute("btc-balance", btcText);
                btcNode.textContent = "≈ " + btcText + " BTC";
            }
            if (spotNode) {
                spotNode.setAttribute("data-visible-text", spotUsdText);
                spotNode.textContent = spotUsdText;
            }
            if (marginNode) {
                marginNode.setAttribute("data-visible-text", tradingUsdText);
                marginNode.textContent = tradingUsdText;
            }
            if (futuresNode) {
                futuresNode.setAttribute("data-visible-text", futuresUsdText);
                futuresNode.textContent = futuresUsdText;
            }
            if (earnNode) {
                earnNode.setAttribute("data-visible-text", earnUsdText);
                earnNode.textContent = earnUsdText;
            }
            updateDropdownRow(
                document.getElementById("spot-balance"),
                document.getElementById("spot-balance-percent"),
                spotUsdText,
                formatPercent(spotPercent)
            );
            updateDropdownRow(
                document.getElementById("margin-balance"),
                document.getElementById("margin-balance-percent"),
                tradingUsdText,
                formatPercent(tradingPercent),
                document.querySelector("[data-assets-bucket='trading'] .assets-item-label"),
                "Trading"
            );
            updateDropdownRow(
                document.getElementById("futures-balance"),
                document.getElementById("futures-balance-percent"),
                futuresUsdText,
                formatPercent(futuresPercent)
            );
            updateDropdownRow(
                document.getElementById("earn-balance"),
                document.getElementById("earn-balance-percent"),
                earnUsdText,
                formatPercent(earnPercent)
            );
            if (typeof window.applyBalanceVisibilityState === "function") {
                window.applyBalanceVisibilityState();
            }
            dispatchBalancesEvent(balances);
            if (!summary && typeof window.refreshGlobalAssetsSummaryFromApi === "function") {
                window.refreshGlobalAssetsSummaryFromApi();
            }
        }).catch(function () {
        });
    }

    function patchWindowOpen() {
        if (window.__wixiOpenPatched) {
            return;
        }
        window.__wixiOpenPatched = true;
        var originalOpen = window.open;
        window.open = function (url) {
            if (typeof url === "string") {
                if (shouldTreatAsGuest() && isProtectedProfileTarget(url)) {
                    arguments[0] = withCurrentLang("/signin");
                    return originalOpen.apply(window, arguments);
                }
                arguments[0] = withCurrentLang(url);
            }
            return originalOpen.apply(window, arguments);
        };
    }

    function interceptGuestProtectedClicks() {
        if (window.__wixiGuestProtectedClicksBound) {
            return;
        }
        window.__wixiGuestProtectedClicksBound = true;

        document.addEventListener("click", function (event) {
            if (!shouldTreatAsGuest()) {
                return;
            }

            var target = event.target && event.target.closest ? event.target.closest("a[href], [onclick]") : null;
            if (!target) {
                return;
            }

            var href = target.getAttribute("href");
            var onclick = target.getAttribute("onclick") || "";
            var protectedTarget = isProtectedProfileTarget(href);

            if (!protectedTarget && onclick) {
                var matches = onclick.match(/(?:location\.(?:assign|replace)|window\.open)\((['"])(.*?)\1/g) || [];
                for (var i = 0; i < matches.length; i += 1) {
                    var urlMatch = matches[i].match(/(['"])(.*?)\1/);
                    if (urlMatch && isProtectedProfileTarget(urlMatch[2])) {
                        protectedTarget = true;
                        break;
                    }
                }
            }

            if (!protectedTarget) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === "function") {
                event.stopImmediatePropagation();
            }
            redirectToSignin();
        }, true);
    }

    function interceptMarginTradingClicks() {
        if (window.__wixiMarginClicksBound) {
            return;
        }
        window.__wixiMarginClicksBound = true;

        document.addEventListener("click", function (event) {
            var target = event.target && event.target.closest ? event.target.closest("a[href], [onclick]") : null;
            if (!target) {
                return;
            }

            var text = (target.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
            var onclick = target.getAttribute("onclick") || "";
            var href = target.getAttribute("href") || "";
            if (!text || text.indexOf("margin") !== 0) {
                return;
            }
            if (onclick.indexOf("verificationPopup") === -1 && href.indexOf("/profile/trading#") === -1 && href !== "#") {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === "function") {
                event.stopImmediatePropagation();
            }

            if (shouldTreatAsGuest()) {
                redirectToSignin();
                return;
            }

            window.location.assign(withCurrentLang("/profile/trading?mode=margin"));
        }, true);
    }

    function patchOnclickAttributes() {
        document.querySelectorAll("[onclick]").forEach(function (node) {
            var onclick = node.getAttribute("onclick");
            if (!onclick) {
                return;
            }

            var updated = onclick.replace(/(['"])([^'"]+)\1/g, function (_match, quote, url) {
                var isUrlLike = /^(\.\.?\/|\/)/.test(url) || url.indexOf("?") !== -1 || url.indexOf("#") !== -1 || url.indexOf(".html") !== -1;
                if (!url || !isUrlLike || /^https?:\/\//i.test(url) || url.indexOf("//") === 0 || url.indexOf("mailto:") === 0 || url.indexOf("tel:") === 0 || url.indexOf("#") === 0 || url.indexOf("javascript:") === 0) {
                    return quote + url + quote;
                }
                try {
                    var resolved = new URL(url, window.location.href);
                    var relativePath = resolved.pathname + resolved.search + resolved.hash;
                    if (shouldTreatAsGuest() && isProtectedProfileTarget(relativePath)) {
                        return quote + withCurrentLang("/signin") + quote;
                    }
                    return quote + withCurrentLang(relativePath) + quote;
                } catch (error) {
                    return quote + url + quote;
                }
            });

            if (updated !== onclick) {
                node.setAttribute("onclick", updated);
            }
        });
    }

    function rewriteGuestProtectedTargets() {
        if (!shouldTreatAsGuest()) {
            return;
        }

        document.querySelectorAll("a[href]").forEach(function (anchor) {
            var href = anchor.getAttribute("href");
            if (!href) {
                return;
            }

            if (isProtectedProfileTarget(href)) {
                anchor.setAttribute("href", withCurrentLang("/signin"));
                if (anchor.getAttribute("target") === "_blank") {
                    anchor.removeAttribute("target");
                    anchor.removeAttribute("rel");
                }
            }
        });
    }

    function applyCurrentLangToLinks() {
        document.querySelectorAll("a[href]").forEach(function (anchor) {
            var href = anchor.getAttribute("href");
            if (!href || href.indexOf("#") === 0 || href.indexOf("javascript:") === 0 || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) {
                return;
            }
            anchor.setAttribute("href", withCurrentLang(href));
        });
        rewriteGuestProtectedTargets();
        rewriteManagedAssets(document);
    }

    function ensureAccessPopupStyles() {
        if (document.getElementById("wixi-access-popup-styles")) {
            return;
        }
        var style = document.createElement("style");
        style.id = "wixi-access-popup-styles";
        style.textContent = [
            ".wixi-access-popup{position:fixed;inset:0;background:rgba(16,18,24,.55);z-index:999999;display:flex;align-items:center;justify-content:center;padding:18px;}",
            ".wixi-access-popup__dialog{width:min(500px,100%);border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 30px 80px rgba(0,0,0,.28);position:relative;}",
            ".wixi-access-popup__hero{height:255px;background:radial-gradient(circle at 50% 12%,rgba(255,120,120,.55),rgba(13,14,22,1) 62%);display:flex;align-items:center;justify-content:center;position:relative;}",
            ".wixi-access-popup__close{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.9);color:#222;font-size:24px;cursor:pointer;}",
            ".wixi-access-popup__art{width:200px;height:200px;object-fit:contain;filter:drop-shadow(0 18px 24px rgba(0,0,0,.28));}",
            ".wixi-access-popup__body{padding:22px 32px 28px;text-align:center;font-family:Montserrat,Inter,Segoe UI,Arial,sans-serif;}",
            ".wixi-access-popup__title{margin:0 0 14px;font-size:28px;line-height:1.1;color:#161b22;font-weight:700;font-family:Montserrat,Inter,Segoe UI,Arial,sans-serif;letter-spacing:-0.02em;}",
            ".wixi-access-popup__underline{display:block;width:148px;height:4px;border-radius:999px;margin:0 auto 18px;background:linear-gradient(90deg,#ef4444,#f59e0b);}",
            ".wixi-access-popup__text{margin:0 auto 26px;max-width:420px;color:#6b7280;font-size:15px;line-height:1.55;font-family:Montserrat,Inter,Segoe UI,Arial,sans-serif;font-weight:500;}",
            ".wixi-access-popup__action{width:100%;height:46px;border:0;border-radius:12px;background:#f7a600;color:#111827;font-size:16px;font-weight:600;cursor:pointer;font-family:Montserrat,Inter,Segoe UI,Arial,sans-serif;}",
            "@media (max-width:640px){.wixi-access-popup__hero{height:220px}.wixi-access-popup__body{padding:18px 24px 24px}.wixi-access-popup__title{font-size:22px}}"
        ].join("");
        document.head.appendChild(style);
    }

    function closeAccessPopup() {
        var popup = document.getElementById("wixi-access-popup");
        if (popup) {
            popup.remove();
        }
    }

    function showAccessPopup(options) {
        ensureAccessPopupStyles();
        closeAccessPopup();
        var popup = document.createElement("div");
        popup.id = "wixi-access-popup";
        popup.className = "wixi-access-popup";
        popup.innerHTML = '' +
            '<div class="wixi-access-popup__dialog">' +
                '<div class="wixi-access-popup__hero">' +
                    '<button type="button" class="wixi-access-popup__close" aria-label="Close">×</button>' +
                    '<img class="wixi-access-popup__art" src="' + assetUrl('/clean/assets/img/cardReject.svg') + '" alt="error">' +
                '</div>' +
                '<div class="wixi-access-popup__body">' +
                    '<h2 class="wixi-access-popup__title">' + escapeHtml(options.title || 'Error Occurred') + '</h2>' +
                    '<span class="wixi-access-popup__underline"></span>' +
                    '<p class="wixi-access-popup__text">' + escapeHtml(options.text || '') + '</p>' +
                    '<button type="button" class="wixi-access-popup__action">' + escapeHtml(options.button || 'Good') + '</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(popup);
        popup.querySelector(".wixi-access-popup__close").onclick = closeAccessPopup;
        popup.onclick = function (event) {
            if (event.target === popup) {
                closeAccessPopup();
            }
        };
        popup.querySelector(".wixi-access-popup__action").onclick = function () {
            closeAccessPopup();
            if (typeof options.onAction === "function") {
                options.onAction();
            }
        };
    }

    function fetchVerificationState() {
        return fetch(resolveApiUrl("/api/user/verification"), {
            credentials: "include"
        }).then(function (response) {
            if (!response.ok) {
                return null;
            }
            return response.json();
        }).catch(function () {
            return null;
        });
    }

    function verificationPopup(event) {
        if (event && typeof event.preventDefault === "function") {
            event.preventDefault();
        }
        var marginTarget = event && event.target && event.target.closest
            ? event.target.closest("a[href], [onclick]")
            : null;
        if (marginTarget) {
            var marginText = (marginTarget.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
            if (marginText && marginText.indexOf("margin") === 0) {
                if (!state.user || state.user.authenticated !== true) {
                    redirectToSignin();
                    return false;
                }
                window.location.href = withCurrentLang("/profile/trading?mode=margin");
                return false;
            }
        }
        if (!state.user || state.user.authenticated !== true) {
            redirectToSignin();
            return false;
        }
        fetchVerificationState().then(function (record) {
            if (record && String(record.level2_status || "").toLowerCase() === "verified") {
                window.location.href = withCurrentLang("/profile/trading/");
                return;
            }
            showAccessPopup({
                title: "Error Occurred",
                text: "You don't have full access to our exchange services yet. To unlock all features, you need to obtain Level 2 verification. This status is automatically granted to users with a total deposit amount of 10,000 USDT or more per month.",
                button: "Verification",
                onAction: function () {
                    window.location.href = withCurrentLang("/profile/verification/");
                }
            });
        });
        return false;
    }

    function errorPopup(type, _unused, event) {
        if (event && typeof event.preventDefault === "function") {
            event.preventDefault();
        }
        var popupByType = {
            P2P: {
                text: "To access P2P trading, you need to obtain Level 2 verification. This status is granted to users with a monthly balance of 10,000 USDT or more.",
                button: "Good",
                onAction: function () {}
            },
            CRYPTO_LENDING: {
                text: "You don't have full access to our exchange services yet. To unlock all features, you need to obtain Level 2 verification. This status is automatically granted to users with a total deposit amount of 10,000 USDT or more per month.",
                button: "Verification",
                onAction: function () {
                    window.location.href = withCurrentLang("/profile/verification/");
                }
            },
            OTHER: {
                text: "You don't have full access to our exchange services yet. To unlock all features, you need to obtain Level 2 verification. This status is automatically granted to users with a total deposit amount of 10,000 USDT or more per month.",
                button: "Verification",
                onAction: function () {
                    window.location.href = withCurrentLang("/profile/verification/");
                }
            }
        };
        var config = popupByType[type] || {
            text: "This feature is temporarily unavailable for your account.",
            button: "Good",
            onAction: function () {}
        };
        showAccessPopup({
            title: "Error Occurred",
            text: config.text,
            button: config.button,
            onAction: config.onAction
        });
        return false;
    }

    function init(options) {
        state.apiBase = options && options.apiBase ? options.apiBase.replace(/\/+$/, "") : state.apiBase;
        state.supportedLangs = options && options.supportedLangs ? options.supportedLangs.slice() : state.supportedLangs;
        state.routePrefix = normalizePrefix(options && options.routePrefix ? options.routePrefix : window.__SITE_PREFIX__ || "");
        state.guestMarkup = guestMarkup();

        if (!isProfileRoute()) {
            seedFromExistingShell();
            state.user = readPersistedUser();
        } else {
            state.user = null;
            clearUser();
        }
        state.authResolved = !isProfileRoute() || !!state.user;
        ensureAuthorizedInput(!!state.user);
        patchWindowOpen();
        interceptGuestProtectedClicks();
        interceptMarginTradingClicks();
        patchOnclickAttributes();
        applyCurrentLangToLinks();
        if (enforceGuestProfileRedirect()) {
            return;
        }
        if (state.user) {
            renderShell();
        } else if (!isProfileRoute()) {
            renderGuestShell();
        }
    }

    function setLocale(locale) {
        state.locale = locale || null;
        state.guestMarkup = guestMarkup();
        if (state.user) {
            renderShell();
            return;
        }
        renderGuestShell();
    }

    function setUser(user) {
        state.user = user && user.authenticated ? user : null;
        state.authResolved = true;
        ensureAuthorizedInput(!!state.user);
        dispatchUserEvent(state.user);

        if (state.user) {
            persistUser(state.user);
            renderShell();
            return;
        }

        clearUser();
        if (enforceGuestProfileRedirect()) {
            return;
        }
        renderGuestShell();
    }

    window.WixiShell = {
        init: init,
        setLocale: setLocale,
        setUser: setUser,
        getUser: function () {
            return state.user || readPersistedUser();
        },
        persistUser: persistUser,
        clearUser: clearUser,
        routeUrl: routeUrl,
        assetUrl: assetUrl,
        withCurrentLang: withCurrentLang,
        currentPathWithoutPrefix: currentPathWithoutPrefix,
        isProfileRoute: isProfileRoute,
        redirectToSignin: redirectToSignin,
        enforceGuestProfileRedirect: enforceGuestProfileRedirect,
        isProtectedProfileTarget: isProtectedProfileTarget,
        applyCurrentLangToLinks: applyCurrentLangToLinks,
        patchOnclickAttributes: patchOnclickAttributes,
        resolveApiUrl: resolveApiUrl,
        refresh: renderShell,
        updateBalances: updateBalances
    };
    window.verificationPopup = verificationPopup;
    window.errorPopup = errorPopup;
})();
