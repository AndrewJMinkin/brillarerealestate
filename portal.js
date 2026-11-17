import { getClient } from "./auth-client.js";
const status = document.getElementById("portal-status");
const content = document.getElementById("portal-content");
const logout = document.getElementById("logout");
const list = document.getElementById("lessons");
const search = document.getElementById("lesson-search");
const category = document.getElementById("lesson-category");
let lessons = [];
function blocked(text, href = "login.html", label = "Log In →") {
  content.hidden = true;
  logout.hidden = true;
  list.replaceChildren();
  lessons = [];
  status.hidden = false;
  status.replaceChildren(
    document.createTextNode(text),
    document.createElement("br"),
  );
  const link = document.createElement("a");
  link.className = "btn";
  link.href = href;
  link.textContent = label;
  status.append(link);
}
function render() {
  list.replaceChildren();
  const matches = lessons.filter(
    (lesson) =>
      (category.value === "all" || lesson.category === category.value) &&
      `${lesson.title} ${lesson.description || ""}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase()),
  );
  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = lessons.length
      ? "No lessons match your search. Try another word or choose all modules."
      : "Your course is being prepared. Lessons will appear here when they’re ready.";
    list.append(empty);
    return;
  }
  for (const lesson of matches) {
    const row = document.createElement("article");
    row.className = "lesson-row";
    const number = document.createElement("span");
    number.className = "num";
    number.textContent = String(lessons.indexOf(lesson) + 1).padStart(2, "0");
    const body = document.createElement("div");
    const tag = document.createElement("span");
    tag.className = "eyebrow";
    tag.textContent =
      lesson.category === "bonus" ? "Bonus module" : "Core program";
    const heading = document.createElement("h3");
    heading.textContent = lesson.title;
    const description = document.createElement("p");
    description.textContent = lesson.description || "";
    body.append(tag, heading, description);
    row.append(number, body);
    let safe = false;
    try {
      safe = new URL(lesson.lesson_url).protocol === "https:";
    } catch {
      /* Unassigned lessons remain disabled. */
    }
    if (safe) {
      const link = document.createElement("a");
      link.className = "btn";
      link.href = lesson.lesson_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open lesson ↗";
      link.setAttribute("aria-label", `Open lesson: ${lesson.title}`);
      row.append(link);
    } else {
      const pending = document.createElement("span");
      pending.className = "pending";
      pending.textContent = "Coming soon";
      row.append(pending);
    }
    list.append(row);
  }
}
search.addEventListener("input", render);
category.addEventListener("change", render);
async function init() {
  try {
    const client = await getClient();
    if (!client) {
      blocked(
        "Our new learning space is being prepared. You can continue learning in the existing student portal.",
        "https://www.brillarescholars.com/student-portal",
        "Open existing portal ↗",
      );
      return;
    }
    client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session))
        blocked("Please log in to view your lessons.");
    });
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error || !user) {
      window.location.replace("login.html");
      return;
    }
    const { data, error: loadError } = await client
      .from("lessons")
      .select("id,title,description,category,position,lesson_url")
      .order("position");
    if (loadError) throw loadError;
    // This is presentation gating. Database RLS is the actual authorization boundary.
    const { data: verified } = await client.auth.getUser();
    if (!verified.user) {
      blocked("Please log in to view your lessons.");
      return;
    }
    lessons = data || [];
    status.hidden = true;
    content.hidden = false;
    logout.hidden = false;
    document.getElementById("welcome").textContent = user.user_metadata
      ?.first_name
      ? `Welcome back, ${user.user_metadata.first_name}. Let’s build on what you know.`
      : "Welcome back. Let’s build on what you know.";
    render();
    logout.addEventListener("click", async () => {
      logout.disabled = true;
      try {
        const { error } = await client.auth.signOut();
        if (error) throw error;
        window.location.replace("login.html");
      } catch {
        status.hidden = false;
        status.textContent = "We couldn’t log you out. Please try again.";
        logout.disabled = false;
      }
    });
  } catch {
    blocked(
      "We couldn’t load your learning space. Please try again or contact Brillare Scholars.",
      "student-portal.html",
      "Try again →",
    );
  }
}
init();
