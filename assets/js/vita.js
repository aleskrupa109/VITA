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
    ? { uradnik:'../index.html', koordinator:'koordinator.html', prispevatel:'prispevatel.html', prispevatel2:'prispevatel2.html' }
    : { uradnik:'index.html', koordinator:'pages/koordinator.html', prispevatel:'pages/prispevatel.html', prispevatel2:'pages/prispevatel2.html' };
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
  ZAV:{mode:'interni', zdu:''},
  PAM:{mode:'oba',     zdu:'Národní kulturní památky a kulturní památky zůstávají v kompetenci orgánu památkové péče (ZS) dle zák. 20/1987 Sb. – nutné vyžádat závazné stanovisko; památkové zóny a ochranná pásma řeší ÚRÚ interně.'},
  VOD:{mode:'externi', zdu:'Vyžádat vyjádření vodoprávního úřadu dle zák. 254/2001 Sb. (nakládání s vodami, vodní dílo, výjimky § 23a).'},
  LES:{mode:'interni', zdu:''},
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

/* ===================================================================
   Zprávy – komunikace mezi rolemi (vázaná na případ), VITA „Zprávy".
   4 uživatelé = 4 role/pohledy. Sdílený stav v localStorage (st.msgs).
   =================================================================== */
var VITA_ROLES = { uradnik:'Stavební úředník', koordinator:'Koordinátor', prispevatel:'Přispěvatel (PAK)', prispevatel2:'Přispěvatel 2 (HYG)' };
var VITA_MSG_ROLE = null;
var __vitaUnreadSeen = 0;
function __vitaEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function __vitaMsgLoad(){ try{ return JSON.parse(localStorage.getItem('vita_kv_state'))||{}; }catch(e){ return {}; } }
function __vitaMsgSave(st){ try{ localStorage.setItem('vita_kv_state', JSON.stringify(st)); }catch(e){} }
function __vitaMsgs(){ var st=__vitaMsgLoad(); return Array.isArray(st.msgs)?st.msgs:[]; }
function __vitaUnread(role){ return __vitaMsgs().filter(function(m){ return m.to.indexOf(role)>=0 && (m.readBy||[]).indexOf(role)<0; }).length; }
function __vitaTs(){ var d=new Date(); function p(n){return(n<10?'0':'')+n;} return p(d.getDate())+'.'+p(d.getMonth()+1)+'.'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds()); }
function __vitaBadge(){
  var b=document.getElementById('vitaMsgBadge'); if(!b) return;
  var n=VITA_MSG_ROLE?__vitaUnread(VITA_MSG_ROLE):0;
  b.style.display = n>0?'inline-block':'none'; b.textContent=n;
}
function __vitaRenderTo(){
  var role=VITA_MSG_ROLE; var box=document.getElementById('vitaMsgTo'); if(!box) return;
  box.innerHTML = Object.keys(VITA_ROLES).filter(function(r){return r!==role;}).map(function(r){
    return '<label style="margin-right:14px;font-size:13px;white-space:nowrap"><input type="checkbox" class="vita-msg-to" value="'+r+'"> '+VITA_ROLES[r]+'</label>';
  }).join('');
}
function __vitaRenderMsgs(){
  var role=VITA_MSG_ROLE; var list=document.getElementById('vitaMsgList'); if(!list) return;
  var ms=__vitaMsgs();
  if(!ms.length){ list.innerHTML='<div style="color:#888;padding:16px;text-align:center">Zatím žádné zprávy k tomuto případu.</div>'; return; }
  list.innerHTML = ms.map(function(m){
    var mine=(m.from===role);
    var toTxt=m.to.map(function(r){ return VITA_ROLES[r]||r; }).join(', ');
    var who= mine ? ('Já → '+toTxt) : (VITA_ROLES[m.from]||m.from);
    var unread=(!mine && m.to.indexOf(role)>=0 && (m.readBy||[]).indexOf(role)<0);
    return '<div style="padding:7px 11px;border-bottom:1px solid #eee;'+(mine?'background:#f3f7ff':'')+'">'+
      '<div style="font-size:11.5px;color:#666">'+__vitaEsc(who)+' · '+__vitaEsc(m.ts)+'</div>'+
      '<div style="'+(unread?'font-weight:bold;':'')+'margin-top:1px">'+__vitaEsc(m.text)+'</div>'+
    '</div>';
  }).join('');
  list.scrollTop=list.scrollHeight;
}
function vitaMsgSetRole(role){ VITA_MSG_ROLE=role; __vitaUnreadSeen=role?__vitaUnread(role):0; __vitaBadge(); }
function vitaMsgOpen(){
  var role=VITA_MSG_ROLE; if(!role) return;
  var st=__vitaMsgLoad(); var ms=Array.isArray(st.msgs)?st.msgs:[]; var ch=false;
  ms.forEach(function(m){ if(m.to.indexOf(role)>=0 && (m.readBy||[]).indexOf(role)<0){ m.readBy=m.readBy||[]; m.readBy.push(role); ch=true; } });
  if(ch){ st.msgs=ms; __vitaMsgSave(st); }
  __vitaRenderTo(); __vitaRenderMsgs(); __vitaUnreadSeen=__vitaUnread(role); __vitaBadge();
  var mo=document.getElementById('vitaMsgModal'); if(mo) mo.classList.add('show');
}
function vitaMsgClose(){ var m=document.getElementById('vitaMsgModal'); if(m) m.classList.remove('show'); }
function vitaMsgSend(){
  var role=VITA_MSG_ROLE; if(!role) return;
  var ta=document.getElementById('vitaMsgText'); var txt=(ta.value||'').trim();
  if(!txt){ toast('Napište text zprávy.'); return; }
  var to=[]; document.querySelectorAll('.vita-msg-to:checked').forEach(function(c){ to.push(c.value); });
  if(!to.length){ toast('Vyberte alespoň jednoho adresáta.'); return; }
  var st=__vitaMsgLoad(); st.msgs=Array.isArray(st.msgs)?st.msgs:[];
  st.msgs.push({ id:'m'+Date.now(), from:role, to:to, text:txt, ts:__vitaTs(), readBy:[role] });
  __vitaMsgSave(st);
  ta.value=''; __vitaRenderMsgs(); __vitaUnreadSeen=__vitaUnread(role); __vitaBadge();
  toast('Zpráva odeslána: '+to.map(function(r){return VITA_ROLES[r];}).join(', '));
}
function __vitaMsgInject(){
  if(document.getElementById('vitaMsgBtn')) return;
  var btn=document.createElement('div');
  btn.id='vitaMsgBtn';
  btn.style.cssText='position:fixed;right:14px;bottom:34px;z-index:9998;background:#e8edf4;border:1px solid #9aa7b8;border-radius:4px;padding:5px 11px;font-size:12px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.18);user-select:none;display:flex;align-items:center;gap:6px';
  btn.innerHTML='<span style="font-size:14px">\u2709</span><span>Zprávy</span><span id="vitaMsgBadge" style="display:none;background:#c0392b;color:#fff;border-radius:9px;min-width:16px;text-align:center;padding:0 5px;font-size:11px;line-height:16px">0</span>';
  btn.title='Zprávy ke spisu (komunikace mezi rolemi)';
  btn.onclick=vitaMsgOpen;
  document.body.appendChild(btn);
  var mo=document.createElement('div');
  mo.id='vitaMsgModal'; mo.className='overlay'; mo.style.zIndex='9999';
  mo.innerHTML=''+
    '<div class="modal" style="width:560px;max-width:94vw">'+
      '<div class="m-title">Zprávy ke spisu <span class="m-x" onclick="vitaMsgClose()">\u00d7</span></div>'+
      '<div class="m-body" style="padding:0">'+
        '<div id="vitaMsgList" style="max-height:300px;min-height:120px;overflow:auto;background:#fff"></div>'+
        '<div style="border-top:1px solid #ddd;padding:10px 12px;background:#f7f7f7">'+
          '<div style="margin-bottom:6px;font-size:12px;color:#555">Adresát:</div>'+
          '<div id="vitaMsgTo" style="margin-bottom:8px;display:flex;flex-wrap:wrap;gap:4px 0"></div>'+
          '<textarea id="vitaMsgText" rows="2" style="width:100%;box-sizing:border-box;resize:vertical" placeholder="Napi\u0161te zpr\u00e1vu\u2026 (Enter ode\u0161le, Shift+Enter nov\u00fd \u0159\u00e1dek)"></textarea>'+
        '</div>'+
      '</div>'+
      '<div class="m-foot"><button class="btn" onclick="vitaMsgClose()">Zav\u0159\u00edt</button><button class="btn" onclick="vitaMsgSend()">Odeslat</button></div>'+
    '</div>';
  document.body.appendChild(mo);
  var ta=document.getElementById('vitaMsgText');
  if(ta) ta.addEventListener('keydown', function(e){ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); vitaMsgSend(); } });
  window.addEventListener('storage', function(e){
    if(e.key && e.key!=='vita_kv_state') return;
    __vitaBadge();
    var n=VITA_MSG_ROLE?__vitaUnread(VITA_MSG_ROLE):0;
    if(n>__vitaUnreadSeen){ toast('Nov\u00e1 zpr\u00e1va ('+n+' nep\u0159e\u010dten\u00fdch).'); }
    __vitaUnreadSeen=n;
    var mo2=document.getElementById('vitaMsgModal'); if(mo2 && mo2.classList.contains('show')) __vitaRenderMsgs();
  });
}
function vitaMsgInit(role){
  VITA_MSG_ROLE=role||null;
  function go(){
    __vitaMsgInject();
    __vitaUnreadSeen = role?__vitaUnread(role):0;
    __vitaBadge();
    if(__vitaUnreadSeen>0) toast('M\u00e1te '+__vitaUnreadSeen+' nep\u0159e\u010dten\u00fdch zpr\u00e1v.');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', go); else go();
}

/* ===================== DVOUOSÁ MATICE STAVŮ ===================== */
/* Jeden výpočet f(data) napříč rolemi: procesní osa (jen úředník) + úkolová osa (všichni). */
function vitaStLoad(){ try{ return JSON.parse(localStorage.getItem('vita_kv_state'))||{}; }catch(e){ return {}; } }
var VITA_USEKY=['PAK','OVZ','ZPF','LES','ODP','ZAV','PAM','HYG','UUP'];
var VITA_OWNER_NAME={uradnik:'úředník', koordinator:'koordinátor', do:'DO', vedouci:'vedoucí koord.', done:''};

/* procesní stav podle správního řádu — zobrazuje jen pohled úředníka */
function vitaProces(st){
  st = st || vitaStLoad();
  if(st.prerus || st.doplneniStav==='kekontrole') return {txt:'Přerušeno', cls:'wl-proc-prer'};
  if(st.zahajeniZpusob) return {txt:'Stanoviska / námitky', cls:'wl-proc-stan'};
  return {txt:'Zahájení', cls:'wl-proc-zah'};
}

/* úkolový stav — kanonický vlastník (kdo má míč) + label, jednotně z dat */
function vitaUkol(st){
  st = st || vitaStLoad();
  var pr=st.prisp||{}, removed=st.removedDO||[], extra=st.extraDO||[];
  var list=VITA_USEKY.concat(extra.map(function(d){ return d.usek; }));
  var total=0, podOk=0, done=0, paraf=0;
  list.forEach(function(u){ if(removed.indexOf(u)>=0) return; total++; var p=pr[u]; if(!p) return; if(p.pod==='ok')podOk++; if(p.vyrizeno||p.fikce)done++; if(p.paraf||p.fikce)paraf++; });
  var allPodOk=(total>0&&podOk===total), allDone=(total>0&&done===total), allParaf=(total>0&&paraf===total);
  var extKontrola=Object.keys(pr).some(function(u){ if(removed.indexOf(u)>=0)return false; var p=pr[u]||{}; return p.extKontrola && !p.extDoc && !p.vyrizeno; });
  var extVyzadat=Object.keys(pr).some(function(u){ var p=pr[u]||{}; return p.extVyzadat && !p.extVyzadano; });

  if(st.doplneniStav==='kekontrole'){
    var us=st.doplneniUseky||[]; var pend=us.filter(function(u){ var p=pr[u]||{}; return p.pod!=='ok'; });
    return pend.length ? {owner:'do', label:'Opětovná kontrola podkladů'} : {owner:'uradnik', label:'Obnovit běh řízení'};
  }
  if(extKontrola) return {owner:'koordinator', label:'Vypořádat stanovisko DO'};
  if(extVyzadat)  return {owner:'uradnik', label:'Vyžádat stanovisko DO'};
  if(st.prerus)   return {owner:'uradnik', label:'Vyřídit doplnění podkladů'};
  if(st.kv && st.kv.podepsano) return {owner:'done', label:'KV hotové – podklad rozhodnutí'};
  if(st.kv && st.kv.sestaveno) return {owner:'koordinator', label:'Dokončit a podepsat KV'};
  if(allParaf) return {owner:'koordinator', label:'Sestavit koordinované vyjádření'};
  if(allDone)  return {owner:'koordinator', label:'Parafovat příspěvky'};
  if(st.faze==='vyjadreni' || st.zahajeniZpusob) return {owner:'do', label:'Zpracovat vyjádření DO'};
  if(st.faze==='prideleno' || st.faze==='kontrola'){
    // Úkol se smí změnit teprve po kontrole VŠECH interních DO (ne při dílčím výsledku).
    // PAK je lead: PAK=OK se replikuje na ostatní interní úseky (vč. HYG), nemá-li HYG vlastní „neúplné".
    var pak=pr.PAK||{}, hyg=pr.HYG||{}, hygNeuplne=(hyg.pod==='neuplne');
    var kompletni, neuplne;
    if(pak.pod==='ok' && !hygNeuplne){ kompletni=true; neuplne=false; }
    else { kompletni = !!pak.pod && !!hyg.pod; neuplne = (pak.pod==='neuplne' || hygNeuplne); }
    if(!kompletni) return {owner:'do', label:'Kontrola úplnosti podkladů'};
    if(neuplne)    return {owner:'uradnik', label:'Vydat výzvu k doplnění a přerušit řízení'};
    return {owner:'uradnik', label:'Vyrozumět o zahájení řízení'};
  }
  if(st.faze==='predano') return {owner:'koordinator', label:'Převzít a předat DO'};
  return {owner:'uradnik', label:'Založit a předat řízení'};
}

/* vykreslení úkolového stavu relativně k pozorovateli (role); přispěvateli zpřesní dle úseku */
function vitaUkolView(role, st, usek){
  st = st || vitaStLoad();
  var u = vitaUkol(st);
  var act = (u.owner==='uradnik'&&role==='uradnik') ||
            (u.owner==='koordinator'&&role==='koordinator') ||
            (u.owner==='vedouci'&&role==='koordinator') ||
            (u.owner==='do'&&(role==='pak'||role==='hyg'||role==='prispevatel'));
  if((role==='pak'||role==='hyg'||role==='prispevatel') && usek){
    var p=(st.prisp&&st.prisp[usek])||{};
    var doneVyriz = (role==='hyg') ? (p.vyrizeno&&p.ownEdit) : p.vyrizeno;
    if(p.recheck) return {txt:'Opětovná kontrola úplnosti', cls:'wl-task-act', owner:'do', act:true};
    if(p.vraceno) return {txt:'Vráceno k přepracování', cls:'wl-task-act', owner:'do', act:true};
    if(doneVyriz) return {txt:(p.opraveno?'Vyřízeno (opraveno)':'Vyřízeno (odesláno)'), cls:'wl-task-done', owner:'done', act:false};
    if(p.rozprac) return {txt:'Rozpracováno – k dokončení', cls:'wl-task-act', owner:'do', act:true};
    if(act){
      if(st.zahajeniZpusob || st.faze==='vyjadreni') return {txt:'Zpracovat vyjádření', cls:'wl-task-act', owner:'do', act:true};
      if(p.pod==='ok') return {txt:'Podklady OK – čeká na ostatní DO', cls:'wl-task-wait', owner:'do', act:false};
      if(p.pod==='neuplne') return {txt:'Neúplné – čeká na ostatní DO', cls:'wl-task-wait', owner:'do', act:false};
      return {txt:'Kontrola úplnosti podkladů', cls:'wl-task-act', owner:'do', act:true};
    }
    if(p.pod==='neuplne') return {txt:'Neúplné – čeká na doplnění', cls:'wl-task-wait', owner:'uradnik', act:false};
    return {txt:u.label+' · '+VITA_OWNER_NAME[u.owner], cls:(u.owner==='done'?'wl-task-done':'wl-task-wait'), owner:u.owner, act:false};
  }
  var cls, txt=u.label;
  if(u.owner==='done'){ cls='wl-task-done'; }
  else if(act){ cls='wl-task-act'; }
  else { cls='wl-task-wait'; txt=u.label+' · '+VITA_OWNER_NAME[u.owner]; }
  return {txt:txt, cls:cls, owner:u.owner, act:act};
}
