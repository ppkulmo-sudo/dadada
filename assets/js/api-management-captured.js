function initApiManagementCapturedPage() {
    var createButton = document.querySelector('.settings-create-key-btn');
    var tbody = document.querySelector('.custom-table-wrapper tbody');

    function permissionNames(entry) {
        if (Array.isArray(entry.permissions)) {
            return entry.permissions.join(', ');
        }
        return '';
    }

    function maskSecret(secret) {
        var value = String(secret || '');
        if (value.length <= 10) {
            return value;
        }
        return value.slice(0, 8) + '...' + value.slice(-4);
    }

    function renderRows(rows) {
        if (!tbody) {
            return;
        }
        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5"><div style="min-width: 800px;margin: -16px;padding: 16px;"><div style="padding-top: 32px;padding-bottom: 32px;display: flex;flex-direction: column;align-items: center;justify-content: center;"><img src="./Buy &amp; Sell Bitcoin, Ethereum _ Cryptocurrency Exchange _ NOHEX api management_files/empty-list.svg" alt="empty"><div style="text-align: center;color: #81858c;margin-top: 16px;font-size: 12px;">No Records</div></div></div></td></tr>';
            return;
        }
        tbody.innerHTML = rows.map(function (row) {
            return '' +
                '<tr>' +
                    '<td><div class="secret-cod-copy-section"><div class="secret-cod-copy-section__text-section"><p class="authentication_component__secret__cod-section__secret">' + maskSecret(row.secret_key) + '</p></div></div></td>' +
                    '<td>' + permissionNames(row) + '</td>' +
                    '<td>' + String(row.created_at || '').replace('T', ' ').replace('+00:00', ' UTC') + '</td>' +
                    '<td>' + String(row.status || 'active') + '</td>' +
                    '<td><button type="button" id="api_key_' + row.id + '" class="settings-api-key-delete-btn main__default-btn main-menu__menu-controls_top-up v-btn v-btn--is-elevated v-btn--has-bg theme--light v-size--default"><span class="v-btn__content">Delete</span></button></td>' +
                '</tr>';
        }).join('');
        bindDeleteButtons();
    }

    function loadKeys() {
        fetch('/api/user/settings', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'GET_API_KEYS' })
        }).then(function (response) {
            return response.text().then(function (text) {
                if (!response.ok) {
                    throw new Error(text || 'Failed to load API keys');
                }
                return JSON.parse(text || '[]');
            });
        }).then(renderRows).catch(function () {});
    }

    function bindDeleteButtons() {
        document.querySelectorAll('.settings-api-key-delete-btn').forEach(function (button) {
            button.onclick = function (event) {
                event.preventDefault();
                var id = String(button.id || '').split('_')[2];
                fetch('/api/user/settings', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'DELETE_API_KEY', id: id })
                }).then(function (response) {
                    return response.text();
                }).then(function () {
                    loadKeys();
                }).catch(function () {});
            };
        });
    }

    if (createButton) {
        createButton.onclick = function (event) {
            event.preventDefault();
            var payload = { action: 'CREATE_API_KEY' };
            var selected = false;
            for (var i = 1; i <= 6; i += 1) {
                var checked = !!document.getElementById('checkbox-permission' + i)?.checked;
                payload['permission_' + i] = checked;
                if (checked) {
                    selected = true;
                }
            }
            if (!selected) {
                if (typeof noti === 'function') {
                    noti('Select at least one permission.', 'error');
                }
                return false;
            }
            fetch('/api/user/settings', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(function (response) {
                return response.text().then(function (text) {
                    if (!response.ok) {
                        throw new Error(text || 'Failed to create API key');
                    }
                    return text;
                });
            }).then(function () {
                if (typeof noti === 'function') {
                    noti('API key created.', 'success');
                }
                loadKeys();
            }).catch(function (error) {
                if (typeof noti === 'function') {
                    noti(error.message || 'Failed to create API key.', 'error');
                }
            });
            return false;
        };
    }

    loadKeys();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApiManagementCapturedPage);
} else {
    initApiManagementCapturedPage();
}
