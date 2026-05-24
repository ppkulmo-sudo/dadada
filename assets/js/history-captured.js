(function () {
    let lastHistoryHtml = "";
    let resizeTimer = null;

    function getHistoryType() {
        const params = new URLSearchParams(window.location.search);
        const value = (params.get("type") || "all").toLowerCase();
        return ["all", "deposit", "withdraw", "transfer", "earning"].indexOf(value) !== -1 ? value : "all";
    }

    function getHistoryPage() {
        const params = new URLSearchParams(window.location.search);
        const value = parseInt(params.get("page") || "1", 10);
        return Number.isFinite(value) && value > 0 ? value : 1;
    }

    function historyTitle(type) {
        const titles = {
            all: "History - All Transactions",
            deposit: "History - Deposits",
            withdraw: "History - Withdrawals",
            transfer: "History - Transfers",
            earning: "History - Earnings"
        };
        return titles[type] || titles.all;
    }

    function historyRoute(type, page) {
        const normalizedPage = Number.isFinite(page) && page > 0 ? page : 1;
        const path = "/profile/history/?type=" + type + "&page=" + normalizedPage;
        if (window.WixiShell && typeof window.WixiShell.routeUrl === "function") {
            return window.WixiShell.routeUrl(path);
        }
        return path;
    }

    function renderActiveNav(type) {
        const labels = {
            all: "All Transactions",
            deposit: "Deposits",
            withdraw: "Withdrawals",
            transfer: "Transfers",
            earning: "Earnings"
        };

        document.querySelectorAll(".history__content__nav__list__item").forEach(function (item) {
            const label = (item.textContent || "").trim();
            const normalized = Object.keys(labels).find(function (key) {
                return labels[key] === label;
            });
            item.classList.toggle("active", normalized === type);
            item.onclick = function () {
                window.location.assign(historyRoute(normalized || "all", 1));
            };
        });

        const titleNode = document.querySelector(".history-table__title");
        if (titleNode) {
            titleNode.textContent = historyTitle(type);
        }
    }

    function renderRows(html) {
        const tbody = document.querySelector(".history-table__table tbody");
        if (!tbody) {
            return;
        }
        lastHistoryHtml = typeof html === "string" ? html : "";
        if (window.innerWidth <= 768) {
            tbody.innerHTML = buildMobileRows(lastHistoryHtml);
            return;
        }
        tbody.innerHTML = lastHistoryHtml;
    }

    function buildMobileRows(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString("<table><tbody>" + html + "</tbody></table>", "text/html");
        const rows = Array.from(doc.querySelectorAll("tbody tr"));
        if (!rows.length) {
            return html;
        }
        return rows.map(function (row) {
            const cells = Array.from(row.querySelectorAll("td"));
            if (!cells.length) {
                return row.outerHTML;
            }
            if (row.id === "empty-tr") {
                return (
                    '<tr id="empty-tr" class="history-mobile-empty-row"><td colspan="7">' +
                    '<div class="history-mobile-empty">' +
                    '<img src="/assets/captured/trading/empty-list.svg" alt="empty">' +
                    '<div class="history-mobile-empty__text">No Records</div>' +
                    "</div></td></tr>"
                );
            }
            if (cells.length === 1 && cells[0].getAttribute("colspan")) {
                return row.outerHTML
                    .replace("<tr", '<tr class="history-mobile-meta-row"')
                    .replace('style="min-width: 800px;margin: -16px;padding: 16px;"', 'class="history-mobile-meta-cell"');
            }
            if (cells.length < 7) {
                return row.outerHTML;
            }
            const txid = cells[0].innerHTML;
            const created = cells[1].innerHTML;
            const address = cells[2].innerHTML;
            const amount = cells[3].innerHTML;
            const commission = cells[4].innerHTML;
            const type = cells[5].innerHTML;
            const status = cells[6].innerHTML;
            return (
                '<tr class="history-mobile-row"><td colspan="7">' +
                '<article class="history-mobile-card">' +
                '<div class="history-mobile-card__top">' +
                '<div class="history-mobile-card__txid">' + txid + '</div>' +
                '<div class="history-mobile-card__status">' + status + '</div>' +
                '</div>' +
                '<div class="history-mobile-card__grid">' +
                '<div class="history-mobile-card__item history-mobile-card__item--wide"><span class="history-mobile-card__label">Created</span><div class="history-mobile-card__value">' + created + '</div></div>' +
                '<div class="history-mobile-card__item history-mobile-card__item--wide"><span class="history-mobile-card__label">Address</span><div class="history-mobile-card__value history-mobile-card__value--break">' + address + '</div></div>' +
                '<div class="history-mobile-card__item"><span class="history-mobile-card__label">Amount</span><div class="history-mobile-card__value">' + amount + '</div></div>' +
                '<div class="history-mobile-card__item"><span class="history-mobile-card__label">Commission</span><div class="history-mobile-card__value">' + commission + '</div></div>' +
                '<div class="history-mobile-card__item history-mobile-card__item--wide"><span class="history-mobile-card__label">Type</span><div class="history-mobile-card__value">' + type + '</div></div>' +
                '</div>' +
                '</article>' +
                '</td></tr>'
            );
        }).join("");
    }

    function rerenderForViewport() {
        if (!lastHistoryHtml) {
            return;
        }
        renderRows(lastHistoryHtml);
    }

    function loadHistoryRows() {
        const type = getHistoryType();
        const page = getHistoryPage();
        renderActiveNav(type);
        $.ajax({
            url: "/api/user/history?type=" + encodeURIComponent(type) + "&page=" + encodeURIComponent(page),
            type: "GET",
            success: function (response) {
                renderRows(response);
            },
            error: function () {
                var tbody = document.querySelector(".history-table__table tbody");
                if (tbody && tbody.querySelector("tr") && !tbody.querySelector("#empty-tr")) {
                    return;
                }
                renderRows(
                    '<tr id="empty-tr"><td colspan="7"><div style="min-width: 800px;margin: -16px;padding: 16px;">' +
                    '<div style="padding-top: 32px;padding-bottom: 32px;display: flex;flex-direction: column;align-items: center;justify-content: center;">' +
                    '<img src="/assets/captured/trading/empty-list.svg" alt="empty">' +
                    '<div style="text-align: center;color: #81858c;margin-top: 16px;font-size: 12px;">No Records</div>' +
                    '</div></div></td></tr>'
                );
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadHistoryRows);
    } else {
        loadHistoryRows();
    }

    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(rerenderForViewport, 120);
    });
})();
