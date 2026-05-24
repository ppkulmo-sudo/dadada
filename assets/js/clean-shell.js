(function () {
    var SITE_PREFIX = "";
    var COMMON_SCRIPT_PATTERNS = [
        /\/assets\/js\/site-shell\.js/i,
        /\/assets\/js\/main\.js/i,
        /\/assets\/js\/noti\.js/i,
        /\/assets\/js\/history-captured\.js/i,
        /\/assets\/js\/tools-embed\.js/i
    ];

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

    function hasFileExtension(pathname) {
        return /\/[^\/]+\.[a-z0-9]+$/i.test(pathname || "");
    }

    function normalizeRoutePath(pathname) {
        var normalized = pathname || "/";
        if (normalized.charAt(0) !== "/") {
            normalized = "/" + normalized;
        }
        if (!hasFileExtension(normalized) && !normalized.endsWith("/")) {
            normalized += "/";
        }
        return normalized;
    }

    function detectSitePrefix() {
        var body = document.body;
        var route = body ? body.getAttribute("data-route") : "";
        if (!route) {
            return "";
        }

        var currentPath = normalizeRoutePath(window.location.pathname);
        var routePath = normalizeRoutePath(route);
        if (currentPath === routePath) {
            return "";
        }

        if (currentPath.length > routePath.length && currentPath.slice(-routePath.length) === routePath) {
            return normalizePrefix(currentPath.slice(0, currentPath.length - routePath.length));
        }

        return "";
    }

    function assetUrl(rawUrl) {
        if (!rawUrl) {
            return rawUrl;
        }

        if (/^https?:\/\//i.test(rawUrl) || rawUrl.indexOf("//") === 0 || rawUrl.indexOf("mailto:") === 0 || rawUrl.indexOf("tel:") === 0 || rawUrl.indexOf("#") === 0) {
            return rawUrl;
        }

        var cleanPath = String(rawUrl);
        if (cleanPath.charAt(0) !== "/") {
            cleanPath = "/" + cleanPath;
        }

        if (cleanPath.indexOf("/clean/assets/") === 0) {
            cleanPath = cleanPath.substring("/clean".length);
        } else if (cleanPath.indexOf("/clean/fonts/") === 0) {
            cleanPath = cleanPath.substring("/clean".length);
        } else if (/_files\/empty-list\.svg$/i.test(cleanPath)) {
            cleanPath = "/assets/img/empty-list.svg";
        } else if (/_files\/account\.svg$/i.test(cleanPath)) {
            cleanPath = "/assets/img/profile/wallet.svg";
        } else if (/_files\/security\.svg$/i.test(cleanPath)) {
            cleanPath = "/assets/img/icon/security_1.svg";
        } else if (/_files\/verification\.svg$/i.test(cleanPath)) {
            cleanPath = "/assets/img/info.svg";
        } else if (/_files\/referral\.svg$/i.test(cleanPath)) {
            cleanPath = "/assets/img/gift.svg";
        } else if (/_files\/api\.svg$/i.test(cleanPath)) {
            cleanPath = "/assets/img/info.svg";
        } else if (/_files\/promocodes\.svg$/i.test(cleanPath)) {
            cleanPath = "/assets/img/gift.svg";
        }

        if (SITE_PREFIX && (cleanPath === SITE_PREFIX || cleanPath.indexOf(SITE_PREFIX + "/") === 0)) {
            return cleanPath;
        }

        if (cleanPath.indexOf("/assets/") === 0 || cleanPath.indexOf("/fonts/") === 0) {
            return (SITE_PREFIX || "") + cleanPath;
        }

        return cleanPath;
    }

    function isStaticPath(pathname) {
        var normalized = pathname || "";
        return normalized.indexOf("/api/") === 0
            || normalized.indexOf("/cdn-cgi/") === 0
            || normalized.indexOf("/assets/") === 0
            || normalized.indexOf("/fonts/") === 0
            || normalized.indexOf("/clean/assets/") === 0
            || normalized.indexOf("/clean/fonts/") === 0
            || (SITE_PREFIX && (normalized.indexOf(SITE_PREFIX + "/assets/") === 0 || normalized.indexOf(SITE_PREFIX + "/fonts/") === 0));
    }

    function rewriteSiteUrl(rawUrl) {
        if (!rawUrl) {
            return rawUrl;
        }

        if (rawUrl.charAt && rawUrl.charAt(0) === "?") {
            return window.location.pathname + rawUrl;
        }

        if (/^https?:\/\//i.test(rawUrl) || rawUrl.indexOf("//") === 0 || rawUrl.indexOf("mailto:") === 0 || rawUrl.indexOf("tel:") === 0 || rawUrl.indexOf("#") === 0) {
            return rawUrl;
        }

        var url = new URL(rawUrl, window.location.origin);
        var managedExternal = /(^|\.)nohex.exchange\.com$/i.test(url.hostname);
        if (url.origin !== window.location.origin && !managedExternal) {
            return rawUrl;
        }

        if (isStaticPath(url.pathname)) {
            if (url.pathname.indexOf("/api/") === 0 || url.pathname.indexOf("/cdn-cgi/") === 0) {
                return url.pathname + url.search + url.hash;
            }
            return assetUrl(url.pathname) + url.search + url.hash;
        }

        if (SITE_PREFIX && (url.pathname === SITE_PREFIX || url.pathname.indexOf(SITE_PREFIX + "/") === 0)) {
            return url.pathname + url.search + url.hash;
        }

        return (SITE_PREFIX || "") + url.pathname + url.search + url.hash;
    }

    function rewriteNodeUrls(root, baseUrl) {
        function rewriteInlineUrl(rawUrl) {
            if (!rawUrl) {
                return rawUrl;
            }
            try {
                var resolved = new URL(rawUrl, baseUrl || window.location.href);
                if (resolved.origin !== window.location.origin) {
                    return rawUrl;
                }
                return rewriteSiteUrl(resolved.pathname + resolved.search + resolved.hash);
            } catch (error) {
                return rawUrl;
            }
        }

        root.querySelectorAll("[href]").forEach(function (node) {
            var href = node.getAttribute("href");
            if (!href) {
                return;
            }
            var resolved = baseUrl ? new URL(href, baseUrl).pathname + new URL(href, baseUrl).search + new URL(href, baseUrl).hash : href;
            node.setAttribute("href", rewriteSiteUrl(resolved));
        });

        root.querySelectorAll("[src]").forEach(function (node) {
            var src = node.getAttribute("src");
            if (!src) {
                return;
            }
            var resolvedSrc = new URL(src, baseUrl || window.location.origin);
            if (resolvedSrc.origin === window.location.origin) {
                node.setAttribute("src", rewriteSiteUrl(resolvedSrc.pathname + resolvedSrc.search + resolvedSrc.hash));
            }
        });

        root.querySelectorAll("[action]").forEach(function (node) {
            var action = node.getAttribute("action");
            if (!action) {
                return;
            }
            var resolvedAction = new URL(action, baseUrl || window.location.origin);
            if (resolvedAction.origin === window.location.origin) {
                node.setAttribute("action", rewriteSiteUrl(resolvedAction.pathname + resolvedAction.search + resolvedAction.hash));
            }
        });

        root.querySelectorAll("[onclick]").forEach(function (node) {
            var onclick = node.getAttribute("onclick");
            if (!onclick) {
                return;
            }

            var updated = onclick.replace(/(['"])([^'"]+)\1/g, function (_match, quote, path) {
                var isUrlLike = /^(\.\.?\/|\/)/.test(path) || path.indexOf("?") !== -1 || path.indexOf("#") !== -1 || path.indexOf(".html") !== -1;
                if (!path || !isUrlLike || /^https?:\/\//i.test(path) || path.indexOf("//") === 0 || path.indexOf("mailto:") === 0 || path.indexOf("tel:") === 0 || path.indexOf("#") === 0 || path.indexOf("javascript:") === 0) {
                    return quote + path + quote;
                }
                return quote + rewriteInlineUrl(path) + quote;
            });
            node.setAttribute("onclick", updated);
        });
    }

    function isCommonScript(src) {
        return COMMON_SCRIPT_PATTERNS.some(function (pattern) {
            return pattern.test(src || "");
        });
    }

    window.CleanShell = {
        assetUrl: assetUrl,
        rewriteSiteUrl: rewriteSiteUrl,
        rewriteNodeUrls: rewriteNodeUrls,
        isCommonScript: isCommonScript,
        getSitePrefix: function () {
            return SITE_PREFIX;
        }
    };

    async function boot() {
        SITE_PREFIX = detectSitePrefix();
        window.__SITE_PREFIX__ = SITE_PREFIX;
        document.dispatchEvent(new CustomEvent("clean:shell-ready"));
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            boot().catch(console.error);
        });
    } else {
        boot().catch(console.error);
    }
})();
