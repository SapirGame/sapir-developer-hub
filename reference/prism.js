
function buildBrilliantCut() {
  const vertices=[];
  const faces=[];
  const ring=(count,radius,y,phase=0)=>Array.from({length:count},(_,index)=>{
    const angle=phase+index*Math.PI*2/count;
    return vertices.push([radius*Math.cos(angle),y,radius*Math.sin(angle)])-1;
  });
  const table=ring(8,.56,-.57);
  const upper=ring(16,1,-.035);
  const lower=ring(16,1,.025);
  const starRadius=.79;
  const pavilionRadius=.55;
  const phase=Math.PI/8;
  const starY=-.57+(starRadius*Math.cos(phase)-.56)*(.535/.44);
  const pavilionY=1.12+(.025-1.12)*pavilionRadius*Math.cos(phase);
  const stars=ring(8,starRadius,starY,phase);
  const pavilion=ring(8,pavilionRadius,pavilionY,phase);
  const point=vertices.push([0,1.12,0])-1;

  function facet(indices, kind) {
    const points=indices.map(i=>vertices[i]);
    const [a,b,c]=points;
    const u=b.map((value,i)=>value-a[i]);
    const v=c.map((value,i)=>value-a[i]);
    let normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const center=a.map((_,i)=>points.reduce((sum,p)=>sum+p[i],0)/points.length);
    const length=Math.hypot(...normal);
    const outward=normal[0]*center[0]+normal[1]*(center[1]-.1)+normal[2]*center[2];
    normal=normal.map(value=>value*(outward<0?-1:1)/length);
    faces.push({indices,normal,center,kind});
  }

  facet(table,'table');
  for (let i=0;i<8;i++) {
    const next=(i+1)%8, previous=(i+7)%8;
    const a=i*2, b=a+1, c=next*2;
    facet([table[i],table[next],stars[i]],'star');
    facet([table[i],stars[i],upper[a],stars[previous]],'crown');
    facet([stars[i],upper[a],upper[b]],'crown');
    facet([stars[i],upper[b],upper[c]],'crown');
    facet([upper[a],upper[b],lower[b],lower[a]],'rim');
    facet([upper[b],upper[c],lower[c],lower[b]],'rim');
    facet([lower[a],pavilion[i],point,pavilion[previous]],'pavilion');
    facet([lower[a],lower[b],pavilion[i]],'pavilion');
    facet([lower[b],lower[c],pavilion[i]],'pavilion');
  }
  return {vertices,faces};
}

const brilliantCut=buildBrilliantCut();
const dot3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];

function drawGlint(context,x,y,radius,alpha) {
  context.save();
  context.translate(x,y);
  context.rotate(-.23);
  context.globalAlpha*=alpha;
  const halo=context.createRadialGradient(0,0,0,0,0,radius);
  halo.addColorStop(0,'rgba(226,242,255,.94)');
  halo.addColorStop(.24,'rgba(159,209,255,.43)');
  halo.addColorStop(1,'rgba(111,168,255,0)');
  context.fillStyle=halo;
  context.fillRect(-radius,-radius,radius*2,radius*2);
  context.fillStyle='#F3FAFF';
  context.beginPath();
  context.moveTo(-radius,0);
  context.quadraticCurveTo(-2,-2,0,-radius*.66);
  context.quadraticCurveTo(2,-2,radius,0);
  context.quadraticCurveTo(2,2,0,radius*.66);
  context.quadraticCurveTo(-2,2,-radius,0);
  context.fill();
  context.restore();
}

/* Procedural illustration. The official Sapir mark is a separate image asset. */
function mountPrism(canvas) {
  const context = canvas.getContext('2d');
  if (!context) return () => {};
  const compact = canvas.dataset.prism === 'intro';
  const scene = compact ? canvas.closest('dialog') : canvas.parentElement;
  const controller = new AbortController();
  const {signal} = controller;
  const {vertices,faces}=brilliantCut;
  const stars = Array.from({length:86},(_,i)=>[(i*97%191)/191,(i*71%233)/233,(i*19%43)/43]);
  let width=0,height=0,frame=0,visible=true;
  let x=0,y=0,tx=0,ty=0,spin=0,spinGoal=0,drag=null;
  let idleAngle=.6,lastFrame=0,resumeAfter=0;
  const paint = (time) => {
    if (!width || !height) return;
    const narrow = width<680;
    const cx=width*(compact ? .5 : narrow ? .69 : .735);
    const cy=height*(compact ? .48 : narrow ? .28 : .47);
    const size=Math.min(width*(compact ? .18 : .235),height*(compact ? .235 : narrow ? .27 : .365));
    const mobileStage = narrow && !compact;
    const angle=idleAngle-x*.68+spin;
    const pitch=-.24+y*.44+Math.sin(time*.0008)*.055;
    const sin=Math.sin(angle), cos=Math.cos(angle), sp=Math.sin(pitch), cp=Math.cos(pitch);
    context.clearRect(0,0,width,height);
    const glow=context.createRadialGradient(cx,cy,0,cx,cy,size*2.45);
    glow.addColorStop(0,'rgba(35,70,238,.38)');
    glow.addColorStop(.5,'rgba(18,57,195,.19)');
    glow.addColorStop(1,'rgba(18,57,195,0)');
    context.fillStyle=glow;
    context.fillRect(0,0,width,height);
    for (const [u,v,b] of stars) {
      const sx=cx+(u-.5)*size*4.7+x*b*10;
      const sy=cy+(v-.5)*size*3.5+y*b*10;
      context.fillStyle='rgba(207,222,255,'+(.16+b*.55)+')';
      context.fillRect(sx,sy,b>.85?2:1,b>.85?2:1);
    }
    context.save();
    context.translate(cx,cy+size*.16);
    context.rotate(-.26+x*.15);
    for (let i=0;i<4;i++) {
      const radius=size*(1.38+i*.16);
      context.beginPath();
      context.ellipse(0,0,radius,radius*.39,0,0,Math.PI*2);
      context.strokeStyle='rgba(163,184,255,'+(i===0?.29:.12)+')';
      context.lineWidth=1;
      if (i===2) context.setLineDash([2,5]);
      context.stroke();
      context.setLineDash([]);
      const orbit=time*(i%2 ? -.00062 : .00046)+i*1.73;
      const px=Math.cos(orbit)*radius, py=Math.sin(orbit)*radius*.39;
      context.beginPath();
      context.arc(px,py,i===1?2.7:1.7,0,Math.PI*2);
      context.fillStyle=i===1?'#F57A00':'#DDE2E6';
      context.fill();
    }
    context.restore();

    const rotate=([a,b,c])=>{
      const xx=a*cos-c*sin, depth=a*sin+c*cos;
      return [xx,b*cp-depth*sp,b*sp+depth*cp];
    };
    const project=([a,b,c])=>{
      const k=4.6/(4.6-c);
      return [cx+a*size*k+x*10,cy+b*size*k+y*8,c];
    };
    const screen=vertices.map(vertex=>project(rotate(vertex)));
    const order=faces.map((face,index)=>({...face,index,n:rotate(face.normal),mid:rotate(face.center)}))
      .filter(({n,mid})=>dot3(n,[-mid[0],-mid[1],4.6-mid[2]])>0)
      .sort((a,b)=>a.mid[2]-b.mid[2]);
    const light=[-.55+Math.sin(time*.00065)*.18,-.6,.57];
    const lightLength=Math.hypot(...light);
    const key=light.map(value=>value/lightLength);
    const half=[key[0],key[1],key[2]+1];
    const halfLength=Math.hypot(...half);
    const reflection=half.map(value=>value/halfLength);
    let glint;
    context.save();
    context.globalAlpha=mobileStage ? .89 : compact ? .91 : 1;
    for (const {indices,kind,n,mid,index} of order) {
      const points=indices.map(i=>screen[i]);
      const diffuse=Math.max(0,dot3(n,key));
      const spec=Math.max(0,dot3(n,reflection))**11;
      const grazing=(1-Math.max(0,n[2]))**2;
      const internal=.5+.5*Math.sin(index*4.66+angle*4.4+n[0]*3);
      const isTable=kind==='table';
      const isRim=kind==='rim';
      const brightness=18+diffuse*23+internal*15+spec*28+(isRim?6:0);
      const tint=228-internal*15+grazing*7;
      const [px,py]=project(mid);
      const gradient=context.createLinearGradient(px-size*.32,py-size*.34,px+size*.27,py+size*.37);
      gradient.addColorStop(0,'hsl('+tint+' 93% '+Math.min(87,brightness+15+grazing*12)+'%)');
      gradient.addColorStop(.47,'hsl('+(tint+3)+' 84% '+brightness+'%)');
      gradient.addColorStop(1,'hsl('+(tint+9)+' 86% '+Math.max(8,brightness-18)+'%)');
      context.beginPath();
      for (const [i,[sx,sy]] of points.entries()) i ? context.lineTo(sx,sy) : context.moveTo(sx,sy);
      context.closePath();
      context.fillStyle=gradient;
      context.fill();
      context.lineWidth=isRim ? .85 : .58;
      context.strokeStyle='rgba(193,225,255,'+(.14+spec*.37+grazing*.11)+')';
      context.stroke();
      if (isTable || spec>.32) {
        const sheen=context.createLinearGradient(px-size*.21,py,px+size*.31,py-size*.33);
        sheen.addColorStop(0,'rgba(231,251,255,0)');
        sheen.addColorStop(.66,'rgba(193,234,255,'+(.055+spec*.17)+')');
        sheen.addColorStop(.73,'rgba(231,251,255,'+(.10+spec*.2)+')');
        sheen.addColorStop(1,'rgba(231,251,255,0)');
        context.fillStyle=sheen;
        context.fill();
      }
      if (!isTable && !isRim && (!glint || glint.spec<spec)) {
        const [gx,gy]=points.reduce((best,p)=>p[1]<best[1]?p:best,points[0]);
        glint={x:gx,y:gy,spec};
      }
    }
    const shimmer=Math.max(0,1-Math.abs((time%4900)-2900)/430);
    if (glint && shimmer>0 && !reduceMotion.matches) {
      drawGlint(context,glint.x,glint.y,Math.min(28,size*.16),shimmer*shimmer*(.38+glint.spec*.48));
    }
    context.restore();
  };
  const tick = time => {
    if (!drag && time>resumeAfter && lastFrame) idleAngle+=Math.min(time-lastFrame,32)*.00030;
    lastFrame=time;
    x+=(tx-x)*.095;
    y+=(ty-y)*.095;
    spin+=(spinGoal-spin)*.115;
    paint(time);
    frame=requestAnimationFrame(tick);
  };
  const update = () => {
    cancelAnimationFrame(frame);
    frame=0;
    lastFrame=0;
    if (reduceMotion.matches) paint(1240);
    else if (visible) frame=requestAnimationFrame(tick);
  };
  const resize = new ResizeObserver(() => {
    const rect=canvas.getBoundingClientRect();
    width=rect.width;height=rect.height;
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    if (reduceMotion.matches) paint(1240);
  });
  resize.observe(canvas);
  const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();});
  intersection.observe(canvas);
  const reset=()=>{tx=ty=0;};
  scene.addEventListener('pointermove',event=>{
    if (drag?.id===event.pointerId) {
      spinGoal=drag.spin-(event.clientX-drag.x)*.012;
      if (reduceMotion.matches) { spin=spinGoal;paint(1240); }
      return;
    }
    if (reduceMotion.matches) return;
    const rect=scene.getBoundingClientRect();
    tx=(event.clientX-rect.left)/rect.width*2-1;
    ty=(event.clientY-rect.top)/rect.height*2-1;
  },{signal});
  scene.addEventListener('pointerleave',reset,{signal});
  if (!compact) {
    canvas.addEventListener('pointerdown',event=>{
      if (event.button!==0 || drag) return;
      tx=x;ty=y;
      drag={id:event.pointerId,x:event.clientX,spin};
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add('grabbing');
    },{signal});
    for(const type of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(type,()=>{
      drag=null;resumeAfter=performance.now()+1100;canvas.classList.remove('grabbing');
    },{signal});
  }
  reduceMotion.addEventListener('change',update,{signal});
  update();
  return ()=>{cancelAnimationFrame(frame);resize.disconnect();intersection.disconnect();controller.abort();};
}
