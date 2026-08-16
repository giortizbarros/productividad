import { isSupabaseConfigured } from "./supabaseClient.js";
import { getSession, signIn, signUp, translateAuthError } from "./auth.js";

const el = (id) => document.getElementById(id);

let mode = "signIn"; // signIn | signUp

async function init() {
  if (!isSupabaseConfigured) {
    el("authConfigWarning").hidden = false;
    el("authArea").hidden = true;
    return;
  }

  const session = await getSession();
  if (session) {
    window.location.href = "index.html";
    return;
  }

  el("tabSignIn").addEventListener("click", () => setMode("signIn"));
  el("tabSignUp").addEventListener("click", () => setMode("signUp"));
  el("authForm").addEventListener("submit", handleSubmit);
}

function setMode(next) {
  mode = next;
  el("tabSignIn").classList.toggle("is-active", mode === "signIn");
  el("tabSignUp").classList.toggle("is-active", mode === "signUp");
  el("authSubmit").textContent = mode === "signIn" ? "Iniciar sesión" : "Crear cuenta";
  el("authHint").textContent =
    mode === "signIn"
      ? "Ingresa con tu correo y contraseña."
      : "Elige una contraseña de al menos 6 caracteres.";
  el("authPassword").setAttribute(
    "autocomplete",
    mode === "signIn" ? "current-password" : "new-password"
  );
  hideMessages();
}

function hideMessages() {
  el("authError").hidden = true;
  el("authSuccess").hidden = true;
}

async function handleSubmit(e) {
  e.preventDefault();
  hideMessages();
  const email = el("authEmail").value.trim();
  const password = el("authPassword").value;
  const submitBtn = el("authSubmit");
  submitBtn.disabled = true;

  try {
    if (mode === "signIn") {
      await signIn(email, password);
      window.location.href = "index.html";
      return;
    }

    const data = await signUp(email, password);
    if (data.session) {
      window.location.href = "index.html";
      return;
    }
    el("authSuccess").hidden = false;
    el("authSuccess").textContent =
      "Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.";
    setMode("signIn");
  } catch (err) {
    el("authError").hidden = false;
    el("authError").textContent = translateAuthError(err);
  } finally {
    submitBtn.disabled = false;
  }
}

init();
