function initCleanSignup() {
    const emailInputWrapper = $("#email-input-wrapper");
    const emailLabel = $("#email-label");
    const emailInput = $("#email-input");

    const passwordInputWrapper = $("#password-input-wrapper");
    const passwordLabel = $("#password-label");
    const passwordInput = $("#password-input");
    const showPassword = $("#show-password");

    const passwordInputWrapper2 = $("#password-input-wrapper-2");
    const passwordLabel2 = $("#password-label-2");
    const passwordInput2 = $("#password-input-2");
    const showPassword2 = $("#show-password-2");

    const promocodeInputWrapper = $("#promo-input-wrapper");
    const promoLabel = $("#promo-label");
    const promocodeInput = $("#promo-input");

    const referralInputWrapper = $("#referral-input-wrapper");
    const referralLabel = $("#referral-label");
    const referralInput = $("#referral-input");
    const captchaInputWrapper = $("#captcha-input-wrapper");
    const captchaLabel = $("#captcha-label");
    const captchaInput = $("#captcha-input");
    const captchaImage = $("#captcha-img");

    const checkboxPolicyWrapper = $("#checkbox-policy");
    const checkboxPolicy = $("#checkbox-policy-input");
    const regButton = $("#regBtn");

    const errorsSection = $("#errors-section");
    const successPassword = $("#success-password");
    const passwordRepeatError = $("#error-password-repeat");
    const errorSymbols = $("#error-symbols");
    const errorUpper = $("#error-upper");
    const errorNumber = $("#error-number");
    const errorBlockedSymbols = $("#error-blocked-symbols");
    const errorEmail = $("#error-email");
    const error1 = $("#error-1");
    const error2 = $("#error-2");

    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d_!@#$%^&*(),.?":{}|<>]{8,30}$/;
    const referralPattern = /^[A-Za-z0-9_]{8}$/;
    const promoPattern = /^[A-Za-z0-9_]{4,16}$/;

    let emailValid = false;
    let passwordValid = false;
    let passwordRepeatValid = false;
    let policyAccepted = checkboxPolicy.is(":checked");
    let promocodeValid = true;
    let referralValid = true;
    let captchaToken = "";
    let captchaReady = false;

    function ensureStatusBox() {
        let box = $("#auth-status");
        if (box.length) {
            return box;
        }

        box = $('<div id="auth-status" class="error-form" style="display:none;"></div>');
        $(".register .register-body").append(box);
        return box;
    }

    const statusBox = ensureStatusBox();

    function setFieldState(label, value) {
        if (value && value.length > 0) {
            label.addClass("v-label--active");
        } else {
            label.removeClass("v-label--active");
        }
    }

function setBusy(isBusy) {
        regButton.prop("disabled", isBusy);
        regButton.toggleClass("v-btn--disabled", isBusy);
        regButton.find(".v-btn__content").text(isBusy ? "Creating Account..." : "Continue");
}

function currentLangRedirect(path) {
    const url = new URL(path, window.location.href);
    const lang = new URLSearchParams(window.location.search).get("lang");
    if (lang && lang.toLowerCase() !== "en") {
        url.searchParams.set("lang", lang.toLowerCase());
    }
    return url.pathname + url.search + url.hash;
}

    function setCaptchaReady(isReady) {
        captchaReady = isReady;
        regButton.prop("disabled", !isReady);
        regButton.toggleClass("v-btn--disabled", !isReady);
        if (!isReady) {
            regButton.find(".v-btn__content").text("Loading Captcha...");
        } else if (!regButton.prop("disabled")) {
            regButton.find(".v-btn__content").text("Continue");
        }
    }

    function showStatus(message, isSuccess) {
        statusBox
            .text(message)
            .css("display", "flex")
            .css("background", isSuccess ? "rgba(42, 157, 87, 0.18)" : "")
            .css("color", isSuccess ? "#b8ffd2" : "");
    }

    function normalizeResponse(response) {
        if (typeof response === "string") {
            return response.trim();
        }
        return response;
    }

    function hideStatus() {
        statusBox.hide().text("").css("background", "").css("color", "");
        error1.hide();
        error2.hide();
    }

    function setCaptchaFieldState(isError) {
        captchaInputWrapper.toggleClass("error--text", isError);
    }

    function loadCaptcha() {
        captchaToken = "";
        setCaptchaReady(false);
        captchaInput.val("");
        setFieldState(captchaLabel, "");
        setCaptchaFieldState(false);
        captchaImage.attr("src", "");

        $.ajax({
            url: "/api/auth/captcha",
            type: "GET",
            dataType: "json",
            cache: false,
            success: function (response) {
                captchaToken = response && response.token ? response.token : "";
                if (response && response.image) {
                    captchaImage.attr("src", response.image);
                }
                setCaptchaReady(captchaToken.length > 0 && !!(response && response.image));
            },
            error: function () {
                showStatus("Captcha could not be loaded. Refresh and try again.", false);
                setCaptchaReady(false);
            }
        });
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    }

    function validatePassword(password) {
        return passwordPattern.test(password);
    }

    function updatePasswordIndicators(password) {
        const lengthValid = password.length >= 8 && password.length <= 30;
        const uppercaseValid = /[A-Z]/.test(password);
        const numberValid = /\d/.test(password);
        const blockedValid = /^[A-Za-z\d_!@#$%^&*(),.?":{}|<>]*$/.test(password);

        errorSymbols.toggleClass("success-code__error", lengthValid);
        errorUpper.toggleClass("success-code__error", uppercaseValid);
        errorNumber.toggleClass("success-code__error", numberValid);
        errorBlockedSymbols.toggleClass("success-code__error", blockedValid);
        errorBlockedSymbols.css("display", blockedValid ? "none" : "flex");

        passwordValid = validatePassword(password);
        passwordInputWrapper.toggleClass("error--text", !passwordValid && password.length > 0);
        errorsSection.toggleClass("error-red", !passwordValid && password.length > 0);
        errorsSection.css("display", password.length > 0 && !passwordValid ? "flex" : "none");
        successPassword.css("display", passwordValid ? "flex" : "none");
    }

    function updateRepeatPassword() {
        const matches = passwordInput2.val() === passwordInput.val() && passwordInput2.val().length > 0;
        passwordRepeatValid = matches;
        passwordInputWrapper2.toggleClass("error--text", !matches && passwordInput2.val().length > 0);
        passwordRepeatError.css("display", !matches && passwordInput2.val().length > 0 ? "" : "none");
    }

    function toggleCheckboxState() {
        const icon = checkboxPolicyWrapper.find("i");
        policyAccepted = checkboxPolicy.is(":checked");
        checkboxPolicyWrapper.toggleClass("error--text", !policyAccepted);
        checkboxPolicyWrapper.toggleClass("v-input--is-dirty", !policyAccepted);
        checkboxPolicyWrapper.toggleClass("primary--text", policyAccepted);
        icon.toggleClass("material-icons", !policyAccepted);
        icon.toggleClass("error--text", !policyAccepted);
        icon.toggleClass("mdi", policyAccepted);
        icon.toggleClass("mdi-check", policyAccepted);
        icon.toggleClass("primary--text", policyAccepted);
    }

    function setupInput(wrapper, label, input, validator, errorNode) {
        input.on("focus", function () {
            wrapper.addClass("v-input--is-focused");
            label.addClass("v-label--active");
        });

        input.on("blur", function () {
            wrapper.removeClass("v-input--is-focused");
            setFieldState(label, input.val());
        });

        input.on("input", function () {
            const value = input.val().trim();
            const isValid = validator(value);
            wrapper.toggleClass("error--text", value.length > 0 && !isValid);
            if (errorNode) {
                errorNode.css("display", value.length > 0 && !isValid ? "flex" : "none");
            }
            hideStatus();
        });
    }

    error2.text("Registration failed. Try again.");
    error1.text("This e-mail is already registered.");

    captchaImage.css("cursor", "pointer").attr("title", "Click to refresh captcha");

    const emailFromQuery = new URLSearchParams(window.location.search).get("email");
    const referralFromQuery = new URLSearchParams(window.location.search).get("ref");
    if (emailFromQuery) {
        emailInput.val(emailFromQuery);
        emailValid = validateEmail(emailFromQuery);
        setFieldState(emailLabel, emailFromQuery);
    }
    if (referralFromQuery) {
        referralInputWrapper.show();
        referralInput.val(referralFromQuery);
        referralValid = referralPattern.test(referralFromQuery);
        setFieldState(referralLabel, referralFromQuery);
    }

    setupInput(emailInputWrapper, emailLabel, emailInput, validateEmail, errorEmail);
    setupInput(promocodeInputWrapper, promoLabel, promocodeInput, function (value) {
        promocodeValid = value.length === 0 || promoPattern.test(value);
        return promocodeValid;
    });
    setupInput(referralInputWrapper, referralLabel, referralInput, function (value) {
        referralValid = value.length === 0 || referralPattern.test(value);
        return referralValid;
    });

    emailInput.on("input", function () {
        emailValid = validateEmail(emailInput.val().trim());
    });

    passwordInput.on("focus", function () {
        passwordInputWrapper.addClass("v-input--is-focused");
        passwordLabel.addClass("v-label--active");
    });

    passwordInput.on("blur", function () {
        passwordInputWrapper.removeClass("v-input--is-focused");
        setFieldState(passwordLabel, passwordInput.val());
    });

    passwordInput.on("input", function () {
        updatePasswordIndicators(passwordInput.val());
        updateRepeatPassword();
        hideStatus();
    });

    passwordInput2.on("focus", function () {
        passwordInputWrapper2.addClass("v-input--is-focused");
        passwordLabel2.addClass("v-label--active");
    });

    passwordInput2.on("blur", function () {
        passwordInputWrapper2.removeClass("v-input--is-focused");
        setFieldState(passwordLabel2, passwordInput2.val());
    });

    passwordInput2.on("input", function () {
        updateRepeatPassword();
        hideStatus();
    });

    captchaInput.on("focus", function () {
        captchaInputWrapper.addClass("v-input--is-focused");
        captchaLabel.addClass("v-label--active");
    });

    captchaInput.on("blur", function () {
        captchaInputWrapper.removeClass("v-input--is-focused");
        setFieldState(captchaLabel, captchaInput.val());
    });

    captchaInput.on("input", function () {
        captchaInput.val(captchaInput.val().replace(/\D/g, "").slice(0, 5));
        setCaptchaFieldState(false);
        hideStatus();
    });

    captchaImage.on("click", function () {
        hideStatus();
        loadCaptcha();
    });

    function syncPasswordToggle(input, toggle, isVisible) {
        input.attr("type", isVisible ? "text" : "password");
        toggle.toggleClass("mdi-eye", isVisible);
        toggle.toggleClass("mdi-eye-off", !isVisible);
    }

    syncPasswordToggle(passwordInput, showPassword, false);
    syncPasswordToggle(passwordInput2, showPassword2, false);

    showPassword.off("click").on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        const isVisible = passwordInput.attr("type") === "text";
        syncPasswordToggle(passwordInput, showPassword, !isVisible);
    });

    showPassword2.off("click").on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        const isVisible = passwordInput2.attr("type") === "text";
        syncPasswordToggle(passwordInput2, showPassword2, !isVisible);
    });

    checkboxPolicy.on("click", function () {
        toggleCheckboxState();
        hideStatus();
    });

    checkboxPolicy.on("focus", function () {
        checkboxPolicyWrapper.addClass("v-input--is-focused");
    });

    checkboxPolicy.on("blur", function () {
        checkboxPolicyWrapper.removeClass("v-input--is-focused");
    });

    $("#promo-input-show").on("click", function () {
        promocodeInputWrapper.toggle();
    });

    $("#referral-input-show").on("click", function () {
        referralInputWrapper.toggle();
    });

    regButton.on("click", function (event) {
        event.preventDefault();
        hideStatus();

        const email = emailInput.val().trim().toLowerCase();
        const password = passwordInput.val();
        const promocode = promocodeInput.val().trim();
        const referralCode = referralInput.val().trim();
        const captcha = captchaInput.val().trim();

        emailValid = validateEmail(email);
        promocodeValid = promocode.length === 0 || promoPattern.test(promocode);
        referralValid = referralCode.length === 0 || referralPattern.test(referralCode);
        updatePasswordIndicators(password);
        updateRepeatPassword();
        toggleCheckboxState();

        emailInputWrapper.toggleClass("error--text", !emailValid);
        errorEmail.css("display", !emailValid ? "flex" : "none");
        promocodeInputWrapper.toggleClass("error--text", !promocodeValid && promocode.length > 0);
        referralInputWrapper.toggleClass("error--text", !referralValid && referralCode.length > 0);
        setCaptchaFieldState(captcha.length === 0);

        if (!captchaReady || !emailValid || !passwordValid || !passwordRepeatValid || !policyAccepted || !promocodeValid || !referralValid || captcha.length === 0 || !captchaToken) {
            if (captcha.length === 0 || !captchaToken) {
                showStatus("Enter the captcha before creating the account.", false);
            } else {
                showStatus("Complete the form before creating the account.", false);
            }
            if (!captchaToken) {
                loadCaptcha();
            }
            return;
        }

        setBusy(true);

        $.ajax({
            url: "/api/auth/register",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                email: email,
                password: password,
                promocode: promocode,
                referral_code: referralCode,
                captcha: captcha,
                captcha_token: captchaToken
            }),
            success: function (response) {
                const result = normalizeResponse(response);
                console.log("signup response", result);

                if (result === "success") {
                    if (window.WixiShell) {
                        window.WixiShell.persistUser({
                            authenticated: true,
                            email: email,
                            verification_status: "unverified"
                        });
                    }
                    showStatus("Account created. Redirecting to your profile...", true);
                    window.setTimeout(function () {
                        window.location.replace(currentLangRedirect("../profile/wallet/"));
                    }, 500);
                    return;
                }

                if (result === "email_already_exists") {
                    error1.css("display", "flex");
                    loadCaptcha();
                    return;
                }

                if (result === "password_invalid") {
                    showStatus("Password must be 8-30 chars, include one uppercase letter and one number.", false);
                    loadCaptcha();
                    return;
                }

                if (result === "email_invalid") {
                    showStatus("Enter a valid e-mail address.", false);
                    loadCaptcha();
                    return;
                }

                if (result === "captcha_invalid") {
                    error2.text("The captcha was entered incorrectly.").css("display", "flex");
                    setCaptchaFieldState(true);
                    loadCaptcha();
                    return;
                }

                showStatus("Unexpected signup response: " + String(result || "empty response"), false);
                error2.css("display", "flex");
                loadCaptcha();
            },
            error: function (xhr, textStatus) {
                const responseText = xhr && xhr.responseText ? String(xhr.responseText).trim() : "";
                const message = responseText || textStatus || "request failed";
                console.error("signup request failed", xhr && xhr.status, message);
                showStatus("Signup request failed: " + message, false);
                error2.css("display", "flex");
                loadCaptcha();
            },
            complete: function () {
                setBusy(false);
            }
        });
    });

    updatePasswordIndicators(passwordInput.val());
    updateRepeatPassword();
    toggleCheckboxState();
    setFieldState(emailLabel, emailInput.val());
    setFieldState(passwordLabel, passwordInput.val());
    setFieldState(passwordLabel2, passwordInput2.val());
    setFieldState(promoLabel, promocodeInput.val());
    setFieldState(referralLabel, referralInput.val());
    setFieldState(captchaLabel, captchaInput.val());
    setCaptchaReady(false);
    loadCaptcha();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCleanSignup, { once: true });
} else {
    initCleanSignup();
}
