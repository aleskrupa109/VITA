/* === Sdílená logika mockupu VITA Stavební úřad ===
   Hodiny ve stavovém řádku, toast hlášky a zavírání modálních oken klávesou Esc.
   Logiku konkrétní obrazovky (DO, záměr…) drží příslušná stránka ve vlastním <script>. */

var __vitaSelf = document.currentScript;   // pro odvození cesty ke kořeni webu

function vitaClock(){
  var el = document.getElementById('clock'); if(!el) return;
  var d = new Date();
  el.textContent = String(d.getHours()).padStart(2,'0')+':'+
                   String(d.getMinutes()).padStart(2,'0')+':'+
                   String(d.getSeconds()).padStart(2,'0');
}
setInterval(vitaClock, 1000); vitaClock();

var __vitaToastTimer = null;
function toast(msg){
  var t = document.getElementById('toast'); if(!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(__vitaToastTimer);
  __vitaToastTimer = setTimeout(function(){ t.classList.remove('show'); }, 2600);
}

// Esc zavře navrchu otevřené modální okno
document.addEventListener('keydown', function(e){
  if(e.key !== 'Escape') return;
  var open = document.querySelectorAll('.overlay.show');
  if(open.length) open[open.length-1].classList.remove('show');
});

// Ikona u názvu „Stavební úřad" => vždy zpět na úvodní stránku
function vitaHomeHref(){
  var src = (__vitaSelf && __vitaSelf.getAttribute('src')) || 'assets/js/vita.js';
  return src.replace(/assets\/js\/vita\.js.*$/, '') + 'index.html';
}
(function(){
  function bindLogo(){
    var logo = document.querySelector('.titlebar .logo');
    if(!logo) return;
    logo.style.cursor = 'pointer';
    logo.title = 'Domů';
    logo.addEventListener('click', function(){ location.href = vitaHomeHref(); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindLogo);
  else bindLogo();
})();

/* ===== Globální přepínač rolí: přepne na landing page dané role ===== */
function vitaRoleSwitch(role){
  var inPages = /\/pages\//.test(location.pathname);
  var map = inPages
    ? { uradnik:'../index.html', koordinator:'koordinator.html', prispevatel:'prispevatel.html' }
    : { uradnik:'index.html', koordinator:'pages/koordinator.html', prispevatel:'pages/prispevatel.html' };
  if(map[role]) location.href = map[role];
}

/* ===== Výchozí dotčenost (interní/externí DO) podle úseku – dle schématu DOSS ===== */
var VITA_EXT_DEFAULT = {
  PAK:{mode:'interni', zdu:''},
  OVZ:{mode:'interni', zdu:''},
  ZPF:{mode:'interni', zdu:''},
  HYG:{mode:'interni', zdu:''},
  UUP:{mode:'interni', zdu:''},
  ODP:{mode:'interni', zdu:''},
  PAM:{mode:'oba',     zdu:'Národní kulturní památky a kulturní památky zůstávají v kompetenci orgánu památkové péče (ZS) dle zák. 20/1987 Sb. – nutné vyžádat závazné stanovisko; památkové zóny a ochranná pásma řeší ÚRÚ interně.'},
  VOD:{mode:'externi', zdu:'Vyžádat vyjádření vodoprávního úřadu dle zák. 254/2001 Sb. (nakládání s vodami, vodní dílo, výjimky § 23a).'},
  LES:{mode:'externi', zdu:'Vyžádat vyjádření orgánu státní správy lesů dle zák. 289/1995 Sb. (dotčení pozemků určených k plnění funkcí lesa).'},
  PO: {mode:'externi', zdu:'Vyžádat stanovisko HZS dle zák. 133/1985 Sb. (požární bezpečnost; kategorie II – vyjádření).'},
  DOP:{mode:'externi', zdu:'Vyžádat stanovisko drážního správního úřadu (zák. 266/1994 Sb.) a Policie ČR k bezpečnosti provozu (zák. 13/1997 Sb.).'}
};

/* ===== Program → Reset (vrátí mockup do výchozího stavu) ===== */
function vitaReset(){
  try{ localStorage.removeItem('vita_kv_state'); }catch(e){}
  var inPages = /\/pages\//.test(location.pathname);
  location.href = inPages ? '../index.html' : 'index.html';
}
(function(){
  function wire(){
    var prog=null;
    document.querySelectorAll('.menubar .menu-item').forEach(function(mi){
      if(mi.textContent.trim().toLowerCase()==='program') prog=mi;
    });
    if(!prog) return;
    var dd=document.createElement('div');
    dd.style.cssText='position:fixed;display:none;background:#fff;border:1px solid #9a9a9a;box-shadow:0 6px 18px rgba(0,0,0,.25);font-size:13px;z-index:9999;min-width:190px;';
    dd.innerHTML='<div class="vita-prog-reset" style="padding:6px 16px;cursor:default;white-space:nowrap;">Reset (výchozí stav)</div>';
    document.body.appendChild(dd);
    var item=dd.firstChild;
    item.addEventListener('mouseenter', function(){ item.style.background='#cfe0f5'; });
    item.addEventListener('mouseleave', function(){ item.style.background='#fff'; });
    item.addEventListener('click', function(e){
      e.stopPropagation(); dd.style.display='none';
      if(confirm('Resetovat všechny provedené úkony do výchozího stavu?')) vitaReset();
    });
    prog.style.cursor='default';
    prog.addEventListener('click', function(e){
      e.stopPropagation();
      if(dd.style.display==='block'){ dd.style.display='none'; return; }
      var r=prog.getBoundingClientRect();
      dd.style.left=r.left+'px'; dd.style.top=r.bottom+'px'; dd.style.display='block';
    });
    document.addEventListener('click', function(){ dd.style.display='none'; });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
