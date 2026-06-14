import { api, getUser, setSession, clearSession, isLoggedIn } from "../core/backend.js";

const authBtn =
    document.getElementById("authBtn");

const modal =
    document.getElementById("authModal");

const closeBtn =
    document.getElementById("authClose");

const signInTab =
    document.getElementById("signInTab");

const signUpTab =
    document.getElementById("signUpTab");

const authTitle =
    document.getElementById("authTitle");

const authName =
    document.getElementById("authName");

const authEmail =
    document.getElementById("authEmail");

const authPassword =
    document.getElementById("authPassword");

const authSubmit =
    document.getElementById("authSubmit");

const authMessage =
    document.getElementById("authMessage");

const googleLogin =
    document.getElementById("googleLogin");

const phoneLogin =
    document.getElementById("phoneLogin");

const gmailLogin =
    document.getElementById("gmailLogin");

let mode = "signin";

export function initAuth() {

    reflectSession();

    // When signed in, clicking the button logs out; otherwise it opens auth.
    authBtn?.addEventListener("click", () => {
        if (isLoggedIn()) {
            logout();
        } else {
            openAuth();
        }
    });

    closeBtn?.addEventListener("click", closeAuth);

    modal?.addEventListener("click", e => {
        if (e.target === modal) closeAuth();
    });

    signInTab?.addEventListener("click", () => switchMode("signin"));

    signUpTab?.addEventListener("click", () => switchMode("signup"));

    authSubmit?.addEventListener("click", handleSubmit);

    googleLogin?.addEventListener("click", googleRealLogin);

    gmailLogin?.addEventListener("click", googleRealLogin);

    phoneLogin?.addEventListener("click", phoneLoginUnavailable);
}

function reflectSession() {
    const user = getUser();
    if (user && isLoggedIn()) {
        authBtn.textContent = user.name || "Account";
        authBtn.title = "Click to log out";
    } else {
        authBtn.textContent = "Sign In";
        authBtn.title = "";
    }
}

function logout() {
    clearSession();
    reflectSession();
}

function openAuth() {
    window.scrollTo(0, 0);
    modal.classList.add("active");
    document.body.classList.add("modal-open");
}

function closeAuth() {
    modal.classList.remove("active");
    document.body.classList.remove("modal-open");
}

function switchMode(newMode) {
    mode = newMode;

    authMessage.textContent = "";

    signInTab.classList.toggle("active", mode === "signin");
    signUpTab.classList.toggle("active", mode === "signup");

    authTitle.textContent =
        mode === "signin"
            ? "Sign In"
            : "Create Account";

    authName.style.display =
        mode === "signin"
            ? "none"
            : "block";
}

async function handleSubmit() {
    const email =
        authEmail.value.trim();

    const password =
        authPassword.value.trim();

    const name =
        authName.value.trim() || "CINEMII User";

    if (!email || !password) {
        showMessage("Please fill email and password.", false);
        return;
    }

    if (mode === "signup" && password.length < 8) {
        showMessage("Password must be at least 8 characters.", false);
        return;
    }

    authSubmit.disabled = true;

    try {
        const result =
            mode === "signup"
                ? await api.signup(name, email, password)
                : await api.login(email, password);

        completeLogin(
            result,
            mode === "signup" ? "Account created successfully." : "Welcome back."
        );
    } catch (error) {
        showMessage(error.message, false);
    } finally {
        authSubmit.disabled = false;
    }
}

function phoneLoginUnavailable() {
    showMessage("Phone login isn't available yet.", false);
}

// Persist the JWT + user returned by the backend and update the UI.
function completeLogin(result, successMessage) {
    setSession(result.access_token, result.user);

    authBtn.textContent = result.user.name || "Account";
    authBtn.title = "Click to log out";

    showMessage(successMessage, true);

    setTimeout(closeAuth, 700);
}

function showMessage(text, success) {
    authMessage.textContent = text;
    authMessage.style.color =
        success ? "#00ff99" : "#ff6b7a";
}
const GOOGLE_CLIENT_ID =
    "277488906528-8rk7dpimukrm1kivdq019eueoc4krcdp.apps.googleusercontent.com";

function googleRealLogin() {

    if (!window.google) {
        showMessage("Google login is still loading. Try again.", false);
        return;
    }

    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse
    });

    google.accounts.id.prompt();
}

async function handleGoogleResponse(response) {
    // The raw Google ID token is sent to our backend, which verifies its
    // signature with Google before trusting any of its claims.
    try {
        const result = await api.google(response.credential);
        completeLogin(result, "Google account connected.");
    } catch (error) {
        showMessage(error.message, false);
    }
}