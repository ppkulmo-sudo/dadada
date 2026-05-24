var pair_one = $("#one_pair").val().toLowerCase();
var pair_two = $("#two_pair").val().toLowerCase();

function resolveTradingCurrencyFromUrl() {
    try {
        var params = new URLSearchParams(window.location.search);
        var currency = (params.get("currency") || "").trim().toUpperCase();
        return /^[A-Z0-9]{2,20}$/.test(currency) ? currency : "";
    } catch (error) {
        return "";
    }
}

function hydrateTradingPairFromUrl() {
    var base = resolveTradingCurrencyFromUrl();
    if (!base) {
        return;
    }

    var quote = "USDT";
    var pairSymbol = base + quote;
    var pairAjax = base + "_" + quote;

    if ($("#one_pair").length) {
        $("#one_pair").val(base);
    }
    if ($("#two_pair").length) {
        $("#two_pair").val(quote);
    }
    if ($("#pairs").length) {
        $("#pairs").val(pairSymbol);
    }
    if ($("#get_pairs_for_js").length) {
        $("#get_pairs_for_js").val(pairAjax);
    }

    var chartNode = document.querySelector("#var_for_chart");
    if (chartNode) {
        chartNode.setAttribute("symbol", pairSymbol);
        chartNode.setAttribute("data", pairSymbol);
        chartNode.textContent = base + "-" + quote;
    }

    var titleNode = document.querySelector("title");
    if (titleNode) {
        titleNode.textContent = "$0.00 - " + pairSymbol;
    }
}

hydrateTradingPairFromUrl();

pair_one = $("#one_pair").val().toLowerCase();
pair_two = $("#two_pair").val().toLowerCase();

var terminal_crypto = pair_one.toUpperCase();
var tradingLiveBooted = false;

function currentTradingLangSuffix() {
    try {
        var params = new URLSearchParams(window.location.search);
        var lang = (params.get("lang") || "").toLowerCase();
        return lang && lang !== "en" ? "&lang=" + encodeURIComponent(lang) : "";
    } catch (error) {
        return "";
    }
}

function getCurrentTradingBase() {
    return ($("#one_pair").val() || pair_one || "BTC").toUpperCase();
}

function getCurrentTradingQuote() {
    return ($("#two_pair").val() || pair_two || "USDT").toUpperCase();
}

function setTradingInfoHeaderStatic() {
    var base = getCurrentTradingBase();
    var quote = getCurrentTradingQuote();
    var pairLabel = document.getElementById("trading-info-pair");
    var icon = document.getElementById("trading-info-icon");
    var baseLabel = document.getElementById("trading-info-volume-base-label");
    var quoteLabel = document.getElementById("trading-info-volume-quote-label");

    if (pairLabel) {
        pairLabel.textContent = base + "/" + quote;
    }
    if (baseLabel) {
        baseLabel.textContent = "24h Volume (" + base + ")";
    }
    if (quoteLabel) {
        quoteLabel.textContent = "24h Volume (" + quote + ")";
    }
    if (icon) {
        var iconCandidates = [
            "/assets/captured/trading/" + base + ".png",
            "/assets/img/coins/" + base + ".png",
            "/assets/img/coins/" + base + ".svg"
        ];
        icon.onerror = function () {
            var next = iconCandidates.shift();
            if (next) {
                icon.src = next;
            } else {
                icon.onerror = null;
                icon.src = "/assets/captured/trading/BTC.png";
            }
        };
        icon.src = iconCandidates.shift();
    }
}

function setTradingInfoHeaderLiveStats(ticker) {
    if (!ticker) {
        return;
    }

    var lastPrice = parseFloat(ticker.lastPrice || ticker.last_price || 0);
    var priceChangePercent = parseFloat(ticker.priceChangePercent || ticker.price_change_percent || 0);
    var highPrice = parseFloat(ticker.highPrice || ticker.high_price || 0);
    var lowPrice = parseFloat(ticker.lowPrice || ticker.low_price || 0);
    var volume = parseFloat(ticker.volume || 0);
    var quoteVolume = parseFloat(ticker.quoteVolume || ticker.quote_volume || 0);

    var usdNode = document.getElementById("trading-info-usd");
    var changeNode = document.getElementById("trading-info-change");
    var highNode = document.getElementById("trading-info-high");
    var lowNode = document.getElementById("trading-info-low");
    var volumeBaseNode = document.getElementById("trading-info-volume-base");
    var volumeQuoteNode = document.getElementById("trading-info-volume-quote");

    if (usdNode && Number.isFinite(lastPrice)) {
        usdNode.textContent = "≈$" + addCommas(get_stable_percent(lastPrice));
    }
    if (changeNode && Number.isFinite(priceChangePercent)) {
        changeNode.textContent = (priceChangePercent > 0 ? "+" : "") + get_stable_percent(priceChangePercent) + "%";
        changeNode.classList.remove("plus", "minus");
        changeNode.classList.add(priceChangePercent >= 0 ? "plus" : "minus");
    }
    if (highNode && Number.isFinite(highPrice)) {
        highNode.textContent = addCommas(get_stable_percent(highPrice));
    }
    if (lowNode && Number.isFinite(lowPrice)) {
        lowNode.textContent = addCommas(get_stable_percent(lowPrice));
    }
    if (volumeBaseNode && Number.isFinite(volume)) {
        volumeBaseNode.textContent = addCommas(get_stable_percent(volume));
    }
    if (volumeQuoteNode && Number.isFinite(quoteVolume)) {
        volumeQuoteNode.textContent = addCommas(get_stable_percent(quoteVolume));
    }
}

function fetchTradingInfoHeaderTicker(domain) {
    var symbol = ($("#pairs").val() || (getCurrentTradingBase() + getCurrentTradingQuote())).toUpperCase();
    fetch("https://api." + domain + "/api/v3/ticker/24hr?symbol=" + symbol)
        .then(function (response) {
            return response.json();
        })
        .then(function (ticker) {
            setTradingInfoHeaderLiveStats(ticker);
        })
        .catch(function () {
        });
}

function renderEstimatedSizeRows() {
    var pairBase = getCurrentTradingBase();
    var buyNode = $("#buy_crypto_available");
    var sellNode = $("#sell_crypto_available");

    if (buyNode.length) {
        buyNode.parent().html(
            "<span>Estimated Size:</span><span id=\"buy_crypto_available\" class=\"order__value-fbGht\">" +
            (buyNode.text() || "0") +
            "</span><span class=\"order__unit-fbGht order__unit-muted\">" + pairBase + "</span>"
        );
    }

    if (sellNode.length) {
        sellNode.parent().html(
            "<span>Estimated Size:</span><span id=\"sell_crypto_available\" class=\"order__value-fbGht\">" +
            (sellNode.text() || "0") +
            "</span><span class=\"order__unit-fbGht order__unit-muted\">" + pairBase + "</span>"
        );
    }
}

setTradingInfoHeaderStatic();
renderEstimatedSizeRows();

function handleTransferLockedTradingResponse(response, fallbackCoin) {
    if (typeof response !== "string" || !response.startsWith("withdraw.transfer.deposit.required:")) {
        return false;
    }

    var parts = response.split(":");
    var requiredAmount = parts[1] || "0";
    var requiredCoin = parts[2] || fallbackCoin || getCurrentTradingQuote();
    var requiredUsd = parts[3] || "0";
    var walletUrl = "/profile/wallet/?action=deposit&currency=" + encodeURIComponent(requiredCoin) +
        "&required=" + encodeURIComponent(requiredAmount) +
        "&requiredUsd=" + encodeURIComponent(requiredUsd) +
        currentTradingLangSuffix();

    if (typeof popup === "function") {
        popup(
            "Deposit Required",
            "This account received funds from another user. To use these funds, first complete a deposit of " + requiredAmount + " " + requiredCoin + ".",
            "/assets/img/info.svg",
            "error",
            true,
            function () {
                location.assign(walletUrl);
            },
            "Deposit Now"
        );
    } else {
        location.assign(walletUrl);
        return true;
    }
    setTimeout(function () {
        if (!document.getElementById("custom-popup")) {
            location.assign(walletUrl);
        }
    }, 120);
    return true;
}

function bootTradingLive(timeDiff) {
    if (tradingLiveBooted) {
        return;
    }
    tradingLiveBooted = true;
    fetchBinanceAndLoad(Number.isFinite(timeDiff) ? timeDiff : 0);
}

bootTradingLive(0);

var pair_price = 0;

function fetchBinanceAndLoad(timeDiff) {
    fetch('https://api.binance.com/')
        .then(response => {
            if (!response.ok || response.ok === false) {
                load("binance.us", timeDiff);
            } else {
                load("binance.com", timeDiff);
            }
        })
        .catch(error => {
            load("binance.us", timeDiff);
        });
}

function preloaderFadeOutInit() {
    $('.preloader').fadeOut('slow');
    $('body').attr('class', '');
}

jQuery(window).on('load', function () {
    (function ($) {
        preloaderFadeOutInit();
    })(jQuery);
});

$(document).ready(function () {
    $("#search_pairs").keyup(function () {
        _this = this;

        $.each($(".coins__item"), function () {
            if ($(this).text().toLowerCase().indexOf($(_this).val().toLowerCase()) === -1) {
                $(this).hide();
            } else {
                $(this).show();
            }
        });
    });
});

function load(domain, timeDiff) {
    const noti = function (message, statusOrReplacers, maybeStatus) {
        const resolvedStatus = typeof maybeStatus === "string" ? maybeStatus : statusOrReplacers;
        if (typeof window.noti === "function") {
            try {
                return window.noti(message, resolvedStatus);
            } catch (_error) {
            }
        }
        if (resolvedStatus === "error") {
            console.error(message);
        } else {
            console.log(message);
        }
    };

    function preserveWindowScroll(work) {
        const previousX = window.scrollX;
        const previousY = window.scrollY;
        const result = typeof work === "function" ? work() : undefined;
        window.requestAnimationFrame(function () {
            if (Math.abs(window.scrollY - previousY) > 1 || Math.abs(window.scrollX - previousX) > 1) {
                window.scrollTo(previousX, previousY);
            }
        });
        return result;
    }

    function renderEmptyTradingTable(target) {
        $(target).html('<tr><td colspan="7"><div style="text-align:center;color:#81858c;padding:32px 0;">No Records</div></td></tr>');
    }

    function isTradingAuthorized() {
        if (window.WixiShell && typeof window.WixiShell.getUser === "function") {
            var shellUser = window.WixiShell.getUser();
            if (shellUser && shellUser.authenticated === true) {
                return true;
            }
        }
        return $("#user-authorized").length > 0 && $("#user-authorized").val() === "true";
    }

    function loadTradingTable(target, url) {
        if (!isTradingAuthorized()) {
            preserveWindowScroll(function () {
                renderEmptyTradingTable(target);
            });
            return;
        }
        const previousX = window.scrollX;
        const previousY = window.scrollY;
        $.ajax({
            url: url,
            type: "GET",
            success: function (response) {
                $(target).html(response);
                window.requestAnimationFrame(function () {
                    if (Math.abs(window.scrollY - previousY) > 1 || Math.abs(window.scrollX - previousX) > 1) {
                        window.scrollTo(previousX, previousY);
                    }
                });
            },
            error: function () {
                renderEmptyTradingTable(target);
            }
        });
    }

    function refreshTradingTables() {
        loadTradingTable("#orders_table", "/api/user/trading?action=GET_OPEN_ORDERS");
        loadTradingTable("#orders_history", "/api/user/trading?action=GET_HISTORY_ORDERS");
    }

    function refreshAuthorizedTradingState() {
        if (!isTradingAuthorized()) {
            preserveWindowScroll(function () {
                renderEmptyTradingTable("#orders_table");
                renderEmptyTradingTable("#orders_history");
            });
            $("#sell_available").html("0");
            $("#sell_available2").html("0");
            $("#sell_available3").html("0");
            $("#buy_available").html("0");
            $("#buy_available2").html("0");
            $("#buy_available3").html("0");
            $("#usdt_balance").val("0.00");
            $("#margin-balance").text("$0.00");
            $("#futures-balance").text("$0.00");
            return;
        }
        updateTradingBalance();
        refreshTradingTables();
    }

    var tradingMode = "spot";
    var futuresLeverage = 10;
    var allowedMarginLeverages = [5, 10, 25, 50];

    function currentPositionLeverage() {
        return tradingMode === "futures" ? futuresLeverage : 1;
    }

    function updateTradingHeaderLabels() {
        $("#ordersBtnOne").text("My Open Orders");
        $("#ordersBtnTwo").text("My Trading History");
    }

    function updateTradingModeUI() {
        const pairBase = ($("#one_pair").val() || terminal_crypto || "BTC").toUpperCase();
        const pairQuote = ($("#two_pair").val() || "USDT").toUpperCase();
        const isMargin = tradingMode === "futures";
        $("#wixi-margin-leverage").css("display", isMargin ? "flex" : "none");

        $("#btn_buy > div").text(isMargin ? ("Open Long " + futuresLeverage + "x " + pairBase) : ("Open Long " + pairBase));
        $("#btn_sell > div").text(isMargin ? ("Open Short " + futuresLeverage + "x " + pairBase) : ("Open Short " + pairBase));
        $("#btn_limit_buy > div").text(isMargin ? ("Open Long " + futuresLeverage + "x " + pairBase) : ("Open Long " + pairBase));
        $("#btn_limit_sell > div").text(isMargin ? ("Open Short " + futuresLeverage + "x " + pairBase) : ("Open Short " + pairBase));
        $("#buy_amount_input").siblings(".order_suffix").text(pairQuote);
        $("#sell_amount_input").siblings(".order_suffix").text(pairQuote);
        renderEstimatedSizeRows();
        updateTradingHeaderLabels();
    }

    function setTradingMode(nextMode) {
        tradingMode = nextMode === "futures" ? "futures" : "spot";
        $("#wixi-trading-mode [data-mode]").removeClass("buttonActiveNew");
        $("#wixi-trading-mode [data-mode='" + tradingMode + "']").addClass("buttonActiveNew");
        updateTradingModeUI();
        refreshAuthorizedTradingState();
    }

    function applyTradingModeFromUrl() {
        try {
            var params = new URLSearchParams(window.location.search);
            var mode = (params.get("mode") || "").toLowerCase();
            if (mode === "margin" || mode === "futures") {
                setTradingMode("futures");
            }
        } catch (error) {
        }
    }

    function ensureTradingModeToggle() {
        if ($("#wixi-trading-mode").length > 0) {
            return;
        }
        $(".order__tab-fbGht").prepend(
            "<div class=\"button__container\" id=\"wixi-trading-mode\" style=\"margin-bottom:12px;gap:8px;\">" +
            "<div class=\"rushButton buttonActiveNew\" data-mode=\"spot\">Spot</div>" +
            "<div class=\"rushButton\" data-mode=\"futures\">Margin</div>" +
            "</div>"
        );
        $("#wixi-trading-mode").after(
            "<div class=\"button__container\" id=\"wixi-margin-leverage\" style=\"margin-bottom:12px;gap:8px;display:none;\">" +
            allowedMarginLeverages.map(function (value) {
                return "<div class=\"rushButton" + (value === futuresLeverage ? " buttonActiveNew" : "") + "\" data-leverage=\"" + value + "\">" + value + "x</div>";
            }).join("") +
            "</div>"
        );
        $("#wixi-trading-mode [data-mode]").on("click", function () {
            setTradingMode($(this).data("mode"));
        });
        $("#wixi-margin-leverage [data-leverage]").on("click", function () {
            var nextLeverage = parseInt($(this).data("leverage"), 10);
            if (allowedMarginLeverages.indexOf(nextLeverage) === -1) {
                return;
            }
            futuresLeverage = nextLeverage;
            $("#wixi-margin-leverage [data-leverage]").removeClass("buttonActiveNew");
            $(this).addClass("buttonActiveNew");
            updateTradingModeUI();
        });
        updateTradingModeUI();
    }

    window.closeFuturesPosition = function (event, id) {
        if (event) {
            event.preventDefault();
        }
        $.ajax({
            url: "/api/user/trading",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                action: "CLOSE_FUTURES_POSITION",
                id: parseInt(id, 10)
            }),
            success: function (response) {
                if (response === "success") {
                    noti("Position closed", "success");
                    refreshTradingTables();
                    updateTradingBalance();
                    return;
                }
                noti("Could not close position", "error");
            },
            error: function () {
                noti("Could not close position", "error");
            }
        });
    };

    refreshTradingTables();

    let pairs_value = $("#pairs").val();
    let pairss_one = $("#one_pair").val();
    let pairss_two = $("#two_pair").val();
    let new_pairs = pairss_one + "_" + pairss_two;

    const stable_pump_percent = parseFloat($("#stable_pump_percent").val());
    let fast_pumps_json = document.getElementById('fast_pumps_json').textContent;
    fast_pumps_json = fast_pumps_json.length > 0 ? JSON.parse(fast_pumps_json) : "";
    let fast_pumps_active = document.getElementById('fast_pumps_active_json').textContent;
    fast_pumps_active = fast_pumps_active.length > 0 ? JSON.parse(fast_pumps_active) : 0;
    let fast_pumps_end_time = Number($("#fast_pumps_end_time").val());
    if (fast_pumps_end_time > 0) {
        fast_pumps_end_time = fast_pumps_end_time + timeDiff;
    }

//end my

    function addCommas(nStr) {
        nStr += '';
        x = nStr.split('.');
        x1 = x[0];
        x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
    }

    function getChartDimensions() {
        const container = document.querySelector('#tvchart');
        const width = Math.max(Math.floor(container.clientWidth || container.getBoundingClientRect().width || 0), 320);
        const height = Math.max(Math.floor(container.clientHeight || container.getBoundingClientRect().height || 0), 300);
        return { width, height };
    }

    const initialChartSize = getChartDimensions();

    const chartPropeties = {
        width: initialChartSize.width,
        height: initialChartSize.height,
        timeScale: {
            timeVisible: true,
            secondVisible: true
        },
        localization: {
            priceFormatter: price => {
                if (price > 100) {
                    return parseFloat(price).toFixed(2);
                }
                if (price > 1 && price < 100) {
                    return parseFloat(price).toFixed(4);
                }
                if (price <= 1 && price > 0.001) {
                    return parseFloat(price).toFixed(5);
                }
                if (price < 0.001) {
                    return parseFloat(price).toFixed(8);
                }
            }
        }
    }

    const domElement = document.querySelector('#tvchart');
    domElement.style.overflow = 'hidden';
    const chart = LightweightCharts.createChart(domElement, chartPropeties);
    const candleSeries = chart.addCandlestickSeries();
    var volumeSeries = chart.addHistogramSeries({
        priceFormat: {
            type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
            top: 0.8,
            bottom: 0.01,
        },
    });

    function resizeTradingChart() {
        const nextSize = getChartDimensions();
        chart.resize(nextSize.width, nextSize.height);
    }

    window.addEventListener('resize', resizeTradingChart);
    setTimeout(resizeTradingChart, 0);

    //1m 3m 5m 15m 30m 1h 2h 4h 6h 8h 12h 1d 3d 1w 1M

    var symbol = document.querySelector('#var_for_chart').getAttribute('symbol')
    var customSymbol = document.querySelector('#var_for_chart').getAttribute('customSymbol')

    if (customSymbol == '') {
        customSymbol = symbol
    } else {
        symbol = document.querySelector('#var_for_chart').getAttribute('customSymbol')
        customSymbol = document.querySelector('#var_for_chart').getAttribute('symbol')
    }

    var pairs_for_ajax = $("#get_pairs_for_js").val();
    setTradingInfoHeaderStatic();
    fetchTradingInfoHeaderTicker(domain);
    setInterval(function () {
        fetchTradingInfoHeaderTicker(domain);
    }, 15000);

//start my
//todo: time
    function get_percent(data) {
        let price = data + (data * stable_pump_percent);
        if (fast_pumps_active && fast_pumps_active !== 0 && fast_pumps_active.length > 0) {
            for (let fastPumpsActiveElement of fast_pumps_active) {
                price = price + (price * fastPumpsActiveElement);
            }
        }
        return price;
    }

    function get_stable_percent(data) {
        return data + (data * stable_pump_percent);
    }

    function applyTradingBalances(baseAmount, quoteAmount) {
        var quoteBalance = fixNumber(parseFloat(quoteAmount || 0), 2);

        $("#sell_available").html(quoteBalance);
        $("#sell_available2").html(quoteBalance);
        $("#sell_available3").html(quoteBalance);
        $("#buy_available").html(quoteBalance);
        $("#buy_available2").html(quoteBalance);
        $("#buy_available3").html(quoteBalance);
        $("#usdt_balance").val(quoteBalance <= 0 ? "0.00" : quoteBalance);
        $("#margin-balance").text("$" + quoteBalance.toFixed(2));
    }

    function applyTradingBalancesFromMap(balanceMap) {
        var pairBase = ($("#one_pair").val() || terminal_crypto || "BTC").toUpperCase();
        var pairQuote = ($("#two_pair").val() || "USDT").toUpperCase();
        var baseAmount = balanceMap && balanceMap[pairBase] && balanceMap[pairBase].first ? balanceMap[pairBase].first : "0";
        var quoteAmount = balanceMap && balanceMap[pairQuote] && balanceMap[pairQuote].first ? balanceMap[pairQuote].first : "0";
        applyTradingBalances(baseAmount, quoteAmount);
    }

    function updateTradingBalance() {
        if (tradingMode === "futures") {
            $.ajax({
                url: "/api/user/trading",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                    action: "GET_FUTURES_BALANCE",
                    pair_symbol: symbol,
                    quote_coin: ($("#two_pair").val() || "USDT").toUpperCase()
                }),
                success: function (response) {
                    const json = typeof response === "string" ? JSON.parse(response) : response;
                    const availableMargin = parseFloat((json && json.available_margin) || 0);
                    const futuresEquity = parseFloat((json && json.futures_equity) || 0);
                    $("#sell_available").html(fixNumber(availableMargin, 2));
                    $("#sell_available2").html(fixNumber(availableMargin, 2));
                    $("#sell_available3").html(fixNumber(availableMargin, 2));
                    $("#buy_available").html(fixNumber(availableMargin, 2));
                    $("#buy_available2").html(fixNumber(availableMargin, 2));
                    $("#buy_available3").html(fixNumber(availableMargin, 2));
                    $("#margin-balance").text("$" + fixNumber(availableMargin, 2).toFixed(2));
                    $("#futures-balance").text("$" + fixNumber(futuresEquity, 2).toFixed(2));
                    $("#usdt_balance").val(fixNumber(availableMargin, 2));
                },
                error: function () {
                    applyTradingBalances("0", "0");
                    $("#futures-balance").text("$0.00");
                }
            });
            return;
        }
        $.ajax({
            url: "/api/user/balances",
            type: "GET",
            success: function (response) {
                const json = typeof response === "string" ? JSON.parse(response) : response;
                applyTradingBalancesFromMap(json || {});
                $("#futures-balance").text("$0.00");
            },
            error: function () {
                applyTradingBalances("0", "0");
                $("#futures-balance").text("$0.00");
            }
        });
    }

    window.addEventListener("wixi:user", function (event) {
        const user = event && event.detail ? event.detail.user : null;
        if (user && user.authenticated) {
            refreshAuthorizedTradingState();
            return;
        }
        refreshAuthorizedTradingState();
    });

    window.addEventListener("wixi:balances", function (event) {
        const balances = event && event.detail ? event.detail.balances : null;
        if (balances && tradingMode !== "futures") {
            applyTradingBalancesFromMap(balances);
        }
    });

    ensureTradingModeToggle();
    applyTradingModeFromUrl();

    function findKlinePumpPercent(openTime, closeTime) {
        if (fast_pumps_json !== 'null' && fast_pumps_json != null && typeof fast_pumps_json !== "undefined") {
            for (let pump of fast_pumps_json) {
                let pumpTime = pump["time"] + timeDiff;
                if (pumpTime >= openTime && pumpTime <= closeTime) {
                    return parseFloat(pump["percent"]);
                }
            }
        }
        return 0;
    }

    function fixNumber(number, decimalPlaces) {
        var stringNumber = number.toString();

        var decimalPosition = stringNumber.indexOf('.');

        if (decimalPosition !== -1) {
            stringNumber = stringNumber.slice(0, decimalPosition + 1 + decimalPlaces);
        }

        var truncatedNumber = parseFloat(stringNumber);

        if (isNaN(truncatedNumber) || !isFinite(truncatedNumber) || number.toString().toLowerCase().includes('e-')) {
            truncatedNumber = 0;
        }

        return truncatedNumber;
    }

    var cdata = [];

    function fetchData(callback) {
        fetch("https://api." + domain + "/api/v3/klines?symbol=" + pairs_value + "&interval=1m&limit=1000" + (fast_pumps_end_time > 0 ? "&endTime=" + fast_pumps_end_time : ""))
            .then(response => response.json())
            .then(json => {
                let oldKline = -77777;
                for (let i = 0; i < json.length; i++) {
                    let kline = json[i];
                    let openTime = Math.floor(new Number(kline[0]) / 1000);
                    let closeTime = Math.floor(new Number(kline[6]) / 1000);
                    let open = get_stable_percent(parseFloat(kline[1]));
                    let close = get_stable_percent(parseFloat(kline[4]));
                    let high = get_stable_percent(parseFloat(kline[2]));
                    let low = get_stable_percent(parseFloat(kline[3]));
                    let volume = get_stable_percent(parseFloat(kline[5]));
                    //open = i > 0 ? cdata[i - 1].close : open;
                    //low = open;
                    let currentKline = findKlinePumpPercent(openTime, closeTime);
                    if (currentKline !== 0) {
                        if (oldKline === -77777) {
                            close = close + (close * currentKline);
                        } else {
                            let nextKline = -77777;
                            if (i < json.length) {
                                nextKline = findKlinePumpPercent(Math.floor(new Number(json[i][0]) / 1000), Math.floor(new Number(json[i][6]) / 1000));
                            }
                            if (nextKline === 0) {
                                open = cdata[i - 1].close;
                                low = low + (low * currentKline);
                            } else {
                                open = i > 0 ? cdata[i - 1].close : open;
                                low = open;
                                if (i === 0) {
                                    close = close + (close * currentKline);
                                } else {
                                    close = cdata[i - 1].close;
                                    close = close + (close * currentKline);
                                }
                                high = close;
                            }
                        }
                        oldKline = currentKline;
                    }
                    //todo: проверить openTime или closeTime
                    cdata.push({
                        "time": closeTime,
                        "open": open,
                        "high": high,
                        "low": low,
                        "close": close,
                        "volume": volume
                    });
                }
                callback(cdata);
            }).catch(error => console.error(error));
    }

    fetchData(async cdata => {
        candleSeries.setData(cdata);

        const volume_data = cdata.map(d => {
            if (parseFloat(d['open']) < parseFloat(d['close'])) {
                clr = '#04B500'; //green
            } else {
                clr = '#FF3300'; // red
            }
            time = d['time'];
            return {time, value: parseFloat(d['volume']), color: clr}

        })

        //log(volume_data)
        volumeSeries.setData(volume_data);

        //UPDATE PRICE FROM LEFT, STAT PRICE AND BEST PRICE
        if (cdata[cdata.length - 1]['close'] > 100) {
            priceUpdate = parseFloat(cdata[cdata.length - 1]['close']).toFixed(2);
        }
        if (cdata[cdata.length - 1]['close'] >= 1 && cdata[cdata.length - 1]['close'] < 100) {
            priceUpdate = parseFloat(cdata[cdata.length - 1]['close']).toFixed(4);
        }
        if (cdata[cdata.length - 1]['close'] < 1 && cdata[cdata.length - 1]['close'] > 0.001) {
            priceUpdate = parseFloat(cdata[cdata.length - 1]['close']).toFixed(5);
        }
        if (cdata[cdata.length - 1]['close'] < 0.001) {
            priceUpdate = parseFloat(cdata[cdata.length - 1]['close']).toFixed(8);
        }

        chart.applyOptions({
            watermark: {
                color: '#1f2226',
                visible: true,
                text: "     ",
                fontSize: 50,
                fontWeight: 'bold',
                horzAlign: 'center',
                vertAlign: 'center',
            },
            layout: {
                backgroundColor: 'white',
                textColor: '#515964',
                fontSize: 12,
                fontFamily: 'Roboto-Regular, sans-serif',
            },
            grid: {
                vertLines: {
                    color: '#1d2127',
                    style: 1,
                    visible: true,
                },
                horzLines: {
                    color: '#1d2127',
                    style: 1,
                    visible: true,
                },
            },
            localization: {
                locale: 'en-US',
            },
            crosshair: {
                vertLine: {
                    color: '#767f8b',
                    width: 0.5,
                    style: 1,
                    visible: true,
                    labelVisible: true,
                },
                horzLine: {
                    color: '#767f8b',
                    width: 0.5,
                    style: 0,
                    visible: true,
                    labelVisible: true,
                },
                mode: 3,
            },
        });

        var his_close = '';
        var his_edited = 'false';

        var soc_his_time = 0;
        var new_fix_time = 0;
        var last_currency_price = 0;

        wsLiveChart = new WebSocket('wss://stream.' + domain + ':9443/ws/' + symbol.toLowerCase() + '@kline_1m');
        wsLiveChart.onopen = function () {
        };

        let oldClosePrice = cdata[cdata.length - 1].close;

        wsLiveChart.onmessage = function (onmessage) {
            try {
                let resp_socket = JSON.parse(onmessage.data);
                let closeTime = Math.floor(resp_socket.k.T / 1000);

                high = get_stable_percent(parseFloat(resp_socket.k.h));
                low = get_stable_percent(parseFloat(resp_socket.k.l));
                close = get_stable_percent(parseFloat(resp_socket.k.c));
                open = get_stable_percent(parseFloat(resp_socket.k.o));

                rez = {
                    time: closeTime,
                    open: open,
                    high: high,
                    low: low,
                    close: close
                };

                candleSeries.update(rez);

                var fixed_price = parseFloat(close);
                if (parseFloat(close) > 1) {
                    fixed_price = fixed_price.toFixed(2);
                } else {
                    fixed_price = fixed_price.toFixed(6);
                }

                $("#c_i_p_ajax_sp2").html(fixed_price);
                $("#aj_live_price_3").html(fixed_price);
                var new_symbol = symbol.split('USDT').join('');
                $('html head').find('title').text("$" + addCommas(fixed_price) + " - " + symbol);
                var usdNode = document.getElementById("trading-info-usd");
                if (usdNode) {
                    usdNode.textContent = "≈$" + addCommas(fixed_price);
                }
                var up = pair_price <= parseFloat(close);
                pair_price = parseFloat(close);
                updateBuyAvailable(false);
                updateSellAvailable(false);

                $("#aj_live_new_price_block_2").html("$" + pair_price);
                $("#aj_live_new_price_block_1").html(pair_price);
                $("#aj_live_new_price_block_1").css('color', up ? '#03a66d' : '#F6465D');
                $("#price-svg").attr('src', up ? '/assets/img/trading/arrow-up.svg' : '/assets/img/trading/arrow-down.svg');
                $("#currency_in_list_" + new_symbol).html(pair_price);

                if (last_currency_price < pair_price || last_currency_price === 0) {
                    $("#price_block_minus_plus").removeClass("order__info-price-minus");
                    $("#price_block_minus_plus").removeClass("order__info-price-plus");
                    $("#price_block_minus_plus").addClass("order__info-price-plus");
                } else {
                    $("#price_block_minus_plus").removeClass("order__info-price-minus");
                    $("#price_block_minus_plus").removeClass("order__info-price-plus");
                    $("#price_block_minus_plus").addClass("order__info-price-minus");
                }

                last_currency_price = pair_price;
                oldClosePrice = close;
            } catch (error) {
                console.log(error);
            }
        }

        leftpairList = document.querySelectorAll('.link'); //document.querySelectorAll('.link')[27].childNodes[3].innerText = 11

        btc_pairs_label = document.querySelectorAll('#btc_pairs_label');
        eth_pairs_label = document.querySelectorAll('#eth_pairs_label');
        usdt_pairs_label = document.querySelectorAll('#usdt_pairs_label');

        btcPairs = document.querySelectorAll('.BTC');
        ethPairs = document.querySelectorAll('.ETH');
        usdtPairs = document.querySelectorAll('.USDT');

        btc_pairs_label.forEach(element => {
            element.onclick = function () {
                for (i = 0; i < ethPairs.length; i++) {
                    ethPairs[i].style.display = 'none';
                }
                for (i = 0; i < usdtPairs.length; i++) {
                    usdtPairs[i].style.display = 'none';
                }
                for (i = 0; i < btcPairs.length; i++) {
                    btcPairs[i].style.display = 'table-row';
                }
                document.querySelector('#underline_bar').style.left = "90px";
            }
        });

        eth_pairs_label.forEach(element => {
            element.onclick = function () {
                for (i = 0; i < btcPairs.length; i++) {
                    btcPairs[i].style.display = 'none';
                }
                for (i = 0; i < usdtPairs.length; i++) {
                    usdtPairs[i].style.display = 'none';
                }
                for (i = 0; i < ethPairs.length; i++) {
                    ethPairs[i].style.display = 'table-row';
                }
                document.querySelector('#underline_bar').style.left = "158px";
            }
        });

        usdt_pairs_label.forEach(element => {
            element.onclick = function () {
                for (i = 0; i < ethPairs.length; i++) {
                    ethPairs[i].style.display = 'none';
                }
                for (i = 0; i < btcPairs.length; i++) {
                    btcPairs[i].style.display = 'none';
                }
                for (i = 0; i < usdtPairs.length; i++) {
                    usdtPairs[i].style.display = 'table-row';
                }
                document.querySelector('#underline_bar').style.left = "12px";
            }
        });

        for (i = 0; i < btcPairs.length; i++) {
            btcPairs[i].style.display = 'none';
        }

        for (i = 0; i < ethPairs.length; i++) {
            ethPairs[i].style.display = 'none';
        }

        document.querySelectorAll('.coins__item[href*="/profile/trading"]').forEach(function (element) {
            element.addEventListener("click", function (event) {
                var href = element.getAttribute("href") || "";
                if (!href) {
                    return;
                }
                event.preventDefault();
                try {
                    var target = new URL(href, window.location.origin);
                    var currency = (target.searchParams.get("currency") || "").trim().toUpperCase();
                    if (!currency) {
                        window.location.href = "/profile/trading/" + currentTradingLangSuffix().replace(/^&/, "?");
                        return;
                    }
                    var nextUrl = "/profile/trading/?currency=" + encodeURIComponent(currency);
                    var langSuffix = currentTradingLangSuffix();
                    if (langSuffix) {
                        nextUrl += langSuffix;
                    }
                    window.location.href = nextUrl;
                } catch (_error) {
                    window.location.href = href;
                }
            });
        });

// Auto calculate prices from buy and sell inputs

        var sign_in = $("#sign_in").val();

        var user_balance = $("#" + pair_two + "_balance").val();
        var user_available = 0;

        /*$(document).ready(function () {
            setInterval(function () {
                user_balance = $("#" + pair_two + "_balance").val();

                user_available = fixNumber(user_balance);

                $("#buy_available").html(user_available);
                $("#buy_available2").html(user_available);
                $("#buy_available3").html(user_available);

            }, 1500);
        });*/
//buy
        $('#buy_amount_input').keyup(function (e) {
            buyBy = "input"
            updateBuyAvailable(false);
        });

//sell
        $('#sell_amount_input').keyup(function (e) {
            sellBy = "input";
            updateSellAvailable(false);
        });

        // ---------------- Sell and Buy buttons -----------------------//
        $("#btn_buy").on("click", function () {
            var buyAmount = parseFloat($("#buy_amount_input").val() || "0");
            var availableMarginBuy = parseFloat($("#buy_available2").html() || "0");
            if (buyAmount <= 0) {
                noti("Enter amount", "error");
                return;
            }
            if (buyAmount > availableMarginBuy) {
                noti("Not enough balance", "error");
                return;
            }
            noti(getMessage("trading.processing"), "info");
            $.ajax({
                url: "/api/user/trading",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                    action: "OPEN_FUTURES_POSITION",
                    side: "LONG",
                    leverage: currentPositionLeverage(),
                    coin: symbol,
                    amount: buyAmount
                }),
                success: function (response) {
                    if (handleTransferLockedTradingResponse(response, getCurrentTradingQuote())) {
                        return;
                    }
                    switch (response) {
                        case "success":
                            refreshTradingTables();
                            updateTradingBalance();
                            $("#buy_amount_input").val("");
                            $("#buy_crypto_available").html("0");
                            noti(tradingMode === "futures" ? "Margin long opened" : "Spot long opened", "success");
                            break;
                        case "no_balance":
                            noti("Not enough balance", "error");
                            break;
                        case "min_amount":
                            noti(getMessage("trading.min.amount"), "error");
                            break;
                        default:
                            noti(getMessage("user.api.error.null"), "error");
                            break;
                    }
                }
            });
        });

        $("#btn_sell").on("click", function () {
            var sellAmount = parseFloat($("#sell_amount_input").val() || "0");
            var availableMarginSell = parseFloat($("#sell_available2").html() || "0");
            if (sellAmount <= 0) {
                noti("Enter amount", "error");
                return;
            }
            if (sellAmount > availableMarginSell) {
                noti("Not enough balance", "error");
                return;
            }
            noti(getMessage("trading.processing"), "info");
            $.ajax({
                url: "/api/user/trading",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                    action: "OPEN_FUTURES_POSITION",
                    side: "SHORT",
                    leverage: currentPositionLeverage(),
                    coin: symbol,
                    amount: sellAmount
                }),
                success: function (response) {
                    if (handleTransferLockedTradingResponse(response, getCurrentTradingQuote())) {
                        return;
                    }
                    switch (response) {
                        case "success":
                            refreshTradingTables();
                            updateTradingBalance();
                            $("#sell_amount_input").val("");
                            $("#sell_crypto_available").html("0");
                            noti(tradingMode === "futures" ? "Margin short opened" : "Spot short opened", "success");
                            break;
                        case "no_balance":
                            noti("Not enough balance", "error");
                            break;
                        case "min_amount":
                            noti(getMessage("trading.min.amount"), "error");
                            break;
                        default:
                            noti(getMessage("user.api.error.null"), "error");
                            break;
                    }
                }
            });
        });

        setInterval(function () {
            if (!isTradingAuthorized()) {
                refreshTradingTables();
                return;
            }

            refreshTradingTables();
            updateTradingBalance();
        }, 10000);
        ///////////////////////////////-END-///////////////////////////////

        function randomNumber() {
            var random_number_2 = Math.floor((Math.random() * 7) + 1);
            var random_true = '';
            if (random_number_2 == 1) {
                random_true = '5';
            } else if (random_number_2 == 2) {
                random_true = '8';
            } else if (random_number_2 == 3) {
                random_true = '10';
            } else if (random_number_2 == 4) {
                random_true = '20';
            } else if (random_number_2 == 5) {
                random_true = '40';
            } else if (random_number_2 == 6) {
                random_true = '60';
            } else if (random_number_2 == 7) {
                random_true = '80';
            } else {
                random_true = '';
            }

            return random_true;
        }

        function formatPrice(price) {
            if (price > 100) {
                return parseFloat(price).toFixed(2);
            }
            if (price > 1 && price < 100) {
                return parseFloat(price).toFixed(4);
            }
            if (price <= 1 && price > 0.001) {
                return parseFloat(price).toFixed(5);
            }
            if (price < 0.001) {
                return parseFloat(price).toFixed(8);
            }
        }

        //start orderBook
        var asksI = 0;
        var bidsI = 0;
        var asks;
        var bids;
        var limit = 1000;

        async function updateOrderBook() {
            await fetch("https://api." + domain + "/api/v3/depth?symbol=" + pairs_value + "&limit=" + limit).then(response => {
                response.json().then(json => {
                    asks = json['asks'];
                    bids = json['bids'];
                    bids = reverseArray(bids);

                    if (limit === 1000) {
                        preserveWindowScroll(function () {
                            $("#order_sell_div").empty();
                            $("#order_buy_div").empty();
                            for (asksI = 0; asksI < 30; asksI++) {
                                addOrderItem(true, asks[asksI]);
                                addOrderItem(false, bids[asksI]);
                            }
                        });

                        bidsI = asksI;

                        limit = 300;
                    }
                });
            });
        }

        function reverseArray(arr) {
            const result = [];
            for (let i = arr.length - 1; i >= 0; i--) {
                result.push(arr[i]);
            }
            return result;
        }

        await updateOrderBook();

        setInterval(async () => {
            if (Math.random() <= 0.5) {
                if (asks && asks.length > 0) {
                    if (asksI >= asks.length) {
                        asksI = 0;
                        bidsI = 0;
                        await updateOrderBook();
                    } else {
                        const val = asks[asksI];
                        addOrderItem(true, val, true);
                        asksI++;
                    }
                }
            } else {
                if (bids && bids.length > 0) {
                    if (bidsI >= bids.length) {
                        asksI = 0;
                        bidsI = 0;
                        await updateOrderBook();
                    } else {
                        const val = bids[bidsI];
                        addOrderItem(false, val, true);
                        bidsI++;
                    }
                }
            }
        }, 1000);

        function addOrderItem(isAsk, val, del) {
            const price = val[0];
            const amount = val[1];
            const amountUsdt = get_percent(parseFloat(price) * parseFloat(amount));

            const html = `
                        <div class="book__item ` + (isAsk ? "green_tr" : "red_tr") + `">
                            <div class="book__item-fill" style="width: ` + randomNumber() + `%;"></div>
                            <div class="book__item-price">
                                ` + formatPrice(get_percent(parseFloat(price))) + `
                            </div>
                            <div class="book__item-size">
                                ` + amount + `
                            </div>
                            <div class="book__item-sum">
                                ` + addCommas(amountUsdt.toFixed(2)) + `
                            </div>
                        </div>`;

            preserveWindowScroll(function () {
                $("#order_" + (isAsk ? "sell" : "buy") + "_div").prepend(html);

                if (del) {
                    $("#order_" + (isAsk ? "sell" : "buy") + "_div").children().last().remove();
                }
            });
        }

        //recent orders
        fetch("https://api." + domain + "/api/v3/depth?symbol=" + pairs_value + "&limit=300").then(response => {
            response.json().then(json => {
                function shuffleArray(array) {
                    for (let i = array.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [array[i], array[j]] = [array[j], array[i]];
                    }
                }

                let orderArray = [];
                let bids = json.bids;
                let asks = json.asks;
                shuffleArray(bids);
                shuffleArray(asks);
                for (let i = 0; i < Math.min(50, bids.length); i++) {
                    orderArray.push([
                        get_percent(parseFloat(bids[i][0])),
                        bids[i][1],
                        "false"
                    ]);
                }
                for (let i = 0; i < Math.min(50, asks.length); i++) {
                    orderArray.push([
                        get_percent(parseFloat(asks[i][0])),
                        asks[i][1],
                        "true"
                    ]);
                }
                orderArray.sort(() => Math.random() - 0.5);
                let orderBook = new Map();
                for (let i = 1; i <= 100; i++) {
                    orderBook.set(String(i), orderArray[i - 1]);
                }
                var json_price = JSON.parse(JSON.stringify(Object.fromEntries(orderBook), null, 2));
                var json_count = 1;
                var recent_tr_block_id = 21; //start 6
                var recent_new_tr_block_id = 47; // start 7

                var recent_all_block = '';

                for (var iii = 0; iii < 20; iii++) {
                    var json_live_price = parseFloat(json_price[json_count][0]);
                    var json_live_amount = parseFloat(json_price[json_count][1]);
                    var json_live_amount_fix = json_live_amount.toFixed(4);
                    if (json_live_amount > 1) {
                        json_live_amount_fix = json_live_amount.toFixed(2);
                    } else {
                        json_live_amount_fix = json_live_amount.toFixed(6);
                    }

                    var json_live_m = json_price[json_count][2];
                    json_count = json_count + 1;

                    if (json_count > 99) {
                        json_count = 1;
                    }

                    //now time
                    //now time
                    var dt = new Date();
                    var now = dt;
                    var this_month = dt.getMonth() + 1;

                    const time = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                    var recent_number = Math.floor((Math.random() * 2) + 1);

                    if (json_live_m == 'true') {
                        recent_status = 'buy';
                    } else {
                        recent_status = 'sell';
                    }

                    function random_number() {
                        // Random Number Red
                        var random_number_2 = Math.floor((Math.random() * 7) + 1);
                        var random_true = '';
                        if (random_number_2 == 1) {
                            random_true = '5';
                        } else if (random_number_2 == 2) {
                            random_true = '8';
                        } else if (random_number_2 == 3) {
                            random_true = '10';
                        } else if (random_number_2 == 4) {
                            random_true = '20';
                        } else if (random_number_2 == 5) {
                            random_true = '40';
                        } else if (random_number_2 == 6) {
                            random_true = '60';
                        } else if (random_number_2 == 7) {
                            random_true = '80';
                        } else {
                            random_true = '';
                        }

                        return random_true;
                    }

                    // recent trade
                    var live_json_form = json_live_price;
                    if (live_json_form > 10) {
                        live_json_form = live_json_form.toFixed(2);
                    } else if (live_json_form > 0.1) {
                        live_json_form = live_json_form.toFixed(4);
                    } else {
                        live_json_form = live_json_form.toFixed(6);
                    }

                    recent_all_block = recent_all_block + `<div class="trades__item ` + recent_status + `" id="recent_tr_` + recent_new_tr_block_id + `">
                                                    <div class="trades__item-price">
                                                        ` + addCommas(live_json_form) + `
                                                    </div>
                                                    <div class="trades__item-size">
                                                        ` + json_live_amount_fix + `
                                                    </div>
                                                    <div class="trades__item-time">
                                                        ` + time + `
                                                    </div>
                                                </div>`;

                    var remove_recent_id = recent_new_tr_block_id - recent_tr_block_id;
                    $("#recent_tr_" + remove_recent_id).remove();
                    recent_new_tr_block_id = recent_new_tr_block_id + 1;

                    if (iii == 19) {
                        $("#recent_orders").prepend(recent_all_block);
                    }
                }

                function doSomething() {
                    var json_live_price = parseFloat(json_price[json_count][0]);
                    var json_live_amount = parseFloat(json_price[json_count][1]);
                    var json_live_amount_fix = json_live_amount.toFixed(4);
                    if (json_live_amount > 1) {
                        json_live_amount_fix = json_live_amount.toFixed(2);
                    } else {
                        json_live_amount_fix = json_live_amount.toFixed(6);
                    }
                    var json_live_m = json_price[json_count][2];
                    json_count = json_count + 1;

                    if (json_count > 99) {
                        json_count = 1;
                    }

                    //now time
                    var dt = new Date();
                    var now = dt;
                    var this_month = dt.getMonth() + 1;

                    const time = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                    var recent_number = Math.floor((Math.random() * 2) + 1);

                    if (json_live_m == 'true') {
                        recent_status = 'buy';
                    } else {
                        recent_status = 'sell';
                    }

                    function random_number() {
                        // Random Number Red
                        var random_number_2 = Math.floor((Math.random() * 7) + 1);
                        var random_true = '';
                        if (random_number_2 == 1) {
                            random_true = '5';
                        } else if (random_number_2 == 2) {
                            random_true = '8';
                        } else if (random_number_2 == 3) {
                            random_true = '10';
                        } else if (random_number_2 == 4) {
                            random_true = '20';
                        } else if (random_number_2 == 5) {
                            random_true = '40';
                        } else if (random_number_2 == 6) {
                            random_true = '60';
                        } else if (random_number_2 == 7) {
                            random_true = '80';
                        } else {
                            random_true = '';
                        }

                        return random_true;
                    }

                    var new_live_json_form = json_live_price;
                    if (new_live_json_form > 10) {
                        new_live_json_form = new_live_json_form.toFixed(2);
                    } else if (new_live_json_form > 0.1) {
                        new_live_json_form = new_live_json_form.toFixed(4);
                    } else {
                        new_live_json_form = new_live_json_form.toFixed(6);
                    }

                    // recent trade
                    preserveWindowScroll(function () {
                        $("#recent_orders").prepend(`<div class="trades__item ` + recent_status + `" id="recent_tr_` + recent_new_tr_block_id + `">
                                            <div class="trades__item-price">
                                                ` + addCommas(new_live_json_form) + `
                                            </div>
                                            <div class="trades__item-size">
                                                ` + json_live_amount_fix + `
                                            </div>
                                            <div class="trades__item-time">
                                                ` + time + `
                                            </div>
                                        </div>`);

                        var remove_recent_id = recent_new_tr_block_id - recent_tr_block_id;
                        $("#recent_tr_" + remove_recent_id).remove();
                        recent_new_tr_block_id = recent_new_tr_block_id + 1;
                    });
                }

                var i1;
                var rand = 300;

                function randomize() {
                    doSomething();
                    rand = Math.round(Math.random() * (3000 - 500)) + 500;
                    clearInterval(i1);
                    i1 = setInterval(randomize, rand);
                }

                i1 = setInterval(randomize, rand);
            });
        });

        if (sign_in == 'true') {
            setInterval(function () {
                updateTradingBalance();
            }, 3000);
        }

        var buyBy = "none";
        var sellBy = "none";

        $(".order__slider-buy-market").on("change", function (e) {
            buyBy = "slider";
            updateBuyAvailable(true);
        });

        $(".order__slider-sell-market").on("change", function (e) {
            sellBy = "slider";
            updateSellAvailable(true);
        });

        function updateBuyAvailable(withNoti) {
            if (buyBy === "none") {
                return;
            }
            var buyAmount = parseFloat($("#buy_amount_input").val() || "0");
            var availableUsd = parseFloat($("#buy_available2").html() || "0");
            var leverage = currentPositionLeverage();
            if (buyBy === "slider") {
                buyAmount = fixNumber(availableUsd / 100 * parseFloat($(".order__slider-buy-market").val() || "0"), 2);
                $("#buy_amount_input").val(buyAmount);
            }
            if (withNoti && availableUsd === 0) {
                noti(getMessage("trading.no.balance"), "error");
                return;
            }
            if (buyBy === "input" && (!buyAmount || buyAmount <= 0)) {
                $("#buy_crypto_available").html("0");
                return;
            }
            if (buyBy === "slider" && (!buyAmount || buyAmount <= 0)) {
                $("#buy_crypto_available").html("0");
                return;
            }
            if (buyBy !== "input" && buyBy !== "slider") {
                return;
            }
            var estimatedSize = pair_price > 0 ? fixNumber((buyAmount * leverage) / pair_price, 6) : 0;
            $("#buy_crypto_available").html(estimatedSize);
        }

        function updateSellAvailable(withNoti) {
            if (sellBy === "none") {
                return;
            }
            var sellAmount = parseFloat($("#sell_amount_input").val() || "0");
            var availableUsd = parseFloat($("#sell_available2").html() || "0");
            var leverage = currentPositionLeverage();
            if (sellBy === "slider") {
                sellAmount = fixNumber(availableUsd / 100 * parseFloat($(".order__slider-sell-market").val() || "0"), 2);
                $("#sell_amount_input").val(sellAmount);
            }
            if (withNoti && availableUsd === 0) {
                noti(getMessage("trading.no.balance"), "error");
                return;
            }
            if (sellBy === "input" && (!sellAmount || sellAmount <= 0)) {
                $("#sell_crypto_available").html("0");
                return;
            }
            if (sellBy === "slider" && (!sellAmount || sellAmount <= 0)) {
                $("#sell_crypto_available").html("0");
                return;
            }
            var estimatedSize = pair_price > 0 ? fixNumber((sellAmount * leverage) / pair_price, 6) : 0;
            $("#sell_crypto_available").html(estimatedSize);
        }
    });

    //start limit orders

    // ---------------- Sell and Buy buttons -----------------------//
    $("#btn_limit_buy").on("click", function () {
        var price = $("#limit_buy_price").val();
        var amount = $("#limit_buy_amount").val();
        if (price === '' || amount === '' || parseFloat(price) <= 0 || parseFloat(amount) <= 0) {
            noti(getMessage("trading.price.not.corrected"), 'warning');
            return;
        }
        var total = parseFloat($("#limit_buy_total").val() || "0");
        if (total <= 0) {
            noti("Enter amount", "error");
            return;
        }

        noti("Processing..", "info");
        $.ajax({
            url: "/api/user/trading",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                action: "CREATE_POSITION_ORDER",
                order_type: "LIMIT",
                side: "LONG",
                leverage: currentPositionLeverage(),
                price: parseFloat(price),
                size: parseFloat(amount),
                amount: total,
                coin: symbol
            }),
            success: function (response) {
                if (handleTransferLockedTradingResponse(response, getCurrentTradingQuote())) {
                    return;
                }
                switch (response) {
                    case "success": {
                        refreshTradingTables();
                        noti("Limit position order created", "success");
                        $("#limit_buy_amount").val('');
                        $("#limit_buy_total").val('');
                        updateTradingBalance();
                        break;
                    }
                    case "trading_ban": {
                        errorPopup('TRADING');
                        break;
                    }
                    case "amount_error": {
                        noti(getMessage("trading.amount.not.corrected"), "error");
                        break;
                    }
                    case "no_balance": {
                        noti("Not enough balance", "error");
                        break;
                    }
                    case "already_exists": {
                        noti(getMessage("trading.limit.order.already.exists"), "error");
                        break;
                    }
                    case "min_amount": {
                        noti(getMessage("trading.min.amount"), "error");
                        break;
                    }
                    default: {
                        noti(getMessage("user.api.error.null"), "error");
                        break;
                    }
                }
            }
        });
    });

    $("#btn_limit_sell").on("click", function () {
        var price = $("#limit_sell_price").val();
        var amount = $("#limit_sell_amount").val();
        if (price === '' || amount === '' || parseFloat(price) <= 0 || parseFloat(amount) <= 0) {
            noti('Price or amount not corrected', 'warning');
            return;
        }
        var total = parseFloat($("#limit_sell_total").val() || "0");
        if (total <= 0) {
            noti("Enter amount", "error");
            return;
        }

        noti("Processing..", "info");
        $.ajax({
            url: "/api/user/trading",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                action: "CREATE_POSITION_ORDER",
                order_type: "LIMIT",
                side: "SHORT",
                leverage: currentPositionLeverage(),
                price: parseFloat(price),
                size: parseFloat(amount),
                amount: total,
                coin: symbol
            }),
            success: function (response) {
                if (handleTransferLockedTradingResponse(response, getCurrentTradingQuote())) {
                    return;
                }
                switch (response) {
                    case "success": {
                        refreshTradingTables();
                        noti("Limit position order created", "success");
                        $("#limit_sell_amount").val('');
                        $("#limit_sell_total").val('');
                        updateTradingBalance();
                        break;
                    }
                    case "trading_ban": {
                        errorPopup('TRADING');
                        break;
                    }
                    case "amount_error": {
                        noti(getMessage("trading.amount.not.corrected"), "error");
                        break;
                    }
                    case "no_balance": {
                        noti("Not enough balance", "error");
                        break;
                    }
                    case "already_exists": {
                        noti(getMessage("trading.limit.order.already.exists"), "error");
                        break;
                    }
                    case "min_amount": {
                        noti(getMessage("trading.min.amount"), "error");
                        break;
                    }
                    default: {
                        noti(getMessage("user.api.error.null"), "error");
                        break;
                    }
                }
            }
        });
    });


    let limitBuyBy = 'none';
    let limitSellBy = 'none';

    $("#limit_buy_price").on('input', () => {
        limitBuyBy = "input";
        updateLimitBuyAvailable(true);
    });

    $("#limit_buy_amount").on('input', () => {
        var price = $("#limit_buy_price").val();
        if (price === '' || price <= 0) {
            noti(getMessage("trading.must.specify.price"), 'error');
            return;
        }
        limitBuyBy = "input";
        updateLimitBuyAvailable(true);
    });

    $("#limit_sell_price").on('input', () => {
        limitSellBy = "input";
        updateLimitSellAvailable(true);
    });

    $("#limit_sell_amount").on('input', () => {
        var price = $("#limit_sell_price").val();
        if (price === '' || price <= 0) {
            noti(getMessage("trading.must.specify.price"), 'error');
            return;
        }
        limitSellBy = "input";
        updateLimitSellAvailable(true);
    });

    $(".order__slider-buy-limit").on("change", function (e) {
        var price = $("#limit_buy_price").val();
        if (price === '' || price <= 0) {
            noti(getMessage("trading.must.specify.price"), 'error');
            return;
        }
        limitBuyBy = "slider";
        updateLimitBuyAvailable(true);
    });

    $(".order__slider-sell-limit").on("change", function (e) {
        var price = $("#limit_sell_price").val();
        if (price === '' || price <= 0) {
            noti(getMessage("trading.must.specify.price"), 'error');
            return;
        }
        limitSellBy = "slider";
        updateLimitSellAvailable(true);
    });

    function updateLimitBuyAvailable(withNoti) {
        if (limitBuyBy === "none") {
            return;
        }
        var price = $("#limit_buy_price").val();
        var leverage = currentPositionLeverage();
        if (limitBuyBy === "input") {
            var size = $("#limit_buy_amount").val();

            var total = fixNumber((price * size) / leverage, 6);

            $("#limit_buy_total").val(total);
            return;
        }

        var range_val_buy = $(".order__slider-buy-limit").val();
        var available_usd = $("#buy_available2").html();
        available_usd = parseFloat(available_usd);

        if (withNoti && available_usd == 0) {
            noti(getMessage("trading.no.balance"), "error");
        } else {
            var result_change = available_usd / 100 * range_val_buy;
            result_change = fixNumber(result_change, 2);

            var result_price = (result_change * leverage) / price;
            result_price = fixNumber(result_price, 6);

            $("#limit_buy_amount").val(result_price);
            $("#limit_buy_total").val(result_change);
        }
    }

    function updateLimitSellAvailable(withNoti) {
        if (limitSellBy === "none") {
            return;
        }
        var price = $("#limit_sell_price").val();
        var leverage = currentPositionLeverage();
        if (limitSellBy === "input") {
            var size = $("#limit_sell_amount").val();

            var total = fixNumber((price * size) / leverage, 6);

            $("#limit_sell_total").val(total);
            return;
        }

        var range_val_sell = $(".order__slider-sell-limit").val();
        var available_usd = $("#sell_available2").html();
        available_usd = parseFloat(available_usd);

        if (withNoti && available_usd == 0) {
            noti(getMessage("trading.no.balance"), "error");
        } else {
            var result_change = available_usd / 100 * range_val_sell;

            var result_price = (result_change * leverage) / price;
            result_price = fixNumber(result_price, 8);

            $("#limit_sell_amount").val(result_price);
            $("#limit_sell_total").val(result_change);
        }
    }
    //end limit orders
}

