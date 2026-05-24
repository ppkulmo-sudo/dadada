function initCapturedSettingsPage() {
    var notConfiguredIcon = '/assets/img/info.svg';
    var warningIcon = '/assets/img/banners/warning.png';
    var arrowRightIcon = '/assets/img/profile/arrow-right.svg';

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function setConfiguredBadge(node) {
        if (!node) {
            return;
        }

        node.classList.remove('settings-account-item-unready');
        node.classList.add('settings-account-item-ready');
        node.innerHTML = '<i class="mdi mdi-check-circle" aria-hidden="true" style="color:#22c55e;margin-right:6px;font-size:18px;vertical-align:middle;"></i><span>Set up</span>';
    }

    function setUnconfiguredBadge(node) {
        if (!node) {
            return;
        }

        node.classList.remove('settings-account-item-ready');
        node.classList.add('settings-account-item-unready');
        node.innerHTML = '<img src="' + notConfiguredIcon + '" alt="not configured">Not Configured';
    }

    function statusIsConfigured(value) {
        return value === true || value === 1 || value === '1';
    }

    function setActionLabel(node, text) {
        if (!node) {
            return;
        }

        var contentNode = node.querySelector('.v-btn__content');
        if (contentNode) {
            contentNode.textContent = text;
            return;
        }

        node.textContent = text;
    }

    function updateAccountSummary(user, statuses) {
        var statusNode = document.querySelectorAll('.settings-account-info-item-description')[1];
        var securityNode = document.querySelectorAll('.settings-account-info-item-description')[3];
        var bannerNode = document.querySelector('.settings-security-banner-top-text');
        var bannerBottomNode = document.querySelector('.settings-security-banner-bottom-text');

        if (statusNode) {
            var verificationStatus = String(user && user.verification_status || 'unverified').toLowerCase();
            statusNode.textContent = verificationStatus === 'verified' ? 'Verified' : (verificationStatus === 'pending' ? 'Pending' : 'Unverified');
            statusNode.classList.toggle('settings-account-info-item-description-disabled', verificationStatus === 'unverified');
        }

        var configuredCount = statuses.filter(Boolean).length;
        var securityLevel = 'Low';
        if (configuredCount >= 4) {
            securityLevel = 'High';
        } else if (configuredCount >= 2) {
            securityLevel = 'Medium';
        }

        if (securityNode) {
            securityNode.textContent = securityLevel;
            securityNode.classList.toggle('settings-account-info-item-description-disabled', securityLevel === 'Low');
        }

        if (bannerNode) {
            if (securityLevel === 'High') {
                bannerNode.textContent = 'Your account security level is High. All recommended security settings are configured.';
            } else {
                bannerNode.textContent = 'Your account security level is ' + securityLevel + '. Please set up the following as soon as possible.';
            }
        }

        if (bannerBottomNode) {
            if (!statuses[2]) {
                bannerBottomNode.innerHTML = '<img src="' + warningIcon + '" alt="warning"><a href="/profile/security/" style="color: #ef454a">Google 2FA Authentication</a> <img src="' + arrowRightIcon + '" alt="arrow">';
            } else if (!statuses[3]) {
                bannerBottomNode.innerHTML = '<img src="' + warningIcon + '" alt="warning"><a href="/profile/security/" style="color: #ef454a">Anti-Phishing Code</a> <img src="' + arrowRightIcon + '" alt="arrow">';
            } else if (!statuses[1]) {
                bannerBottomNode.innerHTML = '<img src="' + warningIcon + '" alt="warning"><a href="/profile/verification/" style="color: #ef454a">Identity Verification</a> <img src="' + arrowRightIcon + '" alt="arrow">';
            } else {
                bannerBottomNode.innerHTML = '<i class="mdi mdi-check-circle" aria-hidden="true" style="color:#22c55e;margin-right:6px;font-size:18px;vertical-align:middle;"></i><span style="color:#22c55e">All security items are configured.</span>';
            }
        }
    }

    function updateSettingsStatuses(user) {
        var rows = document.querySelectorAll('.settings-account-item');
        if (!rows.length) {
            return;
        }

        var statuses = [
            !!(user && user.profile_photo_url),
            !!(user && String(user.verification_status || '').toLowerCase() === 'verified'),
            !!(user && statusIsConfigured(user.google_2fa_enabled)),
            !!(user && statusIsConfigured(user.anti_phishing_enabled))
        ];

        rows.forEach(function (row, index) {
            var badge = row.querySelector('.settings-account-item-status');
            var actionButton = row.querySelector('button, a.main__default-btn');

            if (statuses[index]) {
                setConfiguredBadge(badge);
            } else {
                setUnconfiguredBadge(badge);
            }

            if (!actionButton) {
                return;
            }

            if (index === 0) {
                return;
            }

            if (index === 1) {
                if (statuses[index]) {
                    setActionLabel(actionButton, 'Verified');
                    actionButton.setAttribute('disabled', 'disabled');
                    actionButton.style.opacity = '0.7';
                    actionButton.style.pointerEvents = 'none';
                } else {
                    setActionLabel(actionButton, 'Verify Now');
                    actionButton.removeAttribute('disabled');
                    actionButton.style.opacity = '';
                    actionButton.style.pointerEvents = '';
                }
                return;
            }

            if (index === 2) {
                setActionLabel(actionButton, statuses[index] ? 'Disable' : 'Set up');
                return;
            }

            if (index === 3) {
                setActionLabel(actionButton, statuses[index] ? 'Change' : 'Set up');
            }
        });

        updateAccountSummary(user, statuses);
    }

    function postSettingsAction(payload, expectedResponse) {
        return $.ajax({
            url: "/api/user/settings",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload)
        }).then(function (response) {
            response = String(response || '').trim();
            if (response !== expectedResponse) {
                throw new Error(response);
            }
            return response;
        });
    }

    function bindSecurityActions() {
        var rows = document.querySelectorAll('.settings-account-item');
        if (rows.length < 4) {
            return;
        }

        var verificationButton = rows[1].querySelector('button, a.main__default-btn');
        if (verificationButton) {
            if (verificationButton.tagName === 'A') {
                verificationButton.setAttribute('href', '/profile/verification/');
            }
            verificationButton.onclick = function (event) {
                if (verificationButton.hasAttribute('disabled')) {
                    event.preventDefault();
                    return false;
                }
                window.location.href = '/profile/verification/';
                return false;
            };
        }

        var twoFaButton = rows[2].querySelector('button, a.main__default-btn');
        if (twoFaButton) {
            if (twoFaButton.tagName === 'A') {
                twoFaButton.setAttribute('href', '/profile/security/');
            }
            $(twoFaButton).off('click').on('click', function (event) {
                event.preventDefault();
                window.location.href = '/profile/security/';
                return false;
            });
        }

        var antiPhishingButton = rows[3].querySelector('button, a.main__default-btn');
        if (antiPhishingButton) {
            if (antiPhishingButton.tagName === 'A') {
                antiPhishingButton.setAttribute('href', '/profile/security/');
            }
            $(antiPhishingButton).off('click').on('click', function (event) {
                event.preventDefault();
                window.location.href = '/profile/security/';
                return false;
            });
        }
    }

    function loadSettingsUserState() {
        if (window.WixiShell && typeof window.WixiShell.getUser === 'function') {
            updateSettingsStatuses(window.WixiShell.getUser());
        }

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

            updateSettingsStatuses(user);
        }).catch(function () {
        });
    }

    function refreshSettingsPageNow() {
        var next = new URL(window.location.href);
        next.searchParams.set("_refresh", String(Date.now()));
        window.location.href = next.pathname + next.search + next.hash;
    }

    $("#avatar_remove_btn").off('click').on('click', () => {
        $.ajax({
            url: "/api/user/settings",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                action: 'REMOVE_PROFILE_PHOTO'
            }),
            success: function (response) {
                response = String(response || '').trim();
                if (response === 'user.api.removed.photo') {
                    refreshSettingsPageNow();
                } else {
                    noti(getMessage(response), 'error');
                }
            }
        })
    });

    $("#avatar_upload_btn").off('click').on('click', function (event) {
        event.preventDefault();

        $("#profile_photo_input").click();
    });

    $("#profile_photo_input").off('change').on('change', function() {
        var photo_input = $(this).val();

        if (photo_input === '') {
            return;
        }

        var profile_photo = $("#profile_photo_input")[0].files[0];

        var form = new FormData();
        form.append('image', profile_photo);

        $.ajax({
            url: "/api/user/updatePhoto",
            data: form,
            cache: false,
            contentType: false,
            processData: false,
            type: 'POST',
            success: function (response) {
                response = String(response || '').trim();
                if (response === 'user.api.changed.photo') {
                    $("#profile_photo_input").val("");
                    refreshSettingsPageNow();
                } else {
                    noti(getMessage(response), 'error');
                }
            }
        });
    });

    waitingMessagesLoading();

    function onMessagesLoaded() {
        const uidEl = $('.settings-account-info-uid');
        copyWithButton(uidEl.find('svg'), getMessage('profile.uid.copied'), () => copyToClipboard(uidEl.text().split(' ')[1].trim()));
    }

    function waitingMessagesLoading() {
        if (messagesLoaded) {
            onMessagesLoaded();
            return;
        }

        setTimeout(() => {
            waitingMessagesLoading();
        }, 50);
    }

    bindSecurityActions();
    loadSettingsUserState();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCapturedSettingsPage);
} else {
    initCapturedSettingsPage();
}
