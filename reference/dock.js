
const dockEdges = ['bottom', 'left', 'top', 'right'];
const dockPreference = 'sapir-hub:dock-edge';

function setupDock(dock, updateMarker) {
  const grip = dock.querySelector('.dock-grip');
  const shell = dock.closest('.app-shell');
  const edges = {top:'сверху',right:'справа',bottom:'снизу',left:'слева'};
  let drag = null;
  let snap = null;
  let saved;
  try { saved = localStorage.getItem(dockPreference); } catch { /* File previews may restrict storage. */ }

  function setEdge(edge, persist = true) {
    dock.dataset.edge = edge;
    shell.dataset.dockEdge = edge;
    grip.setAttribute('aria-label','Переместить панель. Сейчас ' + edges[edge]);
    updateMarker();
    if (persist) {
      try { localStorage.setItem(dockPreference, edge); } catch { /* The edge still applies for this session. */ }
    }
  }
  function nearestEdge(x,y) {
    const distances = {left:x,top:y,right:innerWidth-x,bottom:innerHeight-y};
    return dockEdges.reduce((nearest,edge)=>distances[edge]<distances[nearest]?edge:nearest,'bottom');
  }
  function move(x,y) {
    const left = Math.max(0,Math.min(innerWidth-dock.offsetWidth,drag.left+x-drag.x));
    const top = Math.max(0,Math.min(innerHeight-dock.offsetHeight,drag.top+y-drag.y));
    dock.style.setProperty('--drag-left',left+'px');
    dock.style.setProperty('--drag-top',top+'px');
    document.documentElement.dataset.dockTarget=nearestEdge(x,y);
  }
  function finish(commit) {
    if (!drag) return;
    clearTimeout(drag.timer);
    const started = drag.started;
    const edge = commit && started ? nearestEdge(drag.lastX,drag.lastY) : dock.dataset.edge;
    const id = drag.id;
    const before = dock.getBoundingClientRect();
    drag = null;
    if (grip.hasPointerCapture(id)) grip.releasePointerCapture(id);
    dock.classList.remove('dragging');
    dock.style.removeProperty('--drag-left');
    dock.style.removeProperty('--drag-top');
    delete document.documentElement.dataset.dockTarget;
    if (!started) return;
    setEdge(edge,commit);
    const after = dock.getBoundingClientRect();
    if (!reduceMotion.matches) {
      snap = dock.animate([
        {transform:'translate('+(before.left-after.left)+'px,'+(before.top-after.top)+'px)'},
        {transform:'none'},
      ], {duration:410,easing:'cubic-bezier(.2,.8,.24,1)'});
    }
  }

  setEdge(dockEdges.includes(saved)?saved:'bottom',false);
  function beginDrag() {
    if (!drag || drag.started) return;
    clearTimeout(drag.timer);
    drag.started=true;
    dock.classList.add('dragging');
    move(drag.lastX,drag.lastY);
  }

  grip.addEventListener('pointerdown',event=>{
    if (event.button!==0 || drag) return;
    snap?.cancel();
    const rect=dock.getBoundingClientRect();
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,left:rect.left,top:rect.top,started:false};
    grip.setPointerCapture(event.pointerId);
    drag.timer=setTimeout(beginDrag,170);
  });
  grip.addEventListener('pointermove',event=>{
    if (drag?.id!==event.pointerId) return;
    drag.lastX=event.clientX;
    drag.lastY=event.clientY;
    if (drag.started) move(event.clientX,event.clientY);
    else if (Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>7) beginDrag();
  });
  grip.addEventListener('pointerup',event=>{
    if (drag?.id===event.pointerId) {
      drag.lastX=event.clientX;
      drag.lastY=event.clientY;
      finish(true);
    }
  });
  for (const type of ['pointercancel','lostpointercapture']) grip.addEventListener(type,event=>{
    if (drag?.id===event.pointerId) finish(false);
  });
  grip.addEventListener('keydown',event=>{
    const edge={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'top',ArrowDown:'bottom'}[event.key];
    if (!edge) return;
    event.preventDefault();
    snap?.cancel();
    setEdge(edge);
  });
  grip.addEventListener('click',event=>{
    if (event.detail!==0) return;
    const current=dockEdges.indexOf(dock.dataset.edge);
    setEdge(dockEdges[(current+1)%dockEdges.length]);
  });
  window.addEventListener('keydown',event=>{
    if (event.key==='Escape' && drag) finish(false);
  });
  window.addEventListener('blur',()=>finish(false));
}

let sectionReveal;
let sectionGlow;
function revealFromDock(page, origin) {
  sectionReveal?.cancel();
  sectionGlow?.cancel();
  if (!origin || reduceMotion.matches) return;
  const bounds=page.getBoundingClientRect();
  const left=Math.max(0,Math.min(bounds.width-1,origin.left-bounds.left));
  const top=Math.max(0,Math.min(bounds.height-1,origin.top-bounds.top));
  const right=Math.max(0,bounds.right-origin.right);
  const bottom=Math.max(0,bounds.bottom-origin.bottom);
  const clip=(t,r,b,l,radius)=>'inset('+t+'px '+r+'px '+b+'px '+l+'px round '+radius+'px)';
  sectionReveal=page.animate([
    {clipPath:clip(top,right,bottom,left,17),opacity:.35},
    {clipPath:clip(top*.27,right*.23,bottom*.23,left*.23,22),opacity:1,offset:.52},
    {clipPath:clip(0,0,0,0,0),opacity:1},
  ],{duration:570,easing:'cubic-bezier(.22,.72,.18,1)'});

  const glow=document.querySelector('.dock-flow');
  const endX=bounds.left+bounds.width/2;
  const endY=(Math.max(bounds.top,0)+Math.min(bounds.bottom,innerHeight))/2;
  const dx=endX-origin.left-origin.width/2;
  const dy=endY-origin.top-origin.height/2;
  Object.assign(glow.style,{left:origin.left+'px',top:origin.top+'px',width:origin.width+'px',height:origin.height+'px'});
  sectionGlow=glow.animate([
    {opacity:.85,transform:'translate(0,0) scale(1)'},
    {opacity:.32,transform:'translate('+dx*.65+'px,'+dy*.65+'px) scale(4,2.6)',offset:.53},
    {opacity:0,transform:'translate('+dx+'px,'+dy+'px) scale(8,4.5)'},
  ],{duration:510,easing:'cubic-bezier(.16,.84,.22,1)'});
}
