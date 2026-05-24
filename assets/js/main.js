var locale = null;

//event doesn't work
var messagesLoaded = false;

var supportedLangs = ["en", "tr", "de", "es", "it", "fr", "pt", "zh", "zh-sg", "ja"];
var API_BASE = resolveApiBase();

window.API_BASE = API_BASE;
window.currentUser = null;

configureApiRequests();
if (window.WixiShell) {
    window.WixiShell.init({
        apiBase: API_BASE,
        supportedLangs: supportedLangs
    });
    window.currentUser = window.WixiShell.getUser();
}
hydrateCurrentUser();
preserveLanguageLinks();
bindLanguageSwitcher();
ensureAssetsHeaderObserver();

let lang = getSelectedLang();
updateLanguageSwitcher(lang);

function enforceAssetsHeaderLabel(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const candidates = scope.querySelectorAll('.main-menu__section__nav-button .v-btn__content, .main-menu__section__menu__title, .profile_section__tabs__title__text');

    candidates.forEach(function (node) {
        if (!node) {
            return;
        }

        const rawText = (node.textContent || "").replace(/\s+/g, " ").trim();
        if (rawText !== "Balances") {
            return;
        }

        if (node.closest('.main-menu__section__nav-button')) {
            const iconNode = node.querySelector('.v-icon, .main-menu__section__nav-button__icon');
            const walletSvg = '<img src="/assets/img/profile/wallet.svg" alt="wallet" style="width:18px;height:18px;margin-right:8px;display:inline-block;vertical-align:middle;">';
            node.innerHTML = walletSvg + 'Assets' + (iconNode ? iconNode.outerHTML : '');
            return;
        }

        node.textContent = "Assets";
    });
}

function ensureAssetsHeaderObserver() {
    if (!document.body) {
        return;
    }

    if (document.body.dataset.assetsHeaderObserverBound === "true") {
        return;
    }

    document.body.dataset.assetsHeaderObserverBound = "true";
    enforceAssetsHeaderLabel(document);

    if (typeof MutationObserver === "undefined") {
        return;
    }

    const observer = new MutationObserver(function () {
        enforceAssetsHeaderLabel(document);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

function resolveRuntimePath(path) {
    if (window.WixiShell && typeof window.WixiShell.routeUrl === "function") {
        return window.WixiShell.routeUrl(path);
    }
    return path;
}

function isStaticAssetPath(pathname) {
    const prefix = window.__SITE_PREFIX__ || "";
    return pathname.startsWith("/assets/")
        || pathname.startsWith("/fonts/")
        || pathname.startsWith("/cdn-cgi/")
        || (prefix && (pathname.startsWith(prefix + "/assets/") || pathname.startsWith(prefix + "/fonts/")));
}

$.ajax({
    type: "GET",
    url: resolveRuntimePath("/assets/locales/" + lang + ".json?v=1"),
    success: function (response) {
        locale = response;
        messagesLoaded = true;

        checkCookiesAccepted();
        if (window.WixiShell) {
            window.WixiShell.setLocale(locale);
        }
    }
});

function resolveApiBase() {
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
        return window.location.origin;
    }

    return window.location.protocol + "//api." + host;
}

function resolveApiUrl(url) {
    if (!url) {
        return url;
    }

    if (/^https?:\/\//i.test(url) || url.startsWith("//")) {
        return url;
    }

    if (url.indexOf("/api/") === 0) {
        return API_BASE + url;
    }

    if (url.indexOf("../api/") === 0 || url.indexOf("./api/") === 0 || url.indexOf("api/") === 0) {
        return API_BASE + "/" + url.replace(/^(\.\.\/|\.\/)?/, "");
    }

    return url;
}

function isApiRequest(url) {
    if (!url) {
        return false;
    }

    return url.indexOf("/api/") === 0 || url.indexOf("../api/") === 0 || url.indexOf("./api/") === 0 || url.indexOf("api/") === 0;
}

function configureApiRequests() {
    $.ajaxPrefilter(function(options, originalOptions) {
        if (!isApiRequest(options.url)) {
            return;
        }

        options.url = resolveApiUrl(options.url);
        options.crossDomain = true;
        options.xhrFields = Object.assign({}, originalOptions.xhrFields || {}, {
            withCredentials: true
        });
    });

    if (typeof window.fetch === "function" && !window.__wixiFetchPatched) {
        const originalFetch = window.fetch.bind(window);
        window.fetch = function(resource, init) {
            let requestUrl = resource;
            let options = init ? Object.assign({}, init) : {};

            if (typeof resource === "string" && isApiRequest(resource)) {
                requestUrl = resolveApiUrl(resource);
                if (typeof options.credentials === "undefined") {
                    options.credentials = "include";
                }
                return originalFetch(requestUrl, options);
            }

            if (typeof Request !== "undefined" && resource instanceof Request && isApiRequest(resource.url)) {
                requestUrl = resolveApiUrl(resource.url);
                if (typeof options.credentials === "undefined") {
                    options.credentials = resource.credentials || "include";
                }
                return originalFetch(requestUrl, options);
            }

            return originalFetch(resource, init);
        };
        window.__wixiFetchPatched = true;
    }

    if (typeof XMLHttpRequest !== "undefined" && !window.__wixiXhrPatched) {
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            const nextUrl = typeof url === "string" && isApiRequest(url) ? resolveApiUrl(url) : url;
            this.__wixiApiRequest = typeof url === "string" && isApiRequest(url);
            return originalOpen.apply(this, [method, nextUrl].concat(Array.prototype.slice.call(arguments, 2)));
        };

        const originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(body) {
            if (this.__wixiApiRequest) {
                this.withCredentials = true;
            }
            return originalSend.call(this, body);
        };
        window.__wixiXhrPatched = true;
    }
}

function syncAuthorizedState(user) {
    const resolvedUser = user && user.authenticated ? user : null;
    window.currentUser = resolvedUser;

    if ($("#user-authorized").length === 0) {
        $("body").append('<input type="hidden" hidden="hidden" id="user-authorized" value="false">');
    }

    $("#user-authorized").val(resolvedUser ? "true" : "false");
    if (window.WixiShell) {
        window.WixiShell.setUser(resolvedUser);
    }
    try {
        window.dispatchEvent(new CustomEvent("wixi:user-auth-state", {
            detail: {
                authenticated: !!resolvedUser,
                user: resolvedUser
            }
        }));
    } catch (_error) {
    }
}

function hydrateCurrentUser() {
    $.ajax({
        url: "/api/user/me",
        type: "GET",
        success: function(response) {
            try {
                const user = typeof response === "string" ? JSON.parse(response) : response;
                syncAuthorizedState(user);
            } catch (error) {
                syncAuthorizedState(null);
            }
        },
        error: function() {
            syncAuthorizedState(null);
        }
    });
}

function preserveLanguageLinks() {
    const currentLang = new URLSearchParams(window.location.search).get("lang");
    if (!currentLang || supportedLangs.indexOf(currentLang) === -1) {
        return;
    }

    const applyLangToLinks = function() {
        document.querySelectorAll("a[href]").forEach(function(anchor) {
            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
                return;
            }

            try {
                const url = new URL(href, window.location.href);
                if (url.origin !== window.location.origin) {
                    return;
                }

                if (isStaticAssetPath(url.pathname)) {
                    return;
                }

                url.searchParams.set("lang", currentLang);
                anchor.setAttribute("href", url.pathname + url.search + url.hash);
            } catch (error) {
            }
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyLangToLinks);
    } else {
        applyLangToLinks();
    }
}

function buildLanguageUrl(nextLang) {
    const url = new URL(window.location.href);

    if (!nextLang || nextLang === "en") {
        url.searchParams.delete("lang");
    } else {
        url.searchParams.set("lang", nextLang);
    }

    return url.pathname + url.search + url.hash;
}

function applyLanguageSelection(langCode) {
    if (!langCode || supportedLangs.indexOf(langCode) === -1) {
        return;
    }

    setCookie("lang", langCode, 999);
    document.documentElement.lang = langCode;
    updateLanguageSwitcher(langCode);

    const nextUrl = buildLanguageUrl(langCode);
    const currentUrl = window.location.pathname + window.location.search + window.location.hash;
    if (nextUrl !== currentUrl) {
        window.location.assign(nextUrl);
        return;
    }

    window.location.reload();
}

function extractLanguageCode(node) {
    const onclick = node.getAttribute("onclick") || "";
    const match = onclick.match(/lang=([a-z-]+)/i);

    if (match) {
        return match[1].toLowerCase();
    }

    const prefix = node.querySelector(".main-menu__section__menu__nav__title__prefix");
    if (!prefix) {
        return null;
    }

    return prefix.textContent.trim().toLowerCase();
}

function updateLanguageSwitcher(currentLang) {
    const normalizedLang = supportedLangs.indexOf(currentLang) !== -1 ? currentLang : "en";
    const activeSelector = '.menu-lang .main-menu__section__menu__nav[data-lang="' + normalizedLang + '"] span:last-child';
    const activeLabel = document.querySelector(activeSelector);
    const buttonLabel = document.querySelector(".nav-button-lang .v-btn__content");

    if (buttonLabel) {
        buttonLabel.textContent = normalizedLang.toUpperCase();
    }

    document.querySelectorAll(".menu-lang .main-menu__section__menu__nav span:last-child").forEach(function(label) {
        label.style.color = "";
    });

    if (activeLabel) {
        activeLabel.style.color = "#ffc014";
    }
}

function bindLanguageSwitcher() {
    document.querySelectorAll(".menu-lang .main-menu__section__menu__nav").forEach(function(item) {
        const langCode = extractLanguageCode(item);
        if (!langCode || supportedLangs.indexOf(langCode) === -1) {
            return;
        }
        item.dataset.lang = langCode;
        item.setAttribute("onclick", "return false;");
        item.style.cursor = "pointer";
        item.onclick = function(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
                if (typeof event.stopImmediatePropagation === "function") {
                    event.stopImmediatePropagation();
                }
            }
            applyLanguageSelection(langCode);
            return false;
        };
    });

    if (document.body.dataset.languageSwitcherBound === "true") {
        return;
    }

    document.body.dataset.languageSwitcherBound = "true";
    document.addEventListener("click", function(event) {
        const target = event.target && event.target.closest ? event.target.closest(".menu-lang .main-menu__section__menu__nav, .menu-lang [onclick*='lang='], .menu-lang [onclick*='lang='] *") : null;
        if (!target) {
            return;
        }

        const item = target.closest(".main-menu__section__menu__nav") || target;
        let langCode = item.dataset.lang || extractLanguageCode(item);
        if ((!langCode || supportedLangs.indexOf(langCode) === -1) && item.getAttribute) {
            const onclick = item.getAttribute("onclick") || "";
            const match = onclick.match(/lang=([a-z-]+)/i);
            if (match) {
                langCode = match[1].toLowerCase();
            }
        }
        if (!langCode || supportedLangs.indexOf(langCode) === -1) {
            return;
        }

        item.dataset.lang = langCode;
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
        }
        applyLanguageSelection(langCode);
    }, true);
}

function getMessage(key, replacers) {
    let message = locale[key];

    if (replacers && replacers.length > 0) {
        replacers.forEach((replacer, index) => {
            message = message.replace(`{${index}}`, replacer);
        });
    }

    return message;
}

function checkCookiesAccepted() {
    const cookiesAccepted = getCookie("cookies_accepted");

    if (!cookiesAccepted || cookiesAccepted === "") {
        const acceptMessage = getMessage('cookies.accept.message');
        const privacyPolicy = getMessage('cookies.privacy.policy');
        const acceptButton = getMessage('cookies.accept.button');

        $("footer").prepend(`
            <div class="cookie">
               <div class="cookie__content">
                  <div class="cookie__text">
                     ${acceptMessage}
                     <a href="${window.WixiShell ? window.WixiShell.withCurrentLang('/privacy-policy') : '/privacy-policy'}" class="">
                     ${privacyPolicy}</a>
                  </div>
                  <div class="spacer"></div>
                  <button type="button" onclick="acceptCookies(event)" class="cookie__btn v-btn v-btn--is-elevated v-btn--has-bg theme--light v-size--default"><span class="v-btn__content">${acceptButton}</span></button>
               </div>
            </div>
        `);
    }
}

function getCookie(name) {
    let cookieArr = document.cookie.split(";");

    for(let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].split("=");

        if(name === cookiePair[0].trim()) {
            return decodeURIComponent(cookiePair[1]);
        }
    }

    return null;
}

function setCookie(cookieName, cookieValue, daysToExpire) {
    let expires = "";
    if (daysToExpire) {
        const date = new Date();
        date.setTime(date.getTime() + (daysToExpire * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = cookieName + "=" + cookieValue + expires + "; path=/";
}

function getSelectedLang() {
    const params = new URLSearchParams(window.location.search);
    const langFromQuery = params.get("lang");

    if (langFromQuery && supportedLangs.indexOf(langFromQuery) !== -1) {
        setCookie("lang", langFromQuery, 999);
        document.documentElement.lang = langFromQuery;
        return langFromQuery;
    }

    const langFromCookie = getCookie("lang");
    if (langFromCookie && supportedLangs.indexOf(langFromCookie) !== -1) {
        document.documentElement.lang = langFromCookie;
        return langFromCookie;
    }

    document.documentElement.lang = "en";
    return "en";
}

function acceptCookies() {
    event.preventDefault();

    setCookie("cookies_accepted", "true", 999);
    $(".cookie").remove();
}

//mobile app start
const banner = $('#mobile-app-banner');

$('#mobile-app-btn').on('click', () => {
    banner.css('display', 'flex');
});

$('#mobile-app-close').on('click', () => {
    banner.addClass('custom-popup-fade-out');

    setTimeout(() => {
        banner.css('display', 'none');
        banner.removeClass('custom-popup-fade-out')
    }, 500);
});

document.addEventListener('click', () => {
    if (banner.css('display') !== 'none' && !event.target.closest('.v-dialog__content') && event.target.id !== 'mobile-app-btn') {
        banner.css('display', 'none');
    }
});

document.addEventListener('click', function() {
    if (!event.target.closest('.main-menu__section__menu') && !event.target.closest('.main-menu__section__nav-button')
        && !event.target.closest('.main-menu__section__profile') && !event.target.closest('.mobile-menu-button') && !event.target.closest('.mobile-menu') && !event.target.closest('.assets-hide-show')) {
        $('.main-menu__section__nav-button').each((index, btn) => {
            $(btn).removeClass('active');
        });
        $('.main-menu__section__menu').each((index, menu) => {
            $(menu).css('display', 'none');
        });
        $(".mobile-menu-button > div").removeClass('open');
        $(".mobile-menu").css('display', 'none');
        $('.menu-lang').css('display', 'none');
    }
});
//mobile app end

//header start
//mobile start

$(".main-menu__section").on('click', function (event) {
    if (event.target.closest('.main-menu__section__menu')) {
        return;
    }

    const el = $(this).find('.main-menu__section__menu');
    if ($(this).hasClass('lang-button')) {
        return;
    }
    const active = el.css('display') !== 'none';

    $('.main-menu__section__nav-button').each((index, btn) => {
        $(btn).removeClass('active');
    });
    $('.main-menu__section__menu').each((index, menu) => {
        $(menu).css('display', 'none');
    });

    $(".mobile-menu-button > div").removeClass('open');
    $(".mobile-menu").css('display', 'none');
    $('.menu-lang').css('display', 'none');

    $('.mobile-menu__item__panel').each(function() {
        const btnWrapper = $(this);

        btnWrapper.removeClass('v-expansion-panel--active');
        btnWrapper.removeClass('v-item--active');

        const btn = btnWrapper.find('button');
        btn.removeClass('v-expansion-panel-header--active');
        btn.attr('aria-expanded', 'false');

        btnWrapper.find('a').each(function() {
            $(this).css('display', 'none');
        });
    });

    if (!active) {
        if (el.hasClass('main-menu__section-flex')) {
            el.css('display', 'flex');
        } else {
            el.css('display', 'block');
        }
    }
});
//mobile end

$(".main-menu__section").on('mouseenter', function (event) {
    if (window.innerWidth < 1400) {
        return;
    }

    $(this).find('.main-menu__section__nav-button').addClass('active');
    const el = $(this).find('.main-menu__section__menu');
    if (el.hasClass('main-menu__section-flex')) {
        el.css('display', 'flex');
    } else {
        el.css('display', 'block');
    }
});

$(".main-menu__section").on('mouseleave', function (event) {
    if (window.innerWidth < 1400) {
        return;
    }

    $(this).find('.main-menu__section__nav-button').removeClass('active');
    $(this).find('.main-menu__section__menu').css('display', 'none');
});

$(".nav-button-lang").on('click', function () {
    const has = $(this).hasClass('active');

    $('.main-menu__section__nav-button').each((index, btn) => {
        $(btn).removeClass('active');
    });
    $('.main-menu__section__menu').each((index, menu) => {
        $(menu).css('display', 'none');
    });

    $(".mobile-menu-button > div").removeClass('open');
    $(".mobile-menu").css('display', 'none');
    $('.menu-lang').css('display', 'none');

    $('.mobile-menu__item__panel').each(function() {
        const btnWrapper = $(this);

        btnWrapper.removeClass('v-expansion-panel--active');
        btnWrapper.removeClass('v-item--active');

        const btn = btnWrapper.find('button');
        btn.removeClass('v-expansion-panel-header--active');
        btn.attr('aria-expanded', 'false');

        btnWrapper.find('a').each(function() {
            $(this).css('display', 'none');
        });
    });

    if (has) {
        $(this).removeClass('active');
        $('.menu-lang').css('display', 'none');
    } else {
        $(this).addClass('active');
        $('.menu-lang').css('display', 'flex');
    }
});

$(".mobile-menu-button").on('click', function () {
    const buttonIcon = $(this).find('div');

    const has = buttonIcon.hasClass('open');
    $('.main-menu__section__nav-button').each((index, btn) => {
        $(btn).removeClass('active');
    });
    $('.main-menu__section__menu').each((index, menu) => {
        $(menu).css('display', 'none');
    });
    $(".mobile-menu-button > div").removeClass('open');
    $(".mobile-menu").css('display', 'none');
    $('.menu-lang').css('display', 'none');

    $('.mobile-menu__item__panel').each(function() {
        const btnWrapper = $(this);

        btnWrapper.removeClass('v-expansion-panel--active');
        btnWrapper.removeClass('v-item--active');

        const btn = btnWrapper.find('button');
        btn.removeClass('v-expansion-panel-header--active');
        btn.attr('aria-expanded', 'false');

        btnWrapper.find('a').each(function() {
            $(this).css('display', 'none');
        });
    });

    if (has) {
        buttonIcon.removeClass('open');
        $(".mobile-menu").css('display', 'none');
    } else {
        buttonIcon.addClass('open');
        $(".mobile-menu").css('display', 'block');
    }

    $(".main-menu__section > button").each(el => {
        $(el).removeClass('active');
        $('.menu-lang').css('display', 'none');
    })
});

$(".v-expansion-panel-header").on('click', function () {
    const opened = $(this).hasClass('v-expansion-panel-header--active');
    const panel = $(this).parent();
    const content = panel.find('.v-expansion-panel-content');

    if (opened) {
        $(this).removeClass('v-expansion-panel-header--active');
        panel.removeClass('v-expansion-panel--active v-item--active');
        panel.attr('aria-expanded', 'false');
        content.css({
            'max-height': '0',
            'overflow': 'hidden',
            'padding': '0',
            'margin': '0',
            'display': 'none'
        });
    } else {
        content.css({
            'display': 'block',
            'padding': '',
            'margin': ''
        });
        const contentHeight = content.prop('scrollHeight');
        $(this).addClass('v-expansion-panel-header--active');
        panel.addClass('v-expansion-panel--active v-item--active');
        panel.attr('aria-expanded', 'true');
        content.css({
            'max-height': contentHeight + 'px',
            'overflow': 'hidden'
        });
    }
});

$(".footer-title__wrapper").on('click', function() {
    const section = $(this).closest('.footer-section');

    if (section.hasClass('active')) {
        section.removeClass('active');
    } else {
        section.addClass('active');
    }
});

$("#balances-general").on('click', function() {
    window.scrollTo(0, 0);
});
//header end

function copyToClipboard(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
}

function copyWithButton(copyCodeBtn, copyMsg, copyFunction) {
    copyCodeBtn.on('mousedown', function (event) {
        if (event.button === 0) {
            copyFunction();
        }
    });

    copyCodeBtn.on('mouseup', function (event) {
        if (event.button === 0) {
            noti(copyMsg, 'success');
        }
    });
}

var balanceShowed = getCookie("balance_showed");

function getUsdBalanceNode() {
    return $("#usd-balance");
}

function getBtcBalanceNode() {
    return $("#btc-balance");
}

function getSpotBalanceNode() {
    return $("#spot-balance");
}

function getMarginBalanceNode() {
    return $("#margin-balance");
}

function getFuturesBalanceNode() {
    return $("#futures-balance");
}

function getEarnBalanceNode() {
    return $("#earn-balance");
}

const ASSETS_SUMMARY_CACHE_KEY = "nohex_assets_summary_cache_v1";
const ASSETS_SUMMARY_CACHE_TTL_MS = 15000;
window.__wixiAssetsSummaryState = window.__wixiAssetsSummaryState || {
    data: null,
    lastFetched: 0,
    inFlight: null
};

function formatAssetsSummaryUsd(value) {
    const amount = parseFloat(value);
    const normalized = Number.isFinite(amount) ? amount : 0;
    return "$" + normalized.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatAssetsSummaryPercent(value) {
    const amount = parseFloat(value);
    const normalized = Number.isFinite(amount) ? amount : 0;
    return normalized.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }) + "%";
}

function updateAssetsRow(node, percentNode, amountText, percentText) {
    if (node && node.length) {
        node.attr("data-visible-text", amountText);
        node.text(amountText);
    }
    if (percentNode && percentNode.length) {
        percentNode.text(percentText);
    }
}

function normalizeAssetsSummaryPayload(response) {
    let json = response;
    if (typeof response === "string") {
        try {
            json = JSON.parse(response);
        } catch (_error) {
            return null;
        }
    }
    return json && typeof json === "object" ? json : null;
}

function storeAssetsSummaryCache(summary) {
    if (!summary) {
        return;
    }

    const state = window.__wixiAssetsSummaryState;
    state.data = summary;
    state.lastFetched = Date.now();

    try {
        window.localStorage.setItem(ASSETS_SUMMARY_CACHE_KEY, JSON.stringify({
            saved_at: state.lastFetched,
            data: summary
        }));
    } catch (_error) {
    }
}

function getCachedAssetsSummary(maxAgeMs) {
    const state = window.__wixiAssetsSummaryState;
    const maxAge = typeof maxAgeMs === "number" ? maxAgeMs : ASSETS_SUMMARY_CACHE_TTL_MS;

    if (state.data && (Date.now() - state.lastFetched) <= maxAge) {
        return state.data;
    }

    try {
        const raw = window.localStorage.getItem(ASSETS_SUMMARY_CACHE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        const savedAt = parseInt(parsed && parsed.saved_at, 10);
        const data = parsed && parsed.data ? parsed.data : null;
        if (!data || !Number.isFinite(savedAt) || (Date.now() - savedAt) > maxAge) {
            return null;
        }
        state.data = data;
        state.lastFetched = savedAt;
        return data;
    } catch (_error) {
        return null;
    }
}

function applyGlobalAssetsSummary(summary) {
    if (!summary || !getUsdBalanceNode().length) {
        return;
    }

    const totalUsdValue = parseFloat(summary.total_usd || "0");
    const totalUsdText = (Number.isFinite(totalUsdValue) ? totalUsdValue : 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    const btcApprox = String(summary.btc_approx || "0.00000000");
    const spotText = formatAssetsSummaryUsd(summary.spot_usd || "0");
    const tradingText = formatAssetsSummaryUsd(summary.trading_usd || "0");
    const futuresText = formatAssetsSummaryUsd(summary.futures_usd || "0");
    const earnText = formatAssetsSummaryUsd(summary.earn_usd || "0");

    getUsdBalanceNode().attr("usd-balance", totalUsdText).text(totalUsdText + " USD");
    getBtcBalanceNode().attr("btc-balance", btcApprox).text("≈ " + btcApprox + " BTC");
    updateAssetsRow(getSpotBalanceNode(), $("#spot-balance-percent"), spotText, formatAssetsSummaryPercent(summary.spot_percent || "0"));
    updateAssetsRow(getMarginBalanceNode(), $("#margin-balance-percent"), tradingText, formatAssetsSummaryPercent(summary.trading_percent || "0"));
    updateAssetsRow(getFuturesBalanceNode(), $("#futures-balance-percent"), futuresText, formatAssetsSummaryPercent(summary.futures_percent || "0"));
    updateAssetsRow(getEarnBalanceNode(), $("#earn-balance-percent"), earnText, formatAssetsSummaryPercent(summary.earn_percent || "0"));

    if (typeof window.applyBalanceVisibilityState === "function") {
        window.applyBalanceVisibilityState();
    }
}

function refreshGlobalAssetsSummaryFromApi(force) {
    const state = window.__wixiAssetsSummaryState;

    if (!window.currentUser || window.currentUser.authenticated !== true) {
        return Promise.resolve(null);
    }

    const cached = getCachedAssetsSummary();
    if (!force && cached && (Date.now() - state.lastFetched) <= ASSETS_SUMMARY_CACHE_TTL_MS) {
        applyGlobalAssetsSummary(cached);
        return Promise.resolve(cached);
    }

    if (state.inFlight) {
        return state.inFlight;
    }

    state.inFlight = new Promise(function (resolve) {
        $.ajax({
        url: "/api/user/assets-summary",
        type: "GET",
        success: function (response) {
            const json = normalizeAssetsSummaryPayload(response);
            if (!json) {
                resolve(null);
                return;
            }
            storeAssetsSummaryCache(json);
            applyGlobalAssetsSummary(json);
            resolve(json);
        },
        error: function () {
            const fallback = getCachedAssetsSummary(60000);
            if (fallback) {
                applyGlobalAssetsSummary(fallback);
            }
            resolve(fallback || null);
        },
        complete: function () {
            state.inFlight = null;
        }
        });
    });

    return state.inFlight;
}

window.getCachedAssetsSummary = getCachedAssetsSummary;
window.refreshGlobalAssetsSummaryFromApi = refreshGlobalAssetsSummaryFromApi;

function updateBalanceToggleIcons(src) {
    $(".assets-hide-show").each(function () {
        $(this).attr("src", src);
    });
}

function setMaskedBalance(node, maskedText) {
    if (!node || node.length === 0) {
        return;
    }
    if (!node.attr("data-visible-text")) {
        node.attr("data-visible-text", node.text().trim());
    }
    node.text(maskedText);
}

function restoreMaskedBalance(node, fallbackText) {
    if (!node || node.length === 0) {
        return;
    }
    node.text(node.attr("data-visible-text") || fallbackText);
}

function updateWalletSummaryVisibility(hidden) {
    const desktopSummary = $(".user_balance__section").first();
    const desktopUsd = desktopSummary.find(".user_balance__section__balance").first();
    const desktopBtc = desktopSummary.find(".user_balance__section__text").last();
    const mobileSummary = $(".profile__mobile__balance");
    const mobileUsd = mobileSummary.find(".profile__mobile__balance__price").first();
    const mobileBtc = mobileSummary.find(".profile__mobile__balance__price-btc").first();
    const headerUsd = getUsdBalanceNode();
    const headerBtc = getBtcBalanceNode();
    const liveUsdText = (headerUsd.attr("usd-balance") || headerUsd.text().replace(/\s*USD\s*$/i, "").trim() || "0.00") + " USD";
    const liveBtcValue = headerBtc.attr("btc-balance") || headerBtc.text().replace(/^≈\s*/, "").replace(/\s*BTC\s*$/i, "").trim() || "0.00000000";
    const liveBtcText = "≈ " + liveBtcValue + " BTC";

    if (desktopUsd.length) {
        if (!hidden) {
            desktopUsd.attr("data-visible-text", liveUsdText);
        } else if (!desktopUsd.attr("data-visible-text")) {
            desktopUsd.attr("data-visible-text", desktopUsd.text().trim());
        }
        desktopUsd.text(hidden ? "***** USD" : (desktopUsd.attr("data-visible-text") || liveUsdText));
    }

    if (desktopBtc.length) {
        if (!hidden) {
            desktopBtc.attr("data-visible-text", liveBtcText);
        } else if (!desktopBtc.attr("data-visible-text")) {
            desktopBtc.attr("data-visible-text", desktopBtc.text().trim());
        }
        desktopBtc.text(hidden ? "≈ ***** BTC" : (desktopBtc.attr("data-visible-text") || liveBtcText));
    }

    if (mobileUsd.length) {
        if (!hidden) {
            mobileUsd.attr("data-visible-text", liveUsdText);
        } else if (!mobileUsd.attr("data-visible-text")) {
            mobileUsd.attr("data-visible-text", mobileUsd.text().trim());
        }
        mobileUsd.text(hidden ? "***** USD" : (mobileUsd.attr("data-visible-text") || liveUsdText));
    }

    if (mobileBtc.length) {
        if (!hidden) {
            mobileBtc.attr("data-visible-text", liveBtcText);
        } else if (!mobileBtc.attr("data-visible-text")) {
            mobileBtc.attr("data-visible-text", mobileBtc.text().trim());
        }
        mobileBtc.text(hidden ? "≈ ***** BTC" : (mobileBtc.attr("data-visible-text") || liveBtcText));
    }
}

if (balanceShowed && balanceShowed !== 'true') {
    hideBalance();
}

function hideBalance() {
    document.body.setAttribute("data-balance-hidden", "true");
    getUsdBalanceNode().html('***** USD');
    getBtcBalanceNode().html('≈ ***** BTC');
    setMaskedBalance(getSpotBalanceNode(), '$*.**');
    setMaskedBalance(getMarginBalanceNode(), '$*.**');
    setMaskedBalance(getFuturesBalanceNode(), '$*.**');
    setMaskedBalance(getEarnBalanceNode(), '$*.**');
    updateWalletSummaryVisibility(true);
    updateBalanceToggleIcons(resolveRuntimePath('/assets/img/show.svg'));
}

function showBalance() {
    document.body.setAttribute("data-balance-hidden", "false");
    const usdBalance = getUsdBalanceNode();
    const btcBalance = getBtcBalanceNode();
    usdBalance.html((usdBalance.attr('usd-balance') || '0.00') + ' USD');
    btcBalance.html('≈ ' + (btcBalance.attr('btc-balance') || '0.00000000') + ' BTC');
    restoreMaskedBalance(getSpotBalanceNode(), '$0.00');
    restoreMaskedBalance(getMarginBalanceNode(), '$0.00');
    restoreMaskedBalance(getFuturesBalanceNode(), '$0.00');
    restoreMaskedBalance(getEarnBalanceNode(), '$0.00');
    updateWalletSummaryVisibility(false);
    updateBalanceToggleIcons(resolveRuntimePath('/assets/img/profile/hide.svg'));
}

function onAssetsHideShow(event) {
    event.preventDefault();

    balanceShowed = getCookie("balance_showed");

    if (balanceShowed && balanceShowed !== 'true') {
        setCookie("balance_showed", "true", 30);
        showBalance();
    } else {
        setCookie("balance_showed", "false", 30);
        hideBalance();
    }
}

window.applyBalanceVisibilityState = function () {
    balanceShowed = getCookie("balance_showed");
    if (balanceShowed && balanceShowed !== 'true') {
        hideBalance();
        return;
    }
    showBalance();
};

window.addEventListener("wixi:user", function () {
    setTimeout(refreshGlobalAssetsSummaryFromApi, 100);
});

window.addEventListener("wixi:balances", function () {
    setTimeout(refreshGlobalAssetsSummaryFromApi, 100);
});

const initialCachedAssetsSummary = getCachedAssetsSummary(60000);
if (initialCachedAssetsSummary) {
    applyGlobalAssetsSummary(initialCachedAssetsSummary);
}

setTimeout(function () {
    refreshGlobalAssetsSummaryFromApi(true);
}, 250);
setInterval(refreshGlobalAssetsSummaryFromApi, 15000);

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return "0 Bytes";
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = parseFloat((bytes / Math.pow(1024, index)).toFixed(dm));
    return `${value} ${sizes[index]}`;
}

//start support
const supportButton = document.getElementsByClassName('support-button')[0];

if (supportButton) {
    const SUPPORT_WIDGET_STATE_KEY = "nohex_support_widget_open";
    const chatBox = document.getElementsByClassName('chat-box')[0];
    const supportHide = document.getElementById('support-hide');
    const photo = document.getElementById('support_photo_input');
    const supportHeaderLabel = document.querySelector('.chat-box-header .support-header span');
    const supportHeaderImage = document.querySelector('.chat-box-header .support-header img');
    const defaultSupportHeaderLabel = supportHeaderLabel ? supportHeaderLabel.textContent : 'Customer support';
    const defaultSupportHeaderImage = supportHeaderImage ? supportHeaderImage.getAttribute('src') || '' : '';

    function getSupportWidgetSavedState() {
        try {
            return window.localStorage.getItem(SUPPORT_WIDGET_STATE_KEY) === "true";
        } catch (_error) {
            return false;
        }
    }

    function setSupportWidgetSavedState(isOpen) {
        try {
            window.localStorage.setItem(SUPPORT_WIDGET_STATE_KEY, isOpen ? "true" : "false");
        } catch (_error) {
        }
    }

    function formatSupportTimestamp(isoText) {
        if (!isoText) {
            return "";
        }
        const parsed = new Date(isoText);
        if (Number.isNaN(parsed.getTime())) {
            return isoText;
        }
        return new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(parsed);
    }

    function hydrateSupportTimes(root) {
        const scope = root || document;
        scope.querySelectorAll('.support__bubble-time[data-support-time]').forEach(function(node) {
            const isoText = node.getAttribute('data-support-time') || '';
            node.textContent = formatSupportTimestamp(isoText);
        });
    }

    const linkPhotoSvg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" focusable="false" viewBox="0 0 16 16" data-garden-id="buttons.icon" data-garden-version="8.76.7" class="StyledIcon-sc-19meqgg-0 cqORhS">
                    <path fill="none" stroke="currentColor" stroke-linecap="round" d="M9.5 4v7.7c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5V3C6.5 1.6 7.6.5 9 .5s2.5 1.1 2.5 2.5v9c0 1.9-1.6 3.5-3.5 3.5S4.5 13.9 4.5 12V4"></path>
                </svg>`;
    const deletePhotoSvg = `
            <svg width="24" height="24" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.4671 3.78564L12.9989 11.7644C12.8793 13.8029 12.8194 14.8222 12.3344 15.555C12.0945 15.9173 11.7857 16.2231 11.4277 16.4529C10.7034 16.9177 9.73391 16.9177 7.79497 16.9177C5.85348 16.9177 4.88273 16.9177 4.15796 16.452C3.79964 16.2218 3.49076 15.9155 3.25102 15.5526C2.76609 14.8186 2.7076 13.7979 2.5906 11.7565L2.13379 3.78564" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                <path d="M14.6 3.78564H1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                <path d="M10.8639 3.78558L10.3481 2.66476C10.0055 1.92024 9.83421 1.54798 9.53869 1.31581C9.47314 1.26431 9.40373 1.2185 9.33115 1.17883C9.00391 1 8.61117 1 7.82571 1C7.02051 1 6.61792 1 6.28525 1.18633C6.21152 1.22763 6.14116 1.27529 6.07491 1.32883C5.77597 1.57041 5.60898 1.95629 5.27501 2.72806L4.81738 3.78558" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                <path d="M5.91113 12.5405L5.91113 7.76525" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                <path d="M9.68848 12.5399L9.68848 7.76465" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
            </svg>`;

    function supportUserAuthorized() {
        if (window.currentUser && window.currentUser.authenticated) {
            return true;
        }
        return $("#user-authorized").length > 0 && $("#user-authorized").val() === 'true';
    }

    function closeSupportChat(persistOpenState) {
        chatBox.style.display = 'none';
        supportButton.style.display = 'flex';
        setSupportWidgetSavedState(!!persistOpenState);
    }

    function openSupportChat(scroll) {
        updateSupport(!!scroll);
        chatBox.style.display = 'flex';
        supportButton.style.display = 'none';
        $(".support-unviewed").css('display', 'none');
        setSupportWidgetSavedState(true);
    }

    function restoreSupportWidgetWhenReady() {
        if (!getSupportWidgetSavedState()) {
            return;
        }
        var attempts = 0;
        var timer = setInterval(function() {
            attempts += 1;
            if (supportUserAuthorized()) {
                clearInterval(timer);
                openSupportChat(false);
                return;
            }
            if (attempts >= 20) {
                clearInterval(timer);
            }
        }, 250);
    }

    window.addEventListener("wixi:user-auth-state", function(event) {
        var detail = event && event.detail ? event.detail : {};
        if (detail.authenticated && getSupportWidgetSavedState()) {
            openSupportChat(false);
            return;
        }
        if (!detail.authenticated) {
            closeSupportChat(false);
        }
    });

    function updateSupportHeader(_agentName, _avatarUrl) {
        if (!supportHeaderLabel) {
            return;
        }
        supportHeaderLabel.textContent = defaultSupportHeaderLabel || 'Customer support';
        if (supportHeaderImage && defaultSupportHeaderImage) {
            supportHeaderImage.setAttribute('src', defaultSupportHeaderImage);
        }
    }

    supportHide.addEventListener('click', () => {
        closeSupportChat(false);
    });

    supportButton.addEventListener('click', function(event) {
        event.preventDefault();
        if (supportUserAuthorized()) {
            openSupportChat(true);
            return;
        }
        $.ajax({
            url: "/api/user/me",
            type: "GET",
            success: function(response) {
                try {
                    const user = typeof response === "string" ? JSON.parse(response) : response;
                    syncAuthorizedState(user);
                } catch (_error) {
                    syncAuthorizedState(null);
                }
                if (supportUserAuthorized()) {
                    openSupportChat(true);
                    return;
                }
                location.replace(window.WixiShell ? window.WixiShell.routeUrl('/signin') : '/signin');
            },
            error: function() {
                location.replace(window.WixiShell ? window.WixiShell.routeUrl('/signin') : '/signin');
            }
        });
    });

    function updateSupport(scroll) {
        $("#chat_messages").load("/api/user/support/get", function(responseText) {
            var regex = /\bhttps:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]/gi;
            var wrappedText = responseText.replace(regex, function(match) {
                return '<a style="text-decoration-style: bold; font-weight: bold; color: mediumblue; text-decoration-line: underline;" rel="noreferrer" target="_blank" href="' + match + '">' + match + '</a>';
            });
            var parser = document.createElement('div');
            parser.innerHTML = wrappedText;
            var supportAgentMeta = parser.querySelector('#support-agent-meta');
            if (supportAgentMeta) {
                updateSupportHeader(
                    supportAgentMeta.getAttribute('data-agent-name') || 'Support',
                    supportAgentMeta.getAttribute('data-agent-avatar') || ''
                );
                supportAgentMeta.remove();
            }
            $("#chat_messages").html(parser.innerHTML);
            hydrateSupportTimes(document.getElementById('chat_messages'));

            if (scroll) {
                var chatMessages = document.getElementById('chat_messages');
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });
    }

    $("#support_send").on('click', function(event) {
        event.preventDefault();

        const btn = $(this);
        if (btn.attr('disabled') === 'disabled') {
            return;
        }

        const message = $("#chat_input").val();
        const image = photo && photo.files && photo.files[0] ? photo.files[0] : 'undefined';

        if (image === 'undefined' && (message === " " || message.length < 1)) {
            noti(getMessage('support.message.is.empty'),  "error");
            return;
        }

        if (message && message.length > 2000) {
            noti(getMessage('support.message.length.limit'),  "error");
            return;
        }

        btn.addClass('send-disabled');
        btn.attr('disabled', 'disabled');

        const formData = new FormData();

        if (message && message !== " " && message.length > 0) {
            formData.append("message", message);
        }

        if (image !== 'undefined') {
            formData.append("image", image);
            resetFileUpload();
        }

        $.ajax({
            url: '/api/user/support/send',
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            type: 'POST',
            success: function (response) {
                btn.removeClass('send-disabled');
                btn.removeAttr('disabled');

                if (response === 'success') {
                    $("#chat_input").val('');
                    updateSupport();
                    setTimeout(function() {
                        var chatMessages = document.getElementById('chat_messages');
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }, 300);
                    return;
                }

                if (response === 'support_ban') {
                    errorPopup('SUPPORT');
                    return;
                }

                    noti(getMessage(response), 'error');
            }
        });
    });

    var uploadStatus = false;

    $("#support_link_photo").on('click', function(event) {
        if (uploadStatus) {
            resetFileUpload();
        } else {
            $("#support_photo_input").click();
        }
    });

    $("#support_photo_input").on('change', function(event) {
        if (!this.files || this.files.length === 0) {
            return;
        }

        const photoSize = this.files[0]['size'];

        if (photoSize > 10000000) {
            noti(getMessage('support.limit.image.size'), "error");
            event.preventDefault();
            return;
        }

        $("#support_link_photo").html(deletePhotoSvg);
        const span = $("#support_photo_size");
        span.css('display', 'block');
        span.text(formatBytes(photoSize, 2));
        uploadStatus = true;
    });

    $("#support_photo_input").on('click', function(event) {
        if (photo && photo.files && photo.files.length > 0) {
            noti(getMessage('support.limit.images.count'), "error");
            event.preventDefault();
        }
    });

    function resetFileUpload() {
        const input = $("#support_photo_input");
        input.wrap('<form>').closest('form').get(0).reset();
        input.unwrap();
        const span = $("#support_photo_size");
        span.css('display', 'none');
        span.text('');
        $("#support_link_photo").html(linkPhotoSvg);
        uploadStatus = false;
    }

    setInterval(() => {
        if (chatBox.style.display !== 'none') {
            updateSupport();
        }

        $.ajax({
            url: "/api/user/profile",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                action: "GET_UPDATES",
                path: window.location.pathname || "/"
            }),
            success: function (response) {
                const json = JSON.parse(response);

                const supportUnviewed = parseInt(json['support_unviewed']);

                if (chatBox.style.display === 'none' && supportUnviewed > 0) {
                    $(".support-unviewed").html('' + supportUnviewed);
                    $(".support-unviewed").css('display', '');
                } else if (supportUnviewed <= 0) {
                    $(".support-unviewed").css('display', 'none');
                }

                if (json['alert']) {
                    const type = json['alert']['type'];
                    const message = json['alert']['message'];

                    if (type === 'NOTIFICATION') {
                        noti(message, 'success');
                    } else if (type === 'ALERT') {
                        popup(getMessage('popup.alert.info.title'), message, resolveRuntimePath('/assets/img/info.svg'), 'success', true);
                    } else if (type === 'BONUS') {
                        popup(getMessage('popup.alert.bonus.title'), message, resolveRuntimePath('/assets/img/gift.svg'), 'success', true, function() {
                            location.reload();
                        });
                    }
                }
            }
        });
    }, 10000);

    restoreSupportWidgetWhenReady();
}
//end support
