(function () {
    var TEXT_MAP = {
        "Trading": "header.trading.title",
        "Futures": "header.futures.title",
        "Tools": "header.tools.title",
        "Earn": "header.earn.title",
        "Buy Crypto": "footer.buy.crypto.title",
        "Documentation": "header.docs.title",
        "Our card": "header.card.title",
        "Markets": "header.trading.markets.title",
        "View the latest crypto prices and volume": "header.trading.markets.description",
        "Swap": "header.trading.swap.title",
        "Quick conversion, zero tr ading fees, no slippage": "header.trading.swap.description",
        "Spot": "header.trading.spot.title",
        "Buy and sell crypto with ease": "header.trading.spot.description",
        "Margin": "header.trading.marginal.title",
        "Trade with leverage": "header.trading.marginal.description",
        "Tournament": "header.trading.tournament.title",
        "Increase your trading volume with our Trading Tournament": "header.trading.tournament.description",
        "USDT Perpetuals": "header.futures.trading.title",
        "Trade perpetual contracts, settled in USDT": "header.futures.trading.description",
        "Market Cap": "header.tools.market.cap.title",
        "An indicator that reflects the total value of all coins of a certain cryptocurrency on the market": "header.tools.market.cap.description",
        "Market Screener": "header.tools.market.screener.title",
        "A tool that allows you to filter and track different cryptocurrencies based on multiple criteria": "header.tools.market.screener.description",
        "Cross Rates": "header.tools.cross.rates.title",
        "Exchange rates between two currencies expressed through a third currency": "header.tools.cross.rates.description",
        "Currency Heat map": "header.tools.currency.heat.map.title",
        "A visual tool that displays price changes of different cryptocurrencies against each other in the form of a colored map": "header.tools.currency.heat.map.description",
        "Technical Analysis": "header.tools.technical.analysis.title",
        "A method for predicting future price movements of cryptocurrencies based on analysis of past market data": "header.tools.technical.analysis.description",
        "Staking": "header.earn.staking.title",
        "Easily stake your coins in PoS by voting and reap rewards": "header.earn.staking.description",
        "Crypto Lending": "header.earn.cryptolending.title",
        "Earn passive income with digital currencies": "header.earn.cryptolending.description",
        "Fiat Deposit": "header.card.buy.title",
        "Buy crypto within seconds via Bank Transfer or Bank Card": "header.card.buy.description",
        "User Agreement": "header.docs.user.agreement.title",
        "The User Agreement defines the terms of service, user rights, and obligations of both parties.": "header.docs.user.agreement.description",
        "AML Policy": "header.docs.aml.title",
        "Policy on combating money laundering, countering the financing of terrorism": "header.docs.aml.description",
        "Privacy Policy": "header.docs.privacy.policy.title",
        "The Privacy Policy governs the information collection, use, processing, storage and disclosure practices of the platform": "header.docs.privacy.policy.description",
        "Assets": "cryptolending.plans.assets",
        "Assets Overview": function () {
            return combine("cryptolending.plans.assets", "header.card.card.title");
        },
        "Overview": "header.card.card.title",
        "Deposit": "profile.deposit.btn",
        "Withdraw": "profile.withdraw.btn",
        "Transfer": "profile.transfer.btn",
        "History": "profile.history.btn",
        "Overall Balance": "profile.total.balance",
        "*Data may be delayed.": "header.profile.data.delayed",
        "Main": "profile.table.main",
        "Collateral": "profile.table.collateral",
        "All transactions": "history.transactions.all",
        "All Transactions": "history.transactions.all",
        "Deposits": "history.transactions.deposit",
        "Withdrawals": "history.transactions.withdraw",
        "Transfers": "history.transactions.transfer",
        "Earnings": "history.transactions.earning",
        "Wallet": "header.profile.wallet",
        "Settings": "settings.menu.account.settings",
        "Security": "header.profile.security",
        "Identity Verification": "header.profile.identity.verification",
        "Promo codes": "promocodes.title",
        "Referral program": "header.profile.referral",
        "API Management": "api.management.title",
        "Mobile app": "header.profile.mobile.app",
        "Unverified": "settings.verification.unverified",
        "Verified": "settings.verification.verified",
        "Live support": "support.button",
        "Customer support": "support.customer.support",
        "Support": "footer.support.title",
        "Products": "footer.products.title",
        "About Us": "footer.about.us.title",
        "Verify Official Channels": "footer.resource.verification.title",
        "Fees": "footer.fees.title",
        "Bug Bounty": "footer.bug.bounty.title",
        "Corporate Identity": "footer.corporate.identity.title",
        "Institutional Services": "footer.institutional.services.title",
        "Referral Program": "footer.referral.title",
        "Token Listing": "footer.token.listing.title",
        "Legal & Disclosures": "footer.privacy.title",
        "Cookies Policy": "footer.cookies.policy.title",
        "Risk Disclosure Statement": "footer.risk.title",
        "Special Treatment": "footer.treatment.title",
        "Regulatory License": "footer.regulatory.title",
        "Law Enforcement Requests": "footer.law.title",
        "Install our mobile app": "mobile.app.instruction",
        "Select the \"Settings\" button from the browser menu": "mobile.app.instruction.1",
        "Select \"Install Application\"": "mobile.app.instruction.2",
        "Thanks": "mobile.app.thanks"
    };

    function hasLocale() {
        return typeof window.locale === "object" && window.locale !== null && typeof window.getMessage === "function";
    }

    function resolveMessage(key, replacers, fallback) {
        if (!key) {
            return fallback || "";
        }

        if (hasLocale() && Object.prototype.hasOwnProperty.call(window.locale, key) && window.locale[key]) {
            if (typeof replacers === "undefined") {
                return window.getMessage(key);
            }

            return window.getMessage(key, replacers);
        }

        return fallback || key;
    }

    function combine(leftKey, rightKey) {
        var left = resolveMessage(leftKey, null, "");
        var right = resolveMessage(rightKey, null, "");
        return (left + " " + right).trim();
    }

    function translateText(text) {
        var entry = TEXT_MAP[text];
        if (!entry) {
            return null;
        }

        if (typeof entry === "function") {
            return entry();
        }

        return resolveMessage(entry, null, text);
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
            if (!trimmed) {
                return;
            }

            var translated = translateText(trimmed);
            if (!translated || translated === trimmed) {
                return;
            }

            setTextNodeValue(node, translated);
        });
    }

    function applyAttributes() {
        var supportInput = document.getElementById("chat_input");
        if (supportInput) {
            supportInput.setAttribute(
                "placeholder",
                resolveMessage("support.textarea.placeholder", null, supportInput.getAttribute("placeholder") || "")
            );
        }

        var footerBottom = document.querySelector(".footer-bottom p");
        if (footerBottom) {
            footerBottom.textContent = resolveMessage(
                "footer.all.rights.reserved",
                ["NOHEX"],
                footerBottom.textContent
            );
        }

        var appTitle = document.querySelector(".app-modal__title");
        if (appTitle) {
            appTitle.textContent = resolveMessage("mobile.app.title", ["NOHEX"], appTitle.textContent);
        }

        var appDescription = document.querySelector(".app-modal__description-body");
        if (appDescription) {
            appDescription.textContent = resolveMessage(
                "mobile.app.description",
                ["NOHEX"],
                appDescription.textContent
            );
        }
    }

    function replaceSelectorText(selector, expectedText, key, replacers) {
        document.querySelectorAll(selector).forEach(function (element) {
            if (element.textContent.trim() !== expectedText) {
                return;
            }

            element.textContent = resolveMessage(key, replacers, element.textContent.trim());
        });
    }

    function applyWalletTranslations() {
        translateExactTextNodes(document.body);
        applyAttributes();
        replaceSelectorText(".panel__content__balances__title", "Trading", "profile.table.trading");
    }

    function startWhenReady() {
        var attempts = 0;

        function tick() {
            attempts += 1;

            if (hasLocale()) {
                applyWalletTranslations();
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
