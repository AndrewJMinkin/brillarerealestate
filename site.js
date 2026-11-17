document.documentElement.classList.add('js');
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Scroll reveal */
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});

/* Count-up numbers */
function countUp(el){
  var end=parseInt(el.dataset.count,10),suffix=el.dataset.suffix||'';
  if(reduce){el.textContent=end+suffix;return}
  var dur=1800,start=null;
  function tick(t){
    if(!start)start=t;
    var p=Math.min((t-start)/dur,1),eased=1-Math.pow(1-p,4);
    el.textContent=Math.round(end*eased)+(p===1?suffix:'');
    if(p<1)requestAnimationFrame(tick);else el.textContent=end+suffix;
  }
  el.textContent='0';
  requestAnimationFrame(tick);
}
var co=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){countUp(e.target);co.unobserve(e.target)}})},{threshold:.6});
document.querySelectorAll('[data-count]').forEach(function(el){co.observe(el)});

/* Mobile menu */
var menu=document.querySelector('.menu'),nav=document.getElementById('navigation');
menu.addEventListener('click',function(){
  var open=menu.getAttribute('aria-expanded')!=='true';
  menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);menu.textContent=open?'Close':'Menu';
});
nav.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');menu.textContent='Menu'})});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){menu.click();menu.focus()}});
