import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { JSDOM } from "jsdom";
const read = (file) =>
  readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
async function setup(page, script, client) {
  const dom = new JSDOM(read(page), {
    url: `https://example.test/${page}`,
    runScripts: "outside-only",
  });
  dom.window.getClient = async () => client;
  dom.window.localUrl = (file) => new URL(file, dom.window.location.href).href;
  dom.window.eval(read(script).replace(/^import .*;\n/m, ""));
  await tick();
  await tick();
  return dom.window;
}
function provider({
  user = { id: "student-1", user_metadata: { first_name: "<b>Alex</b>" } },
  lessons = [],
  error = null,
} = {}) {
  let callback;
  return {
    auth: {
      onAuthStateChange: (cb) => {
        callback = cb;
      },
      getUser: async () => ({ data: { user }, error: null }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({ order: async () => ({ data: lessons, error }) }),
    }),
    emit: (event) => callback(event, null),
  };
}
test("all local page, script and image links exist; Join Us uses the exact requested URL", () => {
  const pages = readdirSync(new URL("../", import.meta.url)).filter((file) =>
    file.endsWith(".html"),
  );
  for (const page of pages) {
    const doc = new JSDOM(read(page)).window.document;
    assert.equal(doc.querySelectorAll("h1").length, 1, page);
    assert.ok(doc.querySelector("main#top"), page);
    for (const el of doc.querySelectorAll("[href],[src]")) {
      const ref = el.getAttribute("href") || el.getAttribute("src");
      if (!ref || /^(https?:|mailto:|#)/.test(ref)) continue;
      assert.ok(
        existsSync(new URL("../" + ref.split("#")[0], import.meta.url)),
        `${page}: ${ref}`,
      );
    }
    assert.equal(
      doc.querySelector(".nav-join").href,
      "https://docs.google.com/forms/d/e/1FAIpQLScV9bFX05wDiP2sNdu5WLPTZhuIrXgJ3YtFudSiNp3QPrhMOg/viewform",
    );
  }
});
test("unconfigured auth cannot collect credentials or pretend to sign in", async () => {
  for (const page of ["login.html", "enroll.html", "reset-password.html"]) {
    const win = await setup(page, "auth.js", null);
    assert.equal(win.document.querySelector("fieldset").disabled, true);
    assert.equal(win.document.getElementById("legacy-access").hidden, false);
    assert.match(
      win.document.getElementById("auth-notice").textContent,
      /existing website/,
    );
    win.close();
  }
});
test("unconfigured portal reveals no curriculum", async () => {
  const win = await setup("student-portal.html", "portal.js", null);
  assert.equal(win.document.getElementById("portal-content").hidden, true);
  assert.equal(win.document.querySelectorAll(".lesson-row").length, 0);
  assert.match(
    win.document.getElementById("portal-status").textContent,
    /existing student portal/,
  );
  win.close();
});
test("authenticated portal renders safe text, filters lessons, rejects unsafe URLs and clears on logout", async () => {
  const client = provider({
    lessons: [
      {
        id: "1",
        title: "<img src=x onerror=alert(1)>",
        description: "Basics",
        category: "core",
        lesson_url: "javascript:alert(1)",
      },
      {
        id: "2",
        title: "Development",
        description: "A project",
        category: "bonus",
        lesson_url: "https://example.test/lesson",
      },
      {
        id: "3",
        title: "Finance",
        description: "",
        category: "core",
        lesson_url: null,
      },
    ],
  });
  const win = await setup("student-portal.html", "portal.js", client);
  const doc = win.document;
  assert.equal(doc.getElementById("portal-content").hidden, false);
  assert.equal(doc.querySelectorAll(".lesson-row").length, 3);
  assert.equal(doc.querySelectorAll(".lesson-row img").length, 0);
  assert.equal(doc.querySelectorAll(".lesson-row a").length, 1);
  assert.equal(doc.querySelectorAll(".pending").length, 2);
  assert.equal(doc.querySelector("#welcome b"), null);
  const category = doc.getElementById("lesson-category");
  category.value = "bonus";
  category.dispatchEvent(new win.Event("change"));
  assert.equal(doc.querySelectorAll(".lesson-row").length, 1);
  const search = doc.getElementById("lesson-search");
  search.value = "missing";
  search.dispatchEvent(new win.Event("input"));
  assert.match(doc.getElementById("lessons").textContent, /No lessons match/);
  client.emit("SIGNED_OUT");
  assert.equal(doc.getElementById("portal-content").hidden, true);
  assert.equal(doc.querySelectorAll(".lesson-row").length, 0);
  win.close();
});
test("database failure keeps portal content hidden and gives a retry", async () => {
  const win = await setup(
    "student-portal.html",
    "portal.js",
    provider({ error: { message: "unavailable" } }),
  );
  assert.equal(win.document.getElementById("portal-content").hidden, true);
  assert.match(
    win.document.getElementById("portal-status").textContent,
    /Try again/,
  );
  win.close();
});
test("signup sends the entered fields and shows confirmation instead of fake access", async () => {
  let payload;
  const client = provider({ user: null });
  client.auth.signUp = async (args) => {
    payload = args;
    return { data: { session: null }, error: null };
  };
  const win = await setup("enroll.html", "auth.js", client);
  const form = win.document.getElementById("auth-form");
  form.elements.firstName.value = "Alex";
  form.elements.lastName.value = "Student";
  form.elements.email.value = "alex@example.test";
  form.elements.password.value = "test-only-password";
  form.querySelector("[type=checkbox]").checked = true;
  form.dispatchEvent(new win.Event("submit", { cancelable: true }));
  await tick();
  assert.equal(payload.email, "alex@example.test");
  assert.equal(payload.options.data.first_name, "Alex");
  assert.equal(
    payload.options.emailRedirectTo,
    "https://example.test/student-portal.html",
  );
  assert.match(
    win.document.getElementById("auth-notice").textContent,
    /Check your email/,
  );
  assert.equal(form.querySelector("fieldset").disabled, false);
  win.close();
});
test("login errors are visible and the form can be retried", async () => {
  const client = provider({ user: null });
  client.auth.signInWithPassword = async () => ({
    error: { message: "Invalid login credentials" },
  });
  const win = await setup("login.html", "auth.js", client);
  const form = win.document.getElementById("auth-form");
  form.elements.email.value = "alex@example.test";
  form.elements.password.value = "incorrect";
  form.dispatchEvent(new win.Event("submit", { cancelable: true }));
  await tick();
  assert.match(
    win.document.getElementById("auth-notice").textContent,
    /Invalid login/,
  );
  assert.equal(form.querySelector("fieldset").disabled, false);
  win.close();
});
test("password recovery event shows a new-password form", async () => {
  const client = provider({ user: null });
  const win = await setup("reset-password.html", "auth.js", client);
  client.emit("PASSWORD_RECOVERY");
  assert.equal(win.document.querySelector("input[name=email]"), null);
  assert.equal(
    win.document.querySelector("input[name=password]").autocomplete,
    "new-password",
  );
  assert.match(
    win.document.querySelector("h2").textContent,
    /Choose a new password/,
  );
  win.close();
});
test("database policy grants no anonymous access or browser writes", () => {
  const sql = read("supabase/schema.sql");
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on public.lessons from anon, authenticated/i);
  assert.match(sql, /grant select on public.lessons to authenticated/i);
  assert.match(sql, /published = true/);
  assert.doesNotMatch(sql, /grant (insert|update|delete|all)/i);
});
