(function () {
    function redirectProfileRoot() {
        var currentPath = window.WixiShell && typeof window.WixiShell.currentPathWithoutPrefix === "function"
            ? window.WixiShell.currentPathWithoutPrefix()
            : window.location.pathname;

        if (currentPath === "/profile/" || currentPath === "/profile") {
            if (window.WixiShell && typeof window.WixiShell.enforceGuestProfileRedirect === "function" && window.WixiShell.enforceGuestProfileRedirect()) {
                return;
            }
            var target = window.WixiShell ? window.WixiShell.withCurrentLang("/profile/wallet/") : "/profile/wallet/";
            window.location.replace(target);
        }
    }

    function init() {
        redirectProfileRoot();

        if (window.WixiShell) {
            window.WixiShell.applyCurrentLangToLinks();
            window.WixiShell.patchOnclickAttributes();
            window.WixiShell.refresh();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
