function initCleanSignin() {
    const emailInputWrapper = $("#email-input-wrapper");
    const emailLabel = $("#email-label");
    const emailInput = $("#email-input");
    const passwordInputWrapper = $("#password-input-wrapper");
    const passwordLabel = $("#password-label");
    const passwordInput = $("#password-input");
    const showPassword = $("#show-password");
    const captchaInputWrapper = $("#captcha-input-wrapper");
    const captchaLabel = $("#captcha-label");
    const captchaInput = $("#captcha-input");
    const captchaImage = $("#captcha-img");
    const twofaSection = $("#twofa-section");
    const twofaInputWrapper = $("#twofa-input-wrapper");
    const twofaLabel = $("#twofa-label");
    const twofaInput = $("#twofa-input");
    const signInButton = $("#signin");

    const errorEmail = $("#error-email");
    const errorPassword = $("#error-password");
    const error1 = $("#error-1");
    const error2 = $("#error-2");
    const error3 = $("#error-3");
    const error4 = $("#error-4");
    let emailValid = false;
    let passwordValid = false;
    let captchaToken = "";
    let captchaReady = false;
    let awaitingTwoFactor = false;
    let pendingLoginToken = "";
    let pendingLoginEmail = "";

    error1.text("The captcha was entered incorrectly.");
    error2.text("No user with this e-mail was found.");
    error3.text("Incorrect password.");

    captchaImage.css("cursor", "pointer").attr("title", "Click to refresh captcha");

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    }

    function setFieldState(wrapper, label, value) {
        if (value && value.length > 0) {
            label.addClass("v-label--active");
        } else {
            label.removeClass("v-label--active");
        }
    }

    function hideTopErrors() {
        error1.hide();
        error2.hide();
        error3.hide();
        error4.hide();
    }

    function normalizeResponse(response) {
        if (typeof response === "string") {
            return response.trim();
        }
        return response;
    }

    function setCaptchaFieldState(isError) {
        captchaInputWrapper.toggleClass("error--text", isError);
    }

    function setTwoFactorFieldState(isError) {
        twofaInputWrapper.toggleClass("error--text", isError);
    }

    function showTwoFactorStep(loginToken, email) {
        pendingLoginToken = loginToken;
        pendingLoginEmail = email;
        awaitingTwoFactor = true;
        twofaSection.show();
        signInButton.find(".v-btn__content").text("Verify Code");
        twofaInput.val("");
        setTwoFactorFieldState(false);
        setFieldState(twofaInputWrapper, twofaLabel, "");
        error4.hide();
        twofaInput.trigger("focus");
    }

    function hideTwoFactorStep() {
        awaitingTwoFactor = false;
        pendingLoginToken = "";
        pendingLoginEmail = "";
        twofaSection.hide();
        twofaInput.val("");
        setTwoFactorFieldState(false);
        setFieldState(twofaInputWrapper, twofaLabel, "");
        error4.hide();
        signInButton.find(".v-btn__content").text("Continue");
    }

    function loadCaptcha() {
        captchaToken = "";
        setCaptchaReady(false);
        captchaInput.val("");
        setFieldState(captchaInputWrapper, captchaLabel, "");
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
                error1.text("Captcha could not be loaded. Refresh and try again.").css("display", "flex");
                setCaptchaReady(false);
            }
        });
    }

function setBusy(isBusy) {
        signInButton.prop("disabled", isBusy);
        signInButton.toggleClass("v-btn--disabled", isBusy);
        signInButton.find(".v-btn__content").text(isBusy ? "Signing In..." : "Continue");
}

function currentLangRedirect(path) {
    const url = new URL(path, window.location.href);
    const lang = new URLSearchParams(window.location.search).get("lang");
    if (lang && lang.toLowerCase() !== "en") {
        url.searchParams.set("lang", lang.toLowerCase());
    }
    return url.pathname + url.search + url.hash;
}

    function verifyTwoFactorLogin(loginToken, email, code) {
        setBusy(true);
        awaitingTwoFactor = true;
        $.ajax({
            url: "/api/auth/verify-2fa",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                login_token: loginToken,
                code: code.trim()
            }),
            success: function (response) {
                const result = normalizeResponse(response);
                if (result === "success") {
                    hideTwoFactorStep();
                    if (window.WixiShell) {
                        window.WixiShell.persistUser({
                            authenticated: true,
                            email: email,
                            verification_status: "unverified"
                        });
                    }
                    window.location.replace(currentLangRedirect("../profile/wallet/"));
                    return;
                }
                setTwoFactorFieldState(true);
                error4.find(".v-messages__message").text("Two-factor authentication failed. Check the 6-digit code.");
                error4.css("display", "flex");
            },
            error: function (xhr, textStatus) {
                const responseText = xhr && xhr.responseText ? String(xhr.responseText).trim() : "";
                const message = responseText || textStatus || "request failed";
                setTwoFactorFieldState(true);
                error4.find(".v-messages__message").text("Two-factor authentication failed: " + message);
                error4.css("display", "flex");
            },
            complete: function () {
                awaitingTwoFactor = pendingLoginToken.length > 0;
                setBusy(false);
            }
        });
    }

    function setCaptchaReady(isReady) {
        captchaReady = isReady;
        signInButton.prop("disabled", !isReady);
        signInButton.toggleClass("v-btn--disabled", !isReady);
        if (!isReady) {
            signInButton.find(".v-btn__content").text("Loading Captcha...");
        } else if (!signInButton.prop("disabled")) {
            signInButton.find(".v-btn__content").text("Continue");
        }
    }

    function syncPasswordToggle(isVisible) {
        passwordInput.attr("type", isVisible ? "text" : "password");
        showPassword.toggleClass("mdi-eye", isVisible);
        showPassword.toggleClass("mdi-eye-off", !isVisible);
    }

    syncPasswordToggle(false);

    showPassword.off("click").on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        const isVisible = passwordInput.attr("type") === "text";
        syncPasswordToggle(!isVisible);
    });

    emailInput.on("focus", function () {
        emailInputWrapper.addClass("v-input--is-focused");
        emailLabel.addClass("v-label--active");
    });

    emailInput.on("blur", function () {
        emailInputWrapper.removeClass("v-input--is-focused");
        setFieldState(emailInputWrapper, emailLabel, emailInput.val());
    });

    emailInput.on("input", function () {
        const email = emailInput.val().trim();
        emailValid = validateEmail(email);
        emailInputWrapper.toggleClass("error--text", !emailValid && email.length > 0);
        errorEmail.css("display", !emailValid && email.length > 0 ? "flex" : "none");
        hideTopErrors();
    });

    passwordInput.on("focus", function () {
        passwordInputWrapper.addClass("v-input--is-focused");
        passwordLabel.addClass("v-label--active");
    });

    passwordInput.on("blur", function () {
        passwordInputWrapper.removeClass("v-input--is-focused");
        setFieldState(passwordInputWrapper, passwordLabel, passwordInput.val());
    });

    passwordInput.on("input", function () {
        const password = passwordInput.val();
        passwordValid = password.length > 0;
        passwordInputWrapper.toggleClass("error--text", !passwordValid);
        errorPassword.css("display", !passwordValid ? "flex" : "none");
        hideTopErrors();
    });

    captchaInput.on("focus", function () {
        captchaInputWrapper.addClass("v-input--is-focused");
        captchaLabel.addClass("v-label--active");
    });

    captchaInput.on("blur", function () {
        captchaInputWrapper.removeClass("v-input--is-focused");
        setFieldState(captchaInputWrapper, captchaLabel, captchaInput.val());
    });

    captchaInput.on("input", function () {
        captchaInput.val(captchaInput.val().replace(/\D/g, "").slice(0, 5));
        setCaptchaFieldState(false);
        hideTopErrors();
    });

    twofaInput.on("focus", function () {
        twofaInputWrapper.addClass("v-input--is-focused");
        twofaLabel.addClass("v-label--active");
    });

    twofaInput.on("blur", function () {
        twofaInputWrapper.removeClass("v-input--is-focused");
        setFieldState(twofaInputWrapper, twofaLabel, twofaInput.val());
    });

    twofaInput.on("input", function () {
        twofaInput.val(twofaInput.val().replace(/\D/g, "").slice(0, 6));
        setTwoFactorFieldState(false);
        error4.hide();
    });

    captchaImage.on("click", function () {
        hideTopErrors();
        loadCaptcha();
    });

    signInButton.on("click", function (event) {
        event.preventDefault();
        hideTopErrors();

        if (pendingLoginToken) {
            const twofaCode = twofaInput.val().trim();
            if (!/^\d{6}$/.test(twofaCode)) {
                setTwoFactorFieldState(true);
                error4.find(".v-messages__message").text("Enter the 6-digit code from your authenticator app");
                error4.css("display", "flex");
                return;
            }
            verifyTwoFactorLogin(pendingLoginToken, pendingLoginEmail, twofaCode);
            return;
        }

        const email = emailInput.val().trim().toLowerCase();
        const password = passwordInput.val();
        const captcha = captchaInput.val().trim();

        emailValid = validateEmail(email);
        passwordValid = password.length > 0;

        emailInputWrapper.toggleClass("error--text", !emailValid);
        errorEmail.css("display", !emailValid ? "flex" : "none");
        passwordInputWrapper.toggleClass("error--text", !passwordValid);
        errorPassword.css("display", !passwordValid ? "flex" : "none");
        setCaptchaFieldState(captcha.length === 0);

        if (!captchaReady || !emailValid || !passwordValid || captcha.length === 0 || !captchaToken) {
            if ((captcha.length === 0 || !captchaToken) && !error1.is(":visible")) {
                error1.text("Enter the captcha before signing in.").css("display", "flex");
            }
            if (!captchaToken) {
                loadCaptcha();
            }
            return;
        }

        setBusy(true);

        $.ajax({
            url: "/api/auth/login",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                email: email,
                password: password,
                captcha: captcha,
                captcha_token: captchaToken
            }),
            success: function (response) {
                const result = normalizeResponse(response);
                console.log("signin response", result);

                if (result && typeof result === "object" && result.status === "2fa_required" && result.login_token) {
                    showTwoFactorStep(result.login_token, email);
                    setBusy(false);
                    return;
                }

                if (result === "success") {
                    if (window.WixiShell) {
                        window.WixiShell.persistUser({
                            authenticated: true,
                            email: email,
                            verification_status: "unverified"
                        });
                    }
                    window.location.replace(currentLangRedirect("../profile/wallet/"));
                    return;
                }

                if (result === "captcha_invalid") {
                    error1.text("The captcha was entered incorrectly.").css("display", "flex");
                    setCaptchaFieldState(true);
                    loadCaptcha();
                    return;
                }

                if (result === "user_not_found") {
                    error2.css("display", "flex");
                    loadCaptcha();
                    return;
                }

                if (result === "wrong_password") {
                    error3.css("display", "flex");
                    loadCaptcha();
                    return;
                }

                error1.text("Unexpected login response: " + String(result || "empty response")).css("display", "flex");
                loadCaptcha();
            },
            error: function (xhr, textStatus) {
                const responseText = xhr && xhr.responseText ? String(xhr.responseText).trim() : "";
                const message = responseText || textStatus || "request failed";
                console.error("signin request failed", xhr && xhr.status, message);
                error1.text("Login request failed: " + message).css("display", "flex");
                loadCaptcha();
            },
            complete: function () {
                if (!awaitingTwoFactor) {
                    setBusy(false);
                }
            }
        });
    });

    setFieldState(emailInputWrapper, emailLabel, emailInput.val());
    setFieldState(passwordInputWrapper, passwordLabel, passwordInput.val());
    setFieldState(captchaInputWrapper, captchaLabel, captchaInput.val());
    setFieldState(twofaInputWrapper, twofaLabel, twofaInput.val());
    hideTwoFactorStep();
    setCaptchaReady(false);
    loadCaptcha();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCleanSignin, { once: true });
} else {
    initCleanSignin();
}
