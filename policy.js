const contents = document.querySelector('.policy-index details');
const mobile = window.matchMedia('(max-width: 760px)');
function setMenuLayout() {
  contents.open = !mobile.matches;
}
setMenuLayout();
mobile.addEventListener('change', setMenuLayout);
const links = [...contents.querySelectorAll('a')];
const labels = links.length === 14
  ? ["About Brillare", "Information we collect", "How we use information", "Children and minors", "Sharing information", "Storage and security", "Data retention", "Photos and media", "Your privacy rights", "Cookies and analytics", "External links", "International visitors", "Policy changes", "Contact us"]
  : ["Introduction", "About Brillare", "Programs and resources", "Who can participate", "Fees and donations", "Student conduct", "Educational materials", "Student work", "Photos and publicity", "Volunteers and partners", "Privacy", "Educational disclaimer", "Liability", "Suspension and termination", "Accessibility", "Governing law", "Changes to the terms", "Contact us"];
contents.querySelector("summary").textContent = "Contents";
links.forEach((link, index) => { link.textContent = labels[index]; });
const headings = links.map(link => document.getElementById(link.hash.slice(1)));
contents.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (link && mobile.matches) {
    contents.open = false;
    document.getElementById(link.hash.slice(1)).focus({ preventScroll: true });
  }
});
let current;
function markSection() {
  const heading = headings.filter(item => item.getBoundingClientRect().top <= 120).pop() || headings[0];
  const next = links[headings.indexOf(heading)];
  const rail = next.parentElement;
  rail.style.setProperty("--marker-top", (next.offsetTop + 5) + "px");
  rail.style.setProperty("--marker-height", (next.offsetHeight - 10) + "px");
  if (current === next) return;
  current?.removeAttribute('aria-current');
  next.setAttribute('aria-current', 'location');
  current = next;
  const list = next.parentElement;
  if (contents.open && !mobile.matches) {
    const delta = next.getBoundingClientRect().top - list.getBoundingClientRect().top;
    if (delta < 0) list.scrollTop += delta;
    else if (delta + next.offsetHeight > list.clientHeight) list.scrollTop += delta + next.offsetHeight - list.clientHeight;
  }
}
window.addEventListener('scroll', markSection, { passive: true });
window.addEventListener('resize', markSection);
window.addEventListener('load', markSection);
markSection();

contents.addEventListener("toggle", markSection);
