(function () {
    var SUPPORTED_LANGS = ["en", "tr", "de", "es", "it", "fr", "pt", "zh", "zh-sg", "ja"];
    var AUTH_ROUTE_PREFIXES = ["/signup", "/signin", "/forgot-password"];
    var CAPTURED_ROUTE_PREFIXES = ["/profile", "/profile/wallet", "/profile/trading"];

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

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            if (document.querySelector('script[src="' + src + '"]')) {
                resolve();
                return;
            }

            var script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    function normalizeRoutePath(pathname) {
        var normalized = pathname || "/";
        if (normalized.charAt(0) !== "/") {
            normalized = "/" + normalized;
        }
        if (!/\/[^\/]+\.[a-z0-9]+$/i.test(normalized) && !normalized.endsWith("/")) {
            normalized += "/";
        }
        return normalized;
    }

    function routeToHtmlPath(routePath, rootFolder) {
        var cleanRoute = normalizeRoutePath(routePath);
        if (cleanRoute === "/") {
            return rootFolder + "/index.html";
        }
        return rootFolder + cleanRoute + "index.html";
    }

    function getSelectedLang() {
        try {
            var url = new URL(window.location.href);
            var lang = (url.searchParams.get("lang") || getCookie("lang") || "en").toLowerCase();
            return SUPPORTED_LANGS.indexOf(lang) !== -1 ? lang : "en";
        } catch (error) {
            return "en";
        }
    }

    function isAuthPage(routePath) {
        var cleanPath = normalizeRoutePath(routePath).replace(/\/$/, "");
        if (cleanPath === "") {
            return false;
        }
        return AUTH_ROUTE_PREFIXES.some(function (prefix) {
            return cleanPath === prefix || cleanPath.indexOf(prefix + "/") === 0;
        });
    }

    function isCapturedPage(routePath) {
        var cleanPath = normalizeRoutePath(routePath).replace(/\/$/, "");
        if (cleanPath === "") {
            return false;
        }
        return CAPTURED_ROUTE_PREFIXES.some(function (prefix) {
            return cleanPath === prefix || cleanPath.indexOf(prefix + "/") === 0;
        });
    }

    function isToolPage(routePath) {
        return normalizeRoutePath(routePath).indexOf("/tools/") === 0;
    }

    function isNotFoundPage(html) {
        return /class="container not-found-page"/i.test(html || "");
    }

    function looksLikeHomePage(html) {
        return /(150\+\s*(Cryptocurrencies|kripto para birimi)|Market Overview|Pazara Genel Bakış|150'den fazla kripto para birimi)/i.test(html || "");
    }

    function setDocumentLanguage(html, lang) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        if (doc.documentElement) {
            doc.documentElement.lang = lang;
            return "<!doctype html>\n" + doc.documentElement.outerHTML;
        }
        return html;
    }

    function normalizeLegacyAssetPaths(html) {
        if (!html) {
            return html;
        }

        var replacements = [
            { pattern: /(?:\.\/)?Buy(?:\s|&amp;|%20).*?_files\/account\.svg/gi, value: "/assets/img/profile/wallet.svg" },
            { pattern: /(?:\.\/)?Buy(?:\s|&amp;|%20).*?_files\/security\.svg/gi, value: "/assets/img/icon/security_1.svg" },
            { pattern: /(?:\.\/)?Buy(?:\s|&amp;|%20).*?_files\/verification\.svg/gi, value: "/assets/img/info.svg" },
            { pattern: /(?:\.\/)?Buy(?:\s|&amp;|%20).*?_files\/referral\.svg/gi, value: "/assets/img/gift.svg" },
            { pattern: /(?:\.\/)?Buy(?:\s|&amp;|%20).*?_files\/api\.svg/gi, value: "/assets/img/info.svg" },
            { pattern: /(?:\.\/)?Buy(?:\s|&amp;|%20).*?_files\/promocodes\.svg/gi, value: "/assets/img/gift.svg" },
            { pattern: /(?:\.\/)?Buy(?:\s|&amp;|%20).*?_files\/empty-list\.svg/gi, value: "/assets/img/empty-list.svg" },
            { pattern: /\/clean\/assets\/img\/cardReject\.svg/gi, value: "/assets/img/cardReject.svg" },
            { pattern: /\/clean\/assets\/img\/cardSuccess\.svg/gi, value: "/assets/img/cardSuccess.svg" },
            { pattern: /\/clean\/assets\/img\/cardNoVerified\.svg/gi, value: "/assets/img/cardNoVerified.svg" }
        ];

        return replacements.reduce(function (output, item) {
            return output.replace(item.pattern, item.value);
        }, html);
    }

    function mergeLocalizedPageContent(localizedHtml, originalHtml, lang) {
        var localizedDoc = new DOMParser().parseFromString(localizedHtml, "text/html");
        var originalDoc = new DOMParser().parseFromString(originalHtml, "text/html");
        var localizedMain = localizedDoc.querySelector('main#box.v-main') || localizedDoc.querySelector("main.v-main");
        var originalMain = originalDoc.querySelector('main#box.v-main') || originalDoc.querySelector("main.v-main");

        if (!localizedMain || !originalMain) {
            return originalHtml;
        }

        localizedMain.replaceWith(originalMain);

        var localizedBody = localizedDoc.body;
        var originalBody = originalDoc.body;
        if (localizedBody && originalBody) {
            localizedBody.querySelectorAll("script").forEach(function (node) {
                node.remove();
            });

            originalBody.querySelectorAll("script").forEach(function (node) {
                localizedBody.appendChild(node.cloneNode(true));
            });
        }

        if (localizedDoc.documentElement) {
            localizedDoc.documentElement.lang = lang;
        }
        return "<!doctype html>\n" + localizedDoc.documentElement.outerHTML;
    }

    function fetchText(url) {
        return fetch(url, { credentials: "same-origin", cache: "no-store" }).then(function (response) {
            if (!response.ok) {
                return null;
            }
            return response.text();
        });
    }

    function resolveDocumentForRoute(routePath, lang) {
        var prefix = window.CleanShell ? window.CleanShell.getSitePrefix() : "";
        var sourcePath = routeToHtmlPath(routePath, prefix + "/source");
        var localizedPath = routeToHtmlPath(routePath, prefix + "/localized/" + lang);
        var absoluteSourceUrl = new URL(sourcePath, window.location.origin).toString();
        var absoluteLocalizedUrl = new URL(localizedPath, window.location.origin).toString();
        var routeBaseUrl = new URL((prefix || "") + normalizeRoutePath(routePath), window.location.origin).toString();
        var toolPage = isToolPage(routePath);
        var useLocalized = lang !== "en" && !isAuthPage(routePath) && !isCapturedPage(routePath);

        return Promise.all([
            fetchText(sourcePath),
            useLocalized ? fetchText(localizedPath) : Promise.resolve(null)
        ]).then(function (responses) {
            var sourceHtml = normalizeLegacyAssetPaths(responses[0]);
            var localizedHtml = normalizeLegacyAssetPaths(responses[1]);

            if (!sourceHtml) {
                throw new Error("Failed to load source page: " + sourcePath);
            }

            if (useLocalized && localizedHtml) {
                if (isNotFoundPage(localizedHtml) || (normalizeRoutePath(routePath) !== "/" && looksLikeHomePage(localizedHtml))) {
                    return {
                        html: mergeLocalizedPageContent(localizedHtml, sourceHtml, lang),
                        sourceUrl: absoluteSourceUrl,
                        contentBaseUrl: routeBaseUrl
                    };
                }

                return {
                    html: localizedHtml,
                    sourceUrl: absoluteLocalizedUrl,
                    contentBaseUrl: routeBaseUrl
                };
            }

            return {
                html: sourceHtml,
                sourceUrl: absoluteSourceUrl,
                contentBaseUrl: routeBaseUrl
            };
        });
    }

    function loadCommonRuntime() {
        return loadScript(window.CleanShell.assetUrl("/assets/js/runtime-config.js?v=1")).catch(function () {
            return Promise.resolve();
        }).then(function () {
            return loadScript(window.CleanShell.assetUrl("/assets/js/site-shell.js?v=29"));
        }).then(function () {
            return loadScript(window.CleanShell.assetUrl("/assets/js/main.js?v=20"));
        });
    }

    function appendHeadAssets(doc, sourceUrl) {
        var head = document.head;
        doc.querySelectorAll('style, link[rel], script[src]').forEach(function (node) {
            if (node.tagName === "SCRIPT") {
                return;
            }

            if (node.tagName === "LINK") {
                var href = node.getAttribute("href") || "";
                var cssUrl = new URL(href, sourceUrl);
                var rewrittenHref = cssUrl.origin === window.location.origin
                    ? window.CleanShell.rewriteSiteUrl(cssUrl.pathname + cssUrl.search + cssUrl.hash)
                    : cssUrl.toString();
                if (head.querySelector('link[data-clean-href="' + rewrittenHref + '"]')) {
                    return;
                }

                var linkClone = node.cloneNode(true);
                linkClone.setAttribute("href", rewrittenHref);
                linkClone.setAttribute("data-clean-href", rewrittenHref);
                head.appendChild(linkClone);
                return;
            }

            head.appendChild(node.cloneNode(true));
        });
    }

    function executeScripts(doc, sourceUrl) {
        var scripts = Array.from(doc.querySelectorAll("script"));
        return scripts.reduce(function (chain, sourceScript) {
            return chain.then(function () {
                var src = sourceScript.getAttribute("src") || "";
                if (src) {
                    var normalizedSrc = src.toLowerCase();
                    if (
                        normalizedSrc.indexOf("/assets/js/site-shell.js") !== -1
                        || normalizedSrc.indexOf("/assets/js/main.js") !== -1
                        || normalizedSrc.indexOf("/assets/js/clean-shell.js") !== -1
                        || normalizedSrc.indexOf("/assets/js/clean-page.js") !== -1
                    ) {
                        return Promise.resolve();
                    }
                }
                if (window.CleanShell && window.CleanShell.isCommonScript(src)) {
                    return Promise.resolve();
                }

                return new Promise(function (resolve, reject) {
                    var script = document.createElement("script");
                    var placeholderId = sourceScript.getAttribute("data-clean-script-id");
                    Array.from(sourceScript.attributes).forEach(function (attr) {
                        if (attr.name === "data-clean-script-id") {
                            return;
                        }
                        if (attr.name === "src") {
                            var scriptUrl = new URL(attr.value, sourceUrl);
                            script.setAttribute(
                                "src",
                                scriptUrl.origin === window.location.origin
                                    ? window.CleanShell.rewriteSiteUrl(scriptUrl.pathname + scriptUrl.search + scriptUrl.hash)
                                    : scriptUrl.toString()
                            );
                        } else {
                            script.setAttribute(attr.name, attr.value);
                        }
                    });

                    if (!src) {
                        script.textContent = (sourceScript.textContent || "")
                            .replace(/(["'])\.\.\/assets\//g, "$1" + window.CleanShell.assetUrl("/assets/"))
                            .replace(/(["'])\/assets\//g, "$1" + window.CleanShell.assetUrl("/assets/"))
                            .replace(/(["'])\.\.\/fonts\//g, "$1" + window.CleanShell.assetUrl("/fonts/"))
                            .replace(/(["'])\/fonts\//g, "$1" + window.CleanShell.assetUrl("/fonts/"));
                        var inlinePlaceholder = placeholderId ? document.querySelector('[data-clean-script-placeholder="' + placeholderId + '"]') : null;
                        if (inlinePlaceholder) {
                            inlinePlaceholder.replaceWith(script);
                        } else {
                            document.body.appendChild(script);
                        }
                        resolve();
                        return;
                    }

                    if (sourceScript.textContent && sourceScript.textContent.trim()) {
                        script.textContent = sourceScript.textContent;
                    }

                    script.onload = resolve;
                    script.onerror = reject;
                    var placeholder = placeholderId ? document.querySelector('[data-clean-script-placeholder="' + placeholderId + '"]') : null;
                    if (placeholder) {
                        placeholder.replaceWith(script);
                    } else {
                        document.body.appendChild(script);
                    }
                });
            });
        }, Promise.resolve());
    }

    async function loadSourcePage() {
        var routePath = document.body.getAttribute("data-route") || "/";
        var lang = getSelectedLang();
        var result = await resolveDocumentForRoute(routePath, lang);
        var doc = new DOMParser().parseFromString(result.html, "text/html");
        if (doc.body) {
            doc.body.querySelectorAll("script").forEach(function (node, index) {
                node.setAttribute("data-clean-script-id", String(index));
            });
        }
        var sourceBody = doc.body ? doc.body.cloneNode(true) : null;

        document.title = doc.title || document.title;
        appendHeadAssets(doc, result.contentBaseUrl);

        if (sourceBody) {
            sourceBody.querySelectorAll("script").forEach(function (node) {
                var placeholder = document.createElement("div");
                placeholder.setAttribute("data-clean-script-placeholder", node.getAttribute("data-clean-script-id") || "");
                placeholder.hidden = true;
                node.replaceWith(placeholder);
            });

            Array.from(doc.body.attributes).forEach(function (attr) {
                if (attr.name === "data-route" || attr.name === "data-source") {
                    return;
                }
                document.body.setAttribute(attr.name, attr.value);
            });

            document.body.innerHTML = sourceBody.innerHTML;
            if (window.CleanShell) {
                window.CleanShell.rewriteNodeUrls(document.body, result.contentBaseUrl);
            }
        }

        await loadCommonRuntime();
        await executeScripts(doc, result.contentBaseUrl);

        if (window.WixiShell) {
            window.WixiShell.applyCurrentLangToLinks();
            window.WixiShell.patchOnclickAttributes();
            window.WixiShell.refresh();
            window.WixiShell.updateBalances();
        }
    }

    document.addEventListener("clean:shell-ready", function () {
        loadSourcePage().catch(console.error);
    });
})();



