(function () {
    var TEXT_MAP = {
        "Trading": "header.trading.title",
        "Futures": "header.futures.title",
        "Tools": "header.tools.title",
        "Earn": "header.earn.title",
        "Buy Crypto": "footer.buy.crypto.title",
        "Documentation": "header.docs.title",
        "Our card": "header.card.title",
        "Assets": "cryptolending.plans.assets",
        "History": "profile.history.btn",
        "Order Book": "trading.order.book",
        "Trades": "profile.history.btn",
        "Price (USDT)": "trading.price.usdt",
        "Size (BTC)": "trading.size.btc",
        "Total (USDT)": "trading.total.usdt",
        "Search": "common.search",
        "Currency": "common.currency",
        "Last": "trading.last",
        "Change": "common.change",
        "24h Change": "trading.24h.change",
        "24h High": "trading.24h.high",
        "24h Low": "trading.24h.low",
        "24h Volume (BTC)": "trading.24h.volume.btc",
        "24h Volume (USDT)": "trading.24h.volume.usdt",
        "Limit": "trading.limit",
        "Market": "trading.market",
        "Trigger Order": "trading.trigger.order",
        "Available:": "trading.available",
        "Market Price": "trading.market.price",
        "Amount": "common.amount",
        "No Records": "common.no.records"
    };

    function hasLocale() {
        return typeof window.locale === "object" && window.locale !== null && typeof window.getMessage === "function";
    }

    function resolveMessage(key, fallback) {
        if (!key) {
            return fallback || "";
        }
        if (hasLocale() && Object.prototype.hasOwnProperty.call(window.locale, key) && window.locale[key]) {
            return window.getMessage(key);
        }
        return fallback || key;
    }

    function setTextNodeValue(node, value) {
        var source = node.nodeValue;
        var leading = source.match(/^\s*/);
        var trailing = source.match(/\s*$/);
        node.nodeValue = (leading ? leading[0] : "") + value + (trailing ? trailing[0] : "");
    }

    function translateExactTextNodes(root) {
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        var nodes = [];
        var current;

        while ((current = walker.nextNode())) {
            nodes.push(current);
        }

        nodes.forEach(function (node) {
            if (!node.parentElement) {
                return;
            }

            var tag = node.parentElement.tagName;
            if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEXTAREA") {
                return;
            }

            var trimmed = node.nodeValue.trim();
            if (!trimmed || !Object.prototype.hasOwnProperty.call(TEXT_MAP, trimmed)) {
                return;
            }

            var translated = resolveMessage(TEXT_MAP[trimmed], trimmed);
            if (!translated || translated === trimmed) {
                return;
            }

            setTextNodeValue(node, translated);
        });
    }

    function translatePlaceholders() {
        var search = document.getElementById("search_pairs");
        if (search) {
            search.setAttribute("placeholder", resolveMessage("common.search", search.getAttribute("placeholder") || "Search"));
        }
    }

    function applyTradingTranslations() {
        translateExactTextNodes(document.body);
        translatePlaceholders();
    }

    function startWhenReady() {
        var attempts = 0;

        function tick() {
            attempts += 1;

            if (hasLocale()) {
                applyTradingTranslations();
                return;
            }

            if (attempts < 200) {
                window.setTimeout(tick, 50);
            }
        }

        tick();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startWhenReady);
    } else {
        startWhenReady();
    }
})();
