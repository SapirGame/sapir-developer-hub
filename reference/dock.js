
const dockEdges = ['bottom', 'left', 'top', 'right'];
const dockPreference = 'sapir-hub:dock-edge';

function setupDock(dock, updateMarker) {
  const grip = dock.querySelector('.dock-grip');
  const shell = dock.closest('.app-shell');
  const preview = dock.cloneNode(true);
  preview.classList.add('dock-preview');
  preview.setAttribute('aria-hidden','true');
  preview.inert = true;
  preview.hidden = true;
  dock.after(preview);
  const buttons = [...dock.querySelectorAll('button')];
  let morphs = [];
  let previewAnimation, dockMorph;
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
    const nearest = dockEdges.reduce((best,edge)=>distances[edge]<distances[best]?edge:best,'bottom');
    return drag.target && distances[drag.target]<=distances[nearest]+16 ? drag.target : nearest;
  }
  function place(x,y) {
    const width = dock.offsetWidth, height = dock.offsetHeight;
    const left = Math.max(0,Math.min(innerWidth-width,x-drag.anchorX*width));
    const top = Math.max(0,Math.min(innerHeight-height,y-drag.anchorY*height));
    dock.style.setProperty('--drag-left',left+'px');
    dock.style.setProperty('--drag-top',top+'px');
    dock.style.setProperty('--skin-width',width+'px');
    dock.style.setProperty('--skin-height',height+'px');
  }

  function move(x,y) {
    const edge = nearestEdge(x,y);
    place(x,y);
    if (edge === drag.target) return;
    const before = dock.getBoundingClientRect();
    const previous = buttons.map(button=>button.getBoundingClientRect());
    morphs.forEach(animation=>animation.cancel());
    dockMorph?.cancel();
    drag.target = edge;
    dock.dataset.edge = edge;
    place(x,y);
    updateMarker();
    const after = dock.getBoundingClientRect();
    if (motionLevel()===2) {
      const dx = before.x+(before.width-after.width)/2-after.x;
      const dy = before.y+(before.height-after.height)/2-after.y;
      dockMorph = dock.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'none'}],
        {duration:340,easing:'cubic-bezier(.22,.76,.22,1)'});
      morphs = buttons.map((button,index)=>{
        const old = previous[index], next = button.getBoundingClientRect();
        const dx = old.x+(old.width-before.width)/2-before.x-(next.x+(next.width-after.width)/2-after.x);
        const dy = old.y+(old.height-before.height)/2-before.y-(next.y+(next.height-after.height)/2-after.y);
        return button.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'none'}],
          {duration:340,easing:'cubic-bezier(.22,.76,.22,1)'});
      });
    }
    document.documentElement.dataset.dockTarget = edge;
    previewAnimation?.cancel();
    preview.dataset.edge = edge;
    preview.hidden = false;
    const active = dock.querySelector('.nav-item.active')?.dataset.route;
    preview.querySelectorAll('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.route===active));
    if (motionLevel()===2) {
      const shift = {left:'-14px,0',right:'14px,0',top:'0,-14px',bottom:'0,14px'}[edge];
      previewAnimation = preview.animate([{transform:'translate('+shift+') scale(.96)',opacity:0},{transform:'none',opacity:.64}],
        {duration:280,easing:'cubic-bezier(.22,.76,.22,1)'});
    }
  }
  function finish(commit) {
    if (!drag) return;
    clearTimeout(drag.timer);
    const started = drag.started;
    const edge = commit && started ? drag.target : drag.original;
    const id = drag.id;
    const before = dock.getBoundingClientRect();
    drag = null;
    dockMorph?.cancel();
    if (grip.hasPointerCapture(id)) grip.releasePointerCapture(id);
    dock.classList.remove('dragging');
    dock.style.removeProperty('--drag-left');
    dock.style.removeProperty('--drag-top');
    dock.style.removeProperty('--skin-width');
    dock.style.removeProperty('--skin-height');
    delete document.documentElement.dataset.dockTarget;
    if (!started) return;
    setEdge(edge,commit);
    const previewOpacity = getComputedStyle(preview).opacity;
    previewAnimation?.cancel();
    if (motionLevel()!==2) preview.hidden = true;
    else {
      previewAnimation = preview.animate([{opacity:previewOpacity},{opacity:0}],{duration:410});
      previewAnimation.onfinish = ()=>{preview.hidden = true;};
    }
    const after = dock.getBoundingClientRect();
    if (motionLevel()===2) {
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
    place(drag.x,drag.y);
    move(drag.lastX,drag.lastY);
  }

  grip.addEventListener('pointerdown',event=>{
    if (event.button!==0 || drag) return;
    snap?.cancel();
    previewAnimation?.cancel();
    preview.hidden = true;
    const rect=dock.getBoundingClientRect();
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,anchorX:(event.clientX-rect.left)/rect.width,anchorY:(event.clientY-rect.top)/rect.height,original:dock.dataset.edge,started:false};
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
      if (drag.started) move(event.clientX,event.clientY);
      finish(true);
    }
  });
  for (const type of ['pointercancel','lostpointercapture']) grip.addEventListener(type,event=>{
    if (drag?.id===event.pointerId) finish(false);
  });
  grip.addEventListener('keydown',event=>{
    const edge={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'top',ArrowDown:'bottom'}[event.key];
    if (!edge || drag) return;
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
  motionChanges.addEventListener('change',()=>{
    if (motionLevel()===2) return;
    snap?.cancel();
    dockMorph?.cancel();
    morphs.forEach(animation=>animation.cancel());
    previewAnimation?.cancel();
    if (!drag?.started) preview.hidden = true;
  });
}

let liquidFrame;
const dockWave = document.querySelector('.dock-wave');
const waveBody = dockWave.querySelector('.wave-body');
const waveCrest = dockWave.querySelector('.wave-crest');
const dockMarker = document.querySelector('.dock-marker');

// Reveal the live page at its layout size along a single moving contour.
const liquidStops = [0, .27, .68, 1];
const liquidCurve = t => t*t*(3-2*t);

function liquidCoordinate(values, stage, t) {
  const slope = index => (values[index+1]-values[index])/(liquidStops[index+1]-liquidStops[index]);
  const join = (before,after) => before*after>0 ? 2*before*after/(before+after) : 0;
  const span = liquidStops[stage+1]-liquidStops[stage];
  const current = slope(stage);
  const start = stage===0 ? current*.42 : join(slope(stage-1),current);
  const end = stage===2 ? 0 : join(current,slope(stage+1));
  const smooth = liquidCurve(t);
  return values[stage]*(1-smooth)+values[stage+1]*smooth
    + span*t*(1-t)*(start*(1-t)-end*t);
}

function liquidPath(points, x=0, y=0, startIndex=0, segments=points.length) {
  const point = i => points[(i+points.length)%points.length];
  const coords = ([px,py]) => (px-x).toFixed(1)+' '+(py-y).toFixed(1);
  let path = 'M'+coords(points[startIndex]);
  for (let i=startIndex; i<startIndex+segments; i++) {
    const [before,start,end,after] = [point(i-1),point(i),point(i+1),point(i+2)];
    const c1 = start.map((value,k)=>value+(end[k]-before[k])*.14);
    const c2 = end.map((value,k)=>value-(after[k]-start[k])*.14);
    path += 'C'+coords(c1)+' '+coords(c2)+' '+coords(end);
  }
  return segments===points.length ? path+'Z' : path;
}

function spreadLiquid(page, from, bounds, edge, duration) {
  const [ax,ay] = {bottom:[0,-1],top:[0,1],left:[1,0],right:[-1,0]}[edge];
  const vertical = ay!==0;
  const cx = from.left+from.width/2;
  const cy = from.top+from.height/2;
  const u = (vertical ? from.width : from.height)*.44;
  const d = (vertical ? from.height : from.width)*.43;
  const top = Math.max(0,bounds.top);
  const bottom = Math.min(innerHeight,bounds.bottom);
  const low = (vertical ? bounds.left-cx : top-cy)-12;
  const high = (vertical ? bounds.right-cx : bottom-cy)+12;
  const back = Math.min(-d,vertical ? Math.min((top-cy)*ay,(bottom-cy)*ay) : Math.min((bounds.left-cx)*ax,(bounds.right-cx)*ax));
  const front = Math.max(d*2,vertical ? Math.max((top-cy)*ay,(bottom-cy)*ay) : Math.max((bounds.left-cx)*ax,(bounds.right-cx)*ax))+16;
  const mid = (low+high)/2;
  const shapes = [
    [[0,-d],[u*.75,-d*.7],[u,0],[u*.74,d*.68],[0,d],[-u*.74,d*.68],[-u,0],[-u*.75,-d*.7]],
    [[0,-d*.82],[u*.63,-d*.45],[high*.23,front*.18],[high*.43,front*.38],[mid*.4,front*.52],[low*.43,front*.4],[low*.23,front*.18],[-u*.63,-d*.45]],
    [[0,back*.5],[high*.63,back*.27],[high*.94,front*.24],[high*.89,front*.78],[mid,front*.98],[low*.9,front*.79],[low*.94,front*.24],[low*.63,back*.27]],
    [[mid,back],[high,back],[high,front*.32],[high,front],[mid,front],[low,front],[low,front*.32],[low,back]],
  ];
  const initialScroll = window.scrollY;
  const started = performance.now();
  dockMarker.style.setProperty('--launch-origin',{bottom:'50% 0%',top:'50% 100%',left:'100% 50%',right:'0% 50%'}[edge]);
  dockWave.setAttribute('viewBox','0 0 '+innerWidth+' '+innerHeight);
  dockWave.removeAttribute('hidden');
  function paint(now) {
    const phase = Math.min(1,Math.max(0,(now-started)/duration));
    if (phase===1) {
      clearLiquid(page);
      return;
    }
    const progress = Math.max(0,(phase-.10)/.90);
    const stage = progress < liquidStops[1] ? 0 : progress < liquidStops[2] ? 1 : 2;
    const t = (progress-liquidStops[stage])/(liquidStops[stage+1]-liquidStops[stage]);
    const drift = -22*(1-liquidCurve(progress));
    const dx = ax*drift;
    const dy = ay*drift;
    const pageLeft = bounds.left+dx;
    const pageTop = bounds.top+dy+initialScroll-window.scrollY;
    const points = shapes[0].map((_,i)=>{
      const lateral = liquidCoordinate(shapes.map(shape=>shape[i][0]),stage,t);
      const depth = liquidCoordinate(shapes.map(shape=>shape[i][1]),stage,t);
      return [cx+(vertical ? lateral : depth*ax),cy+(vertical ? depth*ay : lateral)];
    });
    page.style.clipPath = 'path("'+liquidPath(points,pageLeft,pageTop)+'")';
    page.style.translate = dx+'px '+dy+'px';
    const light = Math.sin(Math.PI*Math.min(1,phase/.66))**2;
    dockMarker.style.setProperty('--launch-light',String(light*.78));
    waveBody.setAttribute('d',liquidPath(points));
    waveCrest.setAttribute('d',liquidPath(points,0,0,2,4));
    waveBody.style.strokeOpacity = String(.42*(1-liquidCurve(Math.min(1,progress/.57))));
    const crest = liquidCurve(Math.min(1,progress/.19))*(1-liquidCurve(Math.max(0,(progress-.54)/.46)));
    dockWave.style.opacity = String(crest*.76);
    liquidFrame = requestAnimationFrame(paint);
  }
  paint(started);
}

function clearLiquid(page) {
  cancelAnimationFrame(liquidFrame);
  page.style.removeProperty('clip-path');
  page.style.removeProperty('translate');
  dockWave.setAttribute('hidden','');
  dockMarker.style.removeProperty('--launch-light');
  dockMarker.style.removeProperty('--launch-origin');
}

function revealFromDock(page, button) {
  clearLiquid(page);
  if (!button || motionLevel()!==2) return;
  spreadLiquid(page,button.getBoundingClientRect(),page.getBoundingClientRect(),button.closest('.dock').dataset.edge,470);
}
