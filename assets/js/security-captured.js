function initCapturedSecurityPage() {
    function applyTwoFactorSetup(setup) {
        var qrImage = document.querySelector('.authentication_component__secret__qr img, .authentication_component__secret__qr .v-image__image');
        var secretNode = document.getElementById('copy_code');
        if (secretNode && setup && setup.secret) {
            secretNode.textContent = setup.secret;
        }
        if (qrImage && setup && setup.qr_url) {
            qrImage.src = setup.qr_url;
            qrImage.alt = 'Authenticator QR Code';
        }
    }

    function loadTwoFactorSetup() {
        fetch('/api/user/settings', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'GET_2FA_SETUP'
            })
        }).then(function (response) {
            if (!response.ok) {
                return null;
            }
            return response.json();
        }).then(function (setup) {
            if (!setup) {
                return;
            }
            applyTwoFactorSetup(setup);
        }).catch(function () {
        });
    }

    function ensureAntiPhishingDisableButton() {
        var wrapper = document.querySelector('.settings-promocode-wrapper');
        if (!wrapper || document.getElementById('antiphishing-disable')) {
            return;
        }

        var button = document.createElement('button');
        button.id = 'antiphishing-disable';
        button.type = 'button';
        button.className = 'settings-promocode-btn main__default-btn main-menu__menu-controls_top-up v-btn v-btn--is-elevated v-btn--has-bg theme--light v-size--default';
        button.style.marginLeft = '12px';
        button.innerHTML = '<span class="v-btn__content">Disable</span>';
        wrapper.appendChild(button);
    }

    function removeAntiPhishingDisableButton() {
        var button = document.getElementById('antiphishing-disable');
        if (button) {
            button.remove();
        }
    }

    function applyUserState(user) {
        var statuses = document.querySelectorAll('.settings-security-status');
        var twoFactorEnabled = !!(user && user.google_2fa_enabled);
        var antiPhishingEnabled = !!(user && user.anti_phishing_enabled);
        var twoFactorInput = document.getElementById('two_factor_status');
        var twoFactorButton = document.querySelector('.connect-2fa-btn .v-btn__content, .connect-2fa-btn');
        var antiButton = document.querySelector('#antiphishing-enable .v-btn__content, #antiphishing-enable');

        if (statuses[0]) {
            statuses[0].textContent = twoFactorEnabled ? 'Enabled' : 'Disabled';
            statuses[0].classList.toggle('settings-security-status-disabled', !twoFactorEnabled);
            statuses[0].style.color = twoFactorEnabled ? '#69d983' : '';
            statuses[0].style.backgroundColor = twoFactorEnabled ? 'rgba(105, 217, 131, 0.14)' : '';
        }
        if (statuses[1]) {
            statuses[1].textContent = antiPhishingEnabled ? 'Enabled' : 'Disabled';
            statuses[1].classList.toggle('settings-security-status-disabled', !antiPhishingEnabled);
            statuses[1].style.color = antiPhishingEnabled ? '#69d983' : '';
            statuses[1].style.backgroundColor = antiPhishingEnabled ? 'rgba(105, 217, 131, 0.14)' : '';
        }

        if (twoFactorInput) {
            twoFactorInput.value = twoFactorEnabled ? 'true' : 'false';
        }
        if (twoFactorButton) {
            twoFactorButton.textContent = twoFactorEnabled ? 'Disable' : 'Connect';
        }
        if (antiButton) {
            antiButton.textContent = antiPhishingEnabled ? 'Change' : 'Enable';
        }

        if (antiPhishingEnabled) {
            ensureAntiPhishingDisableButton();
        } else {
            removeAntiPhishingDisableButton();
        }
    }

    function loadUserState() {
        if (window.WixiShell && typeof window.WixiShell.getUser === 'function') {
            applyUserState(window.WixiShell.getUser());
        }
        loadTwoFactorSetup();

        fetch('/api/user/me', {
            credentials: 'include'
        }).then(function (response) {
            if (!response.ok) {
                return null;
            }
            return response.json();
        }).then(function (user) {
            if (!user || user.authenticated !== true) {
                return;
            }
            if (window.WixiShell && typeof window.WixiShell.setUser === 'function') {
                window.WixiShell.setUser(user);
            }
            applyUserState(user);
            loadTwoFactorSetup();
        }).catch(function () {
        });
    }

    loadUserState();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCapturedSecurityPage);
} else {
    initCapturedSecurityPage();
}
