const links = Array.from(document.querySelectorAll('.policy-links a'));
const sections = links.map(link => document.getElementById(link.hash.slice(1)));
function updateContents() {
  const section = sections.filter(item => item.getBoundingClientRect().top <= 125).pop() || sections[0];
  for (const link of links) {
    if (link.hash.slice(1) === section.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
window.addEventListener('scroll', updateContents, { passive: true });
window.addEventListener('resize', updateContents);
window.addEventListener('load', updateContents);
updateContents();
