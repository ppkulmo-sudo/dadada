(function () {
    function getHistoryType() {
        const params = new URLSearchParams(window.location.search);
        const value = (params.get("type") || "all").toLowerCase();
        return ["all", "deposit", "withdraw", "transfer", "earning"].indexOf(value) !== -1 ? value : "all";
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

    function historyRoute(type) {
        const path = "/profile/history/?type=" + type;
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
                window.location.assign(historyRoute(normalized || "all"));
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
        tbody.innerHTML = html;
    }

    function loadHistoryRows() {
        const type = getHistoryType();
        renderActiveNav(type);
        $.ajax({
            url: "/api/user/history?type=" + encodeURIComponent(type),
            type: "GET",
            success: function (response) {
                renderRows(response);
            },
            error: function () {
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
})();
