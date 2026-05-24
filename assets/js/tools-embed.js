(function() {
    function hasRenderedWidget(container) {
        if (!container) {
            return false;
        }

        if (container.querySelector("iframe, canvas, table, svg")) {
            return true;
        }

        const text = (container.textContent || "").trim();
        return text.length > 0;
    }

    function findWarning(container) {
        return container.querySelector(".tool-embed-warning");
    }

    function showEmbedWarning(container) {
        if (findWarning(container)) {
            return;
        }

        const warning = document.createElement("div");
        warning.className = "tool-embed-warning";
        warning.innerHTML = [
            "<strong>Widget failed to load.</strong>",
            "Check VPS/Caddy hosting rules for third-party embeds.",
            "Allow scripts, frames, styles, fonts, and network access for TradingView, jQuery, Google Fonts, and Binance."
        ].join(" ");

        container.appendChild(warning);
    }

    function hideEmbedWarning(container) {
        const warning = findWarning(container);
        if (warning) {
            warning.remove();
        }
    }

    function inspectEmbeds(forceWarning) {
        const widgets = document.querySelectorAll(".tradingview-widget-container");
        if (widgets.length === 0) {
            return;
        }

        widgets.forEach(function(widget) {
            const target = widget.querySelector(".tradingview-widget-container__widget");
            if (!target) {
                return;
            }

            if (hasRenderedWidget(target)) {
                hideEmbedWarning(widget);
                return;
            }

            if (forceWarning) {
                showEmbedWarning(widget);
            }
        });
    }

    function injectStyles() {
        const style = document.createElement("style");
        style.textContent = [
            ".tool-embed-warning {",
            "  margin-top: 12px;",
            "  padding: 14px 16px;",
            "  border-radius: 12px;",
            "  background: rgba(255, 192, 20, 0.12);",
            "  border: 1px solid rgba(255, 192, 20, 0.28);",
            "  color: #5b4700;",
            "  font-size: 14px;",
            "  line-height: 1.5;",
            "}",
            ".tool-embed-warning strong {",
            "  color: #2f2500;",
            "}"
        ].join("\n");
        document.head.appendChild(style);
    }

    document.addEventListener("DOMContentLoaded", function() {
        injectStyles();

        const checkpoints = [2500, 6000, 10000, 15000];
        checkpoints.forEach(function(delay, index) {
            setTimeout(function() {
                inspectEmbeds(index === checkpoints.length - 1);
            }, delay);
        });

        const observer = new MutationObserver(function() {
            inspectEmbeds(false);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
})();
