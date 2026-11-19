const contents = document.querySelector('.policy-index details');
const mobile = window.matchMedia('(max-width: 760px)');
function setMenuLayout() {
  contents.open = !mobile.matches;
}
setMenuLayout();
mobile.addEventListener('change', setMenuLayout);
const links = [...contents.querySelectorAll('a')];
for (const link of links) link.textContent = link.textContent.replace(/^\d+\.\s*/, '');
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
