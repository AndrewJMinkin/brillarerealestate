const menu = document.querySelector(".menu");
const nav = document.getElementById("navigation");
if (menu && nav) {
  function closeMenu() {
    menu.setAttribute("aria-expanded", "false");
    nav.classList.remove("open");
    menu.textContent = "Menu";
  }
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
    menu.textContent = open ? "Close" : "Menu";
  });
  nav
    .querySelectorAll("a")
    .forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && !menu.contains(e.target)) closeMenu();
  });
  window.matchMedia("(min-width: 921px)").addEventListener("change", (e) => {
    if (e.matches) closeMenu();
  });
}
