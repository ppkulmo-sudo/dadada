function initReferralCapturedPage() {
    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderReferralHistory(history) {
        var tbody = document.querySelector('.custom-table-wrapper tbody');
        if (!tbody) {
            return;
        }
        if (!Array.isArray(history) || history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5"><div style="min-width: 800px;margin: -16px;padding: 16px;"><div style="padding-top: 32px;padding-bottom: 32px;display: flex;flex-direction: column;align-items: center;justify-content: center;"><img src="/clean/profile/referral/Buy%20%26%20Sell%20Bitcoin%2C%20Ethereum%20_%20Cryptocurrency%20Exchange%20_%20NOHEX%20refferal_files/empty-list.svg" alt="empty"><div style="text-align: center;color: #81858c;margin-top: 16px;font-size: 12px;">No Records</div></div></div></td></tr>';
            return;
        }
        tbody.innerHTML = history.map(function (row) {
            var registered = String(row.registration_time || '').replace('T', ' ').replace('+00:00', ' UTC');
            return '<tr>'
                + '<td>' + escapeHtml(row.user) + '</td>'
                + '<td>' + escapeHtml(registered) + '</td>'
                + '<td>' + escapeHtml(String(row.deposit_amount || '0')) + ' USDT</td>'
                + '<td>' + escapeHtml(String(row.trading_volume || '0')) + ' USDT</td>'
                + '<td><span style="color:#22c55e;font-weight:600;">' + escapeHtml(String(row.reward || '0')) + ' USDT</span></td>'
                + '</tr>';
        }).join('');
    }

    fetch('/api/user/referrals', {
        credentials: 'include'
    }).then(function (response) {
        if (!response.ok) {
            return null;
        }
        return response.json();
    }).then(function (payload) {
        if (!payload) {
            return;
        }
        var code = String(payload.own_referral_code || '').trim();
        var link = String(payload.referral_link || '').trim();
        if (code && link) {
            var secretNodes = document.querySelectorAll('.authentication_component__secret__cod-section__secret');
            if (secretNodes[0]) {
                secretNodes[0].textContent = window.location.origin + link;
            }
            if (secretNodes[1]) {
                secretNodes[1].textContent = code;
            }
        }
        renderReferralHistory(payload.history || []);
    }).catch(function () {});
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReferralCapturedPage);
} else {
    initReferralCapturedPage();
}
