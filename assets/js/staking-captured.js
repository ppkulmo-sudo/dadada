function initStakingCapturedPage() {
    var plansLoaded = false;

    function renderPlans(plans) {
        var activePlans = document.getElementById('active-plans');
        if (!activePlans) {
            return;
        }
        var tbody = activePlans.querySelector('tbody');
        if (!tbody) {
            return;
        }
        if (!plans || plans.length === 0) {
            plansLoaded = true;
            return;
        }
        plansLoaded = true;
        tbody.innerHTML = plans.map(function (plan) {
            return '' +
                '<tr class="staking-active-plan-row">' +
                    '<td class="text-start staking-active-plan-cell" data-label="Asset"><strong>' + plan.symbol + '</strong></td>' +
                    '<td class="text-start staking-active-plan-cell" data-label="Plan">' + plan.days + ' Days / ' + plan.percent + '%</td>' +
                    '<td class="text-start staking-active-plan-cell" data-label="Deposited">' + plan.amount + ' ' + plan.symbol + '</td>' +
                    '<td class="text-start staking-active-plan-cell staking-active-plan-profit" data-label="Realtime Profit">+' + plan.profit + ' ' + plan.symbol + '</td>' +
                    '<td class="text-start staking-active-plan-cell" data-label="Open Time">' + String(plan.created_at || '').replace('T', ' ').replace('+00:00', ' UTC') + '</td>' +
                    '<td class="text-start staking-active-plan-cell" data-label="Close Time">' + String(plan.closes_at || '').replace('T', ' ').replace('+00:00', ' UTC') + '</td>' +
                    '<td class="text-start staking-active-plan-cell staking-active-plan-action" data-label="Action"><button onclick="closeLending(this,' + plan.id + ')" type="button" class="choose-plan__btn main__default-btn main-menu__menu-controls_top-up v-btn v-btn--is-elevated v-btn--has-bg theme--light v-size--default"><span class="v-btn__content">Close</span></button></td>' +
                '</tr>';
        }).join('');
    }

    function loadPlans() {
        fetch('/api/user/lending', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'LIST_LENDING' })
        }).then(function (response) {
            if (!response.ok) {
                return [];
            }
            return response.json();
        }).then(renderPlans).catch(function () {});
    }

    function refreshStakingState() {
        var authorized = document.getElementById('user-authorized');
        if (!authorized || authorized.value === 'false') {
            return;
        }
        if (typeof window.updateBalances === 'function') {
            try {
                window.updateBalances();
            } catch (_error) {
            }
        }
        loadPlans();
    }

    if (document.getElementById('user-authorized') && document.getElementById('user-authorized').value !== 'false') {
        loadPlans();
    }

    window.addEventListener('wixi:user', function (event) {
        var user = event && event.detail ? event.detail.user : null;
        if (user && user.authenticated) {
            refreshStakingState();
        } else if (plansLoaded) {
            var activePlans = document.getElementById('active-plans');
            var tbody = activePlans ? activePlans.querySelector('tbody') : null;
            if (tbody) {
                tbody.innerHTML = '';
            }
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStakingCapturedPage);
} else {
    initStakingCapturedPage();
}
