import { getClient, localUrl } from "./auth-client.js";
const panel = document.querySelector("[data-auth-mode]");
const form = document.getElementById("auth-form");
const notice = document.getElementById("auth-notice");
const fieldset = form.querySelector("fieldset");
const submit = form.querySelector("button[type=submit]");
let mode = panel.dataset.authMode;
const recoveryRedirect =
  new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
function message(text, error = false) {
  notice.textContent = text;
  notice.dataset.error = String(error);
}
function recoveryForm() {
  mode = "update-password";
  panel.querySelector("h2").textContent = "Choose a new password.";
  fieldset.replaceChildren();
  const label = document.createElement("label");
  label.textContent = "New password";
  const input = document.createElement("input");
  Object.assign(input, {
    name: "password",
    type: "password",
    autocomplete: "new-password",
    minLength: 8,
    required: true,
  });
  label.append(input);
  fieldset.append(label, submit);
  submit.textContent = "Save new password →";
  fieldset.disabled = false;
  message("Choose a password with at least 8 characters.");
}
async function init() {
  try {
    const client = await getClient();
    if (!client) {
      message(
        "Our new student space is being prepared. For now, enroll or log in on our existing website.",
      );
      document.getElementById("legacy-access").hidden = false;
      return;
    }
    client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") recoveryForm();
    });
    const {
      data: { user },
    } = await client.auth.getUser();
    if (user && mode === "reset-password" && recoveryRedirect) recoveryForm();
    if (user && mode !== "reset-password" && mode !== "update-password") {
      window.location.replace("student-portal.html");
      return;
    }
    if (mode !== "update-password") {
      fieldset.disabled = false;
      message("");
    }
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      fieldset.disabled = true;
      message("Please wait…");
      try {
        let result;
        const email = String(data.get("email") || "").trim();
        const password = String(data.get("password") || "");
        if (mode === "enroll") {
          result = await client.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: localUrl("student-portal.html"),
              data: {
                first_name: String(data.get("firstName")).trim(),
                last_name: String(data.get("lastName")).trim(),
                terms_accepted_at: new Date().toISOString(),
              },
            },
          });
        } else if (mode === "reset-password") {
          result = await client.auth.resetPasswordForEmail(email, {
            redirectTo: localUrl("reset-password.html"),
          });
        } else if (mode === "update-password") {
          result = await client.auth.updateUser({ password });
        } else {
          result = await client.auth.signInWithPassword({ email, password });
        }
        if (result.error) throw result.error;
        if (mode === "reset-password") {
          message(
            "If an account exists for that email, a reset link is on its way. Check your inbox.",
          );
        } else if (mode === "enroll" && !result.data.session) {
          message(
            "Check your email to confirm your account, then return to log in.",
          );
          form.reset();
        } else if (mode === "update-password") {
          message("Your password is updated. Opening your portal…");
          window.location.replace("student-portal.html");
        } else window.location.replace("student-portal.html");
      } catch (error) {
        message(
          error.message || "We couldn’t connect. Please try again.",
          true,
        );
      } finally {
        fieldset.disabled = false;
      }
    });
  } catch {
    message(
      "Account access is temporarily unavailable. Please use our existing portal or try again later.",
      true,
    );
    document.getElementById("legacy-access").hidden = false;
  }
}
init();
