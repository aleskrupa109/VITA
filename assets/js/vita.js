/* === Sdílená logika mockupu VITA Stavební úřad ===
   Hodiny ve stavovém řádku, toast hlášky a zavírání modálních oken klávesou Esc.
   Logiku konkrétní obrazovky (DO, záměr…) drží příslušná stránka ve vlastním <script>. */

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
