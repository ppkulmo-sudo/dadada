function initCapturedVerificationPage() {
    var state = {
        user: null,
        record: null,
        level: 1,
        step: 1
    };

    function setLevelStatus(levelNode, text, color, typeValue) {
        if (!levelNode) {
            return;
        }
        var textNode = levelNode.querySelector('.a') || levelNode;
        textNode.textContent = text;
        if (color) {
            levelNode.style.backgroundColor = color;
        }
        if (typeValue) {
            levelNode.setAttribute('type', typeValue);
        }
    }

    function setButtonState(button, label, disabled) {
        if (!button) {
            return;
        }
        var contentNode = button.querySelector('.v-btn__content') || button;
        contentNode.textContent = label;
        button.classList.toggle('v-btn--disabled', !!disabled);
        if (disabled) {
            button.setAttribute('disabled', 'disabled');
        } else {
            button.removeAttribute('disabled');
        }
    }

    function injectStyles() {
        if (document.getElementById('kyc-wizard-styles')) {
            return;
        }
        var style = document.createElement('style');
        style.id = 'kyc-wizard-styles';
        style.textContent = [
            'body.kyc-wizard-open{overflow:hidden;}',
            '.kyc-wizard-overlay{position:fixed;inset:0;background:rgba(17,24,39,.55);z-index:5000;display:flex;align-items:center;justify-content:center;padding:24px;}',
            '.kyc-wizard{width:min(760px,100%);max-height:90vh;overflow:auto;background:linear-gradient(180deg,#fffdf8 0%,#ffffff 140px);border-radius:24px;box-shadow:0 30px 80px rgba(15,23,42,.25);padding:28px 28px 24px;font-family:inherit;border:1px solid rgba(247,166,0,.12);}',
            '.kyc-wizard__top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:20px;padding-bottom:18px;border-bottom:1px solid #f3e7c8;}',
            '.kyc-wizard__eyebrow{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border-radius:999px;background:#fff3d6;color:#9a6700;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px;}',
            '.kyc-wizard__title{font-size:28px;font-weight:700;color:#191e28;margin:0;}',
            '.kyc-wizard__subtitle{font-size:14px;line-height:1.6;color:#6b7280;margin:10px 0 0;}',
            '.kyc-wizard__close{border:0;background:#f3f5f7;color:#191e28;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:20px;}',
            '.kyc-wizard__steps{display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap;}',
            '.kyc-wizard__step{flex:1 1 0;padding:10px 12px;border-radius:999px;background:#f3f5f7;color:#6b7280;font-size:13px;font-weight:600;text-align:center;min-width:140px;}',
            '.kyc-wizard__step.active{background:#fff3d6;color:#191e28;border:1px solid #f7a600;}',
            '.kyc-wizard__card{border:1px solid #eef2f6;border-radius:20px;padding:22px;background:#fff;box-shadow:0 12px 32px rgba(15,23,42,.06);}',
            '.kyc-wizard__lead{font-size:15px;line-height:1.6;color:#4b5563;margin:0 0 12px;}',
            '.kyc-wizard__check{display:flex;align-items:flex-start;gap:10px;margin-top:18px;font-size:14px;color:#111827;}',
            '.kyc-wizard__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px;}',
            '.kyc-wizard__doc-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px;}',
            '.kyc-wizard__doc-card{border:1px solid #f3e2b9;border-radius:16px;padding:16px;background:linear-gradient(180deg,#fffaf0 0%,#ffffff 100%);}',
            '.kyc-wizard__doc-title{font-size:14px;font-weight:700;color:#111827;margin-bottom:6px;}',
            '.kyc-wizard__doc-copy{font-size:12px;line-height:1.55;color:#6b7280;}',
            '.kyc-wizard__field{display:flex;flex-direction:column;gap:8px;}',
            '.kyc-wizard__field.full{grid-column:1 / -1;}',
            '.kyc-wizard__label{font-size:13px;font-weight:600;color:#374151;}',
            '.kyc-wizard__input,.kyc-wizard__select{height:48px;border:1px solid #d8dee7;border-radius:12px;padding:0 14px;font-size:14px;color:#111827;background:#fff;}',
            '.kyc-wizard__input[type=file]{padding:10px 14px;height:auto;}',
            '.kyc-wizard__hint{font-size:12px;color:#6b7280;margin-top:6px;}',
            '.kyc-wizard__actions{display:flex;justify-content:space-between;gap:12px;margin-top:24px;}',
            '.kyc-wizard__btn{border:0;border-radius:12px;height:48px;padding:0 20px;font-size:14px;font-weight:600;cursor:pointer;}',
            '.kyc-wizard__btn.secondary{background:#f3f5f7;color:#111827;}',
            '.kyc-wizard__btn.primary{background:#f7a600;color:#111827;}',
            '.kyc-wizard__btn[disabled]{opacity:.55;cursor:not-allowed;}',
            '.kyc-wizard__status{margin-top:12px;font-size:13px;color:#6b7280;min-height:20px;}',
            '.kyc-wizard__file-pill{display:inline-flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:999px;padding:8px 12px;font-size:12px;color:#374151;margin-top:8px;}',
            '@media (max-width: 760px){.kyc-wizard{padding:20px 18px 18px;}.kyc-wizard__grid,.kyc-wizard__doc-list{grid-template-columns:1fr;}}'
        ].join('');
        document.head.appendChild(style);
    }

    function currentLevelStatus(level) {
        var record = state.record || {};
        return String(level === 1 ? (record.level1_status || 'unverified') : (record.level2_status || 'unverified')).toLowerCase();
    }

    function levelRecordValue(key1, key2) {
        var record = state.record || {};
        return state.level === 1 ? (record[key1] || '') : (record[key2] || '');
    }

    function uploadedFlag(key1, key2) {
        var record = state.record || {};
        return !!(state.level === 1 ? record[key1] : record[key2]);
    }

    function initialStep() {
        var record = state.record || {};
        if (state.level === 1) {
            if (!record.country || !record.agreed_terms) {
                return 1;
            }
            if (!record.first_name || !record.last_name || !record.date_of_birth || !record.address_line1 || !record.city || !record.postal_code) {
                return 2;
            }
            return 3;
        }
        if (!record.level2_country || !record.level2_agreed_terms) {
            return 1;
        }
        if (!record.level2_source_of_funds) {
            return 2;
        }
        return 3;
    }

    function wizardTitle() {
        return state.level === 1 ? 'Start verification' : 'Level 2 verification';
    }

    function renderWizard() {
        closeWizard();
        injectStyles();

        var overlay = document.createElement('div');
        overlay.id = 'kyc-wizard-overlay';
        overlay.className = 'kyc-wizard-overlay';
        overlay.innerHTML =
            '<div class="kyc-wizard">' +
                '<div class="kyc-wizard__top">' +
                    '<div>' +
                        '<div class="kyc-wizard__eyebrow">' + (state.level === 1 ? 'Identity review' : 'Proof of address') + '</div>' +
                        '<h2 class="kyc-wizard__title">' + wizardTitle() + '</h2>' +
                        '<p class="kyc-wizard__subtitle">' + (state.level === 1 ? 'Submit your personal identity documents to activate standard account verification.' : 'Upload a recent utility bill or bank statement issued within the last 3 months for advanced withdrawal approval.') + '</p>' +
                    '</div>' +
                    '<button type="button" class="kyc-wizard__close" aria-label="Close">×</button>' +
                '</div>' +
                '<div class="kyc-wizard__steps">' +
                    '<div class="kyc-wizard__step" data-step-indicator="1">Country & Terms</div>' +
                    '<div class="kyc-wizard__step" data-step-indicator="2">' + (state.level === 1 ? 'User Information' : 'Source & Review') + '</div>' +
                    '<div class="kyc-wizard__step" data-step-indicator="3">' + (state.level === 1 ? 'Documents' : 'Proof of Address') + '</div>' +
                '</div>' +
                '<div class="kyc-wizard__card">' +
                    '<div data-step-panel="1">' +
                        '<p class="kyc-wizard__lead">You will need a valid ID to be verified.</p>' +
                        '<p class="kyc-wizard__lead">Your documents will be encrypted and will not be shared with third parties.</p>' +
                        '<p class="kyc-wizard__lead">Please follow the instructions after accepting our terms and conditions.</p>' +
                        '<div class="kyc-wizard__field full">' +
                            '<label class="kyc-wizard__label" for="kyc-country">Country of residence</label>' +
                            '<select id="kyc-country" class="kyc-wizard__select">' +
                                '<option value="">Select country</option>' +
                                '<option value="Australia">Australia</option><option value="Latvia">Latvia</option><option value="Estonia">Estonia</option><option value="Poland">Poland</option><option value="Germany">Germany</option><option value="France">France</option><option value="Spain">Spain</option><option value="Italy">Italy</option><option value="United Kingdom">United Kingdom</option><option value="United States">United States</option><option value="Canada">Canada</option><option value="Turkey">Turkey</option><option value="Japan">Japan</option><option value="Brazil">Brazil</option>' +
                            '</select>' +
                        '</div>' +
                        '<label class="kyc-wizard__check"><input id="kyc-terms" type="checkbox"><span>I agree to the processing of personal data and accept the verification terms.</span></label>' +
                    '</div>' +
                    '<div data-step-panel="2" hidden>' +
                        (state.level === 1
                            ? '<p class="kyc-wizard__lead">Enter your personal information exactly as it appears on your identity document.</p>' +
                              '<div class="kyc-wizard__grid">' +
                              '<div class="kyc-wizard__field"><label class="kyc-wizard__label" for="kyc-first-name">First name</label><input id="kyc-first-name" class="kyc-wizard__input" type="text"></div>' +
                              '<div class="kyc-wizard__field"><label class="kyc-wizard__label" for="kyc-last-name">Last name</label><input id="kyc-last-name" class="kyc-wizard__input" type="text"></div>' +
                              '<div class="kyc-wizard__field"><label class="kyc-wizard__label" for="kyc-dob">Date of birth</label><input id="kyc-dob" class="kyc-wizard__input" type="date"></div>' +
                              '<div class="kyc-wizard__field"><label class="kyc-wizard__label" for="kyc-postal">Postal code</label><input id="kyc-postal" class="kyc-wizard__input" type="text"></div>' +
                              '<div class="kyc-wizard__field full"><label class="kyc-wizard__label" for="kyc-address">Address</label><input id="kyc-address" class="kyc-wizard__input" type="text"></div>' +
                              '<div class="kyc-wizard__field"><label class="kyc-wizard__label" for="kyc-city">City</label><input id="kyc-city" class="kyc-wizard__input" type="text"></div>' +
                              '</div>'
                            : '<p class="kyc-wizard__lead">Level 2 is used for enhanced withdrawal review. Add your source of funds before submitting a recent utility bill or bank statement dated within the last 3 months.</p>' +
                              '<div class="kyc-wizard__grid">' +
                              '<div class="kyc-wizard__field full"><label class="kyc-wizard__label" for="kyc-source-of-funds">Source of funds</label><input id="kyc-source-of-funds" class="kyc-wizard__input" type="text" placeholder="Salary, savings, business income..."></div>' +
                              '</div>')
                        +
                    '</div>' +
                    '<div data-step-panel="3" hidden>' +
                        '<p class="kyc-wizard__lead">' + (state.level === 1 ? 'Upload your selected identification document and selfie.' : 'Upload a utility bill or bank statement that is no older than 3 months.') + '</p>' +
                        (state.level === 2
                            ? '<div class="kyc-wizard__doc-list">' +
                              '<div class="kyc-wizard__doc-card"><div class="kyc-wizard__doc-title">Utility bill</div><div class="kyc-wizard__doc-copy">Electricity, gas, water, internet, or similar bill showing your full name and address. Must be dated within the last 3 months.</div></div>' +
                              '<div class="kyc-wizard__doc-card"><div class="kyc-wizard__doc-title">Bank statement</div><div class="kyc-wizard__doc-copy">A statement from your bank that shows your name and address. It must be dated within the last 3 months.</div></div>' +
                              '</div>'
                            : '') +
                        '<div class="kyc-wizard__grid">' +
                            '<div class="kyc-wizard__field full"><label class="kyc-wizard__label" for="kyc-document-type">Document type</label><select id="kyc-document-type" class="kyc-wizard__select">' +
                                (state.level === 1
                                    ? '<option value="passport">Passport</option><option value="driver_license">Driver license</option><option value="id_card">National ID card</option>'
                                    : '<option value="utility_bill">Utility bill</option><option value="bank_statement">Bank statement</option>') +
                            '</select></div>' +
                            '<div class="kyc-wizard__field full"><label class="kyc-wizard__label" for="kyc-document-number">' + (state.level === 1 ? 'Document number' : 'Reference / account number') + '</label><input id="kyc-document-number" class="kyc-wizard__input" type="text"></div>' +
                            '<div class="kyc-wizard__field"><label class="kyc-wizard__label" for="kyc-front">' + (state.level === 1 ? 'Front side' : 'Primary document') + '</label><input id="kyc-front" class="kyc-wizard__input" type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"></div>' +
                            '<div class="kyc-wizard__field" id="kyc-back-wrapper"><label class="kyc-wizard__label" for="kyc-back">' + (state.level === 1 ? 'Back side' : 'Additional page (optional)') + '</label><input id="kyc-back" class="kyc-wizard__input" type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"></div>' +
                            '<div class="kyc-wizard__field full" id="kyc-selfie-wrapper"><label class="kyc-wizard__label" for="kyc-selfie">Selfie upload</label><input id="kyc-selfie" class="kyc-wizard__input" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></div>' +
                        '</div>' +
                        '<div id="kyc-existing-files" class="kyc-wizard__status"></div>' +
                    '</div>' +
                    '<div id="kyc-status" class="kyc-wizard__status"></div>' +
                    '<div class="kyc-wizard__actions"><button type="button" id="kyc-back-btn" class="kyc-wizard__btn secondary">Back</button><button type="button" id="kyc-next-btn" class="kyc-wizard__btn primary">Continue</button></div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);
        document.body.classList.add('kyc-wizard-open');

        document.getElementById('kyc-country').value = levelRecordValue('country', 'level2_country');
        document.getElementById('kyc-terms').checked = !!(state.level === 1 ? (state.record && state.record.agreed_terms) : (state.record && state.record.level2_agreed_terms));
        if (state.level === 1) {
            document.getElementById('kyc-first-name').value = levelRecordValue('first_name', '');
            document.getElementById('kyc-last-name').value = levelRecordValue('last_name', '');
            document.getElementById('kyc-dob').value = levelRecordValue('date_of_birth', '');
            document.getElementById('kyc-address').value = levelRecordValue('address_line1', '');
            document.getElementById('kyc-city').value = levelRecordValue('city', '');
            document.getElementById('kyc-postal').value = levelRecordValue('postal_code', '');
        } else {
            document.getElementById('kyc-source-of-funds').value = levelRecordValue('', 'level2_source_of_funds');
        }
        document.getElementById('kyc-document-type').value = levelRecordValue('document_type', 'level2_document_type') || (state.level === 1 ? 'passport' : 'utility_bill');
        document.getElementById('kyc-document-number').value = levelRecordValue('document_number', 'level2_document_number');

        overlay.querySelector('.kyc-wizard__close').addEventListener('click', closeWizard);
        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) {
                closeWizard();
            }
        });
        document.getElementById('kyc-back-btn').addEventListener('click', onBackClick);
        document.getElementById('kyc-next-btn').addEventListener('click', onNextClick);
        document.getElementById('kyc-document-type').addEventListener('change', syncDocumentTypeUi);

        state.step = initialStep();
        updateWizardView();
    }

    function closeWizard() {
        var overlay = document.getElementById('kyc-wizard-overlay');
        if (overlay) {
            overlay.remove();
        }
        document.body.classList.remove('kyc-wizard-open');
    }

    function wizardPanel(step) {
        return document.querySelector('[data-step-panel="' + step + '"]');
    }

    function indicator(step) {
        return document.querySelector('[data-step-indicator="' + step + '"]');
    }

    function syncDocumentTypeUi() {
        var type = document.getElementById('kyc-document-type').value;
        var backWrapper = document.getElementById('kyc-back-wrapper');
        var selfieWrapper = document.getElementById('kyc-selfie-wrapper');
        if (backWrapper) {
            backWrapper.hidden = state.level === 1 ? type === 'passport' : false;
        }
        if (selfieWrapper) {
            selfieWrapper.hidden = state.level === 2;
        }
    }

    function renderExistingFiles() {
        var node = document.getElementById('kyc-existing-files');
        if (!node || state.step !== 3) {
            return;
        }
        var parts = [];
        if (uploadedFlag('document_front_uploaded', 'level2_document_front_uploaded')) {
            parts.push('<span class="kyc-wizard__file-pill">Front uploaded</span>');
        }
        if (uploadedFlag('document_back_uploaded', 'level2_document_back_uploaded')) {
            parts.push('<span class="kyc-wizard__file-pill">Back uploaded</span>');
        }
        if (state.level === 1 && uploadedFlag('selfie_uploaded', 'level2_selfie_uploaded')) {
            parts.push('<span class="kyc-wizard__file-pill">Selfie uploaded</span>');
        }
        node.innerHTML = parts.join(' ');
    }

    function updateWizardView() {
        [1, 2, 3].forEach(function (step) {
            var panel = wizardPanel(step);
            var bubble = indicator(step);
            if (panel) {
                panel.hidden = step !== state.step;
            }
            if (bubble) {
                bubble.classList.toggle('active', step === state.step);
            }
        });
        syncDocumentTypeUi();
        var backBtn = document.getElementById('kyc-back-btn');
        var nextBtn = document.getElementById('kyc-next-btn');
        if (backBtn) {
            backBtn.style.visibility = state.step === 1 ? 'hidden' : 'visible';
        }
        if (nextBtn) {
            nextBtn.textContent = state.step === 3 ? 'Submit verification' : 'Continue';
        }
        renderExistingFiles();
    }

    function setWizardStatus(message, isError) {
        var node = document.getElementById('kyc-status');
        if (!node) {
            return;
        }
        node.textContent = message || '';
        node.style.color = isError ? '#dc2626' : '#6b7280';
    }

    function postJson(url, payload) {
        return fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function (response) {
            return response.text().then(function (text) {
                if (!response.ok) {
                    throw new Error(String(text || 'Request failed').trim());
                }
                return String(text || '').trim();
            });
        });
    }

    function onBackClick() {
        if (state.step > 1) {
            state.step -= 1;
            setWizardStatus('', false);
            updateWizardView();
        }
    }

    function onNextClick() {
        setWizardStatus('', false);
        if (state.step === 1) {
            var country = document.getElementById('kyc-country').value;
            var agreed = document.getElementById('kyc-terms').checked;
            if (!country) {
                setWizardStatus('Select your country to continue.', true);
                return;
            }
            if (!agreed) {
                setWizardStatus('Accept the personal data processing terms to continue.', true);
                return;
            }
            postJson('/api/user/verification/start', {
                level: state.level,
                country: country,
                agreed_terms: agreed
            }).then(function () {
                if (!state.record) {
                    state.record = {};
                }
                if (state.level === 1) {
                    state.record.country = country;
                    state.record.agreed_terms = true;
                } else {
                    state.record.level2_country = country;
                    state.record.level2_agreed_terms = true;
                }
                state.step = 2;
                updateWizardView();
            }).catch(function (error) {
                setWizardStatus(error.message, true);
            });
            return;
        }

        if (state.step === 2) {
            if (state.level === 1) {
                var payload = {
                    level: 1,
                    first_name: document.getElementById('kyc-first-name').value.trim(),
                    last_name: document.getElementById('kyc-last-name').value.trim(),
                    date_of_birth: document.getElementById('kyc-dob').value,
                    address_line1: document.getElementById('kyc-address').value.trim(),
                    city: document.getElementById('kyc-city').value.trim(),
                    postal_code: document.getElementById('kyc-postal').value.trim()
                };
                if (!payload.first_name || !payload.last_name || !payload.date_of_birth || !payload.address_line1 || !payload.city || !payload.postal_code) {
                    setWizardStatus('Complete all user information fields to continue.', true);
                    return;
                }
                postJson('/api/user/verification/personal', payload).then(function () {
                    Object.assign(state.record, payload);
                    state.step = 3;
                    updateWizardView();
                }).catch(function (error) {
                    setWizardStatus(error.message, true);
                });
                return;
            }

            var sourceOfFunds = document.getElementById('kyc-source-of-funds').value.trim();
            if (!sourceOfFunds) {
                setWizardStatus('Enter the source of funds to continue.', true);
                return;
            }
            postJson('/api/user/verification/personal', {
                level: 2,
                source_of_funds: sourceOfFunds
            }).then(function () {
                state.record.level2_source_of_funds = sourceOfFunds;
                state.step = 3;
                updateWizardView();
            }).catch(function (error) {
                setWizardStatus(error.message, true);
            });
            return;
        }

        submitDocuments();
    }

    function submitDocuments() {
        var documentType = document.getElementById('kyc-document-type').value;
        var documentNumber = document.getElementById('kyc-document-number').value.trim();
        var front = document.getElementById('kyc-front').files[0];
        var back = document.getElementById('kyc-back').files[0];
        var selfie = document.getElementById('kyc-selfie').files[0];
        var needsBack = state.level === 1 && (documentType === 'driver_license' || documentType === 'id_card');

        if (!documentNumber) {
            setWizardStatus('Enter the selected document number.', true);
            return;
        }
        if (!front) {
            setWizardStatus('Upload the front side of the selected document.', true);
            return;
        }
        if (needsBack && !back) {
            setWizardStatus('Upload the back side of the selected document.', true);
            return;
        }
        if (state.level === 1 && !selfie) {
            setWizardStatus('Upload your selfie to continue.', true);
            return;
        }

        var form = new FormData();
        form.append('level', String(state.level));
        form.append('document_type', documentType);
        form.append('document_number', documentNumber);
        form.append('document_front', front);
        if (back) {
            form.append('document_back', back);
        }
        if (selfie) {
            form.append('selfie', selfie);
        }

        fetch('/api/user/verification/submit', {
            method: 'POST',
            credentials: 'include',
            body: form
        }).then(function (response) {
            return response.text().then(function (text) {
                if (!response.ok) {
                    throw new Error(String(text || 'Upload failed').trim());
                }
                return String(text || '').trim();
            });
        }).then(function (text) {
            if (text !== 'verification.submitted') {
                throw new Error(text);
            }
            window.location.reload();
        }).catch(function (error) {
            setWizardStatus(error.message, true);
        });
    }

    function applyUserState(user, record) {
        state.user = user || state.user;
        state.record = record || state.record || {};

        var level1Status = String(state.record.level1_status || 'unverified').toLowerCase();
        var level2Status = String(state.record.level2_status || 'unverified').toLowerCase();
        var statusNodes = document.querySelectorAll('.verification-level .status');
        var level1Button = document.getElementById('btn-verify-lvl1');
        var level2Button = document.getElementById('btn-verify-lvl2');

        if (level1Status === 'verified') {
            setLevelStatus(statusNodes[0], 'Verified', '#0abe82', 'green');
            setButtonState(level1Button, 'Verified', true);
        } else if (level1Status === 'pending') {
            setLevelStatus(statusNodes[0], 'Pending', '#d2a032', 'brown');
            setButtonState(level1Button, 'Submitted', true);
        } else {
            setLevelStatus(statusNodes[0], 'Unverified', '#828c9b', 'grey');
            setButtonState(level1Button, 'Verify', false);
        }

        if (level2Status === 'verified') {
            setLevelStatus(statusNodes[1], 'Verified', '#0abe82', 'green');
            setButtonState(level2Button, 'Verified', true);
        } else if (level2Status === 'pending') {
            setLevelStatus(statusNodes[1], 'Pending', '#d2a032', 'brown');
            setButtonState(level2Button, 'Submitted', true);
        } else if (level1Status === 'verified') {
            setLevelStatus(statusNodes[1], 'Available', '#f7a600', 'brown');
            setButtonState(level2Button, 'Verify', false);
        } else {
            setLevelStatus(statusNodes[1], 'Locked', '#828c9b', 'grey');
            setButtonState(level2Button, 'Verify', true);
        }
    }

    function openLevel(level, event) {
        if (event) {
            event.preventDefault();
        }
        var status = currentLevelStatus(level);
        if (status === 'pending' || status === 'verified') {
            return false;
        }
        if (level === 2 && currentLevelStatus(1) !== 'verified') {
            return false;
        }
        if (level === 1) {
            window.location.href = '/profile/verification-lvl1/';
            return false;
        }
        state.level = level;
        state.step = initialStep();
        renderWizard();
        return false;
    }

    function bindActions() {
        var level1Button = document.getElementById('btn-verify-lvl1');
        var level2Button = document.getElementById('btn-verify-lvl2');
        if (level1Button) {
            level1Button.onclick = function (event) { return openLevel(1, event); };
        }
        if (level2Button) {
            level2Button.onclick = function (event) { return openLevel(2, event); };
        }
    }

    function loadUserState() {
        return fetch('/api/user/me', {
            credentials: 'include'
        }).then(function (response) {
            if (!response.ok) {
                return null;
            }
            return response.json();
        }).then(function (user) {
            if (!user || user.authenticated !== true) {
                return null;
            }
            if (window.WixiShell && typeof window.WixiShell.setUser === 'function') {
                window.WixiShell.setUser(user);
            }
            state.user = user;
            return user;
        }).catch(function () {
            return null;
        });
    }

    function loadVerificationState() {
        return fetch('/api/user/verification', {
            credentials: 'include'
        }).then(function (response) {
            if (!response.ok) {
                return null;
            }
            return response.json();
        }).catch(function () {
            return null;
        });
    }

    bindActions();
    Promise.all([loadUserState(), loadVerificationState()]).then(function (results) {
        applyUserState(results[0], results[1]);
        var params = new URLSearchParams(window.location.search);
        if (params.get('level') === '2') {
            openLevel(2);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCapturedVerificationPage);
} else {
    initCapturedVerificationPage();
}
