
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let disposeGraph = () => {};
const graphPositions = new Map();

function mountGraph(graph) {
  const buttons = [...graph.querySelectorAll('.graph-node')];
  const nodes = buttons.map((button, index) => ({
    button, index, anchor: graphPositions.get(button.dataset.doc) ||
      {x: Number(button.dataset.x) / 100, y: Number(button.dataset.y) / 100},
    x: 0, y: 0, vx: 0, vy: 0, halfWidth: 0, halfHeight: 0,
  }));
  const caption = graph.querySelector('.graph-caption');
  const edges = [...graph.querySelectorAll('line')].map(line => ({
    line, from: nodes[Number(line.dataset.from)], to: nodes[Number(line.dataset.to)],
  }));
  const svg = graph.querySelector('svg');
  const controller = new AbortController();
  const {signal} = controller;
  let width = 1, height = 1, captionHeight = 0, frame = 0, last = 0, drag = null, ignoredClick = null;

  const clamp = (value, padding, size) => Math.max(padding, Math.min(size - padding, value));
  const place = (node, x, y) => {
    node.x = clamp(x, node.halfWidth + 8, width);
    node.y = clamp(y, node.halfHeight + 8, height - captionHeight);
  };
  const paint = () => {
    for (const node of nodes) {
      node.button.style.transform = 'translate3d(' + (node.x - node.halfWidth) + 'px,' + (node.y - node.halfHeight) + 'px,0)';
    }
    for (const {line, from, to} of edges) {
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y);
    }
  };
  const resize = () => {
    width = graph.clientWidth || 1;
    height = graph.clientHeight || 1;
    captionHeight = caption.offsetHeight;
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    for (const node of nodes) {
      node.halfWidth = node.button.offsetWidth / 2;
      node.halfHeight = node.button.offsetHeight / 2;
      place(node, node.anchor.x * width, node.anchor.y * height);
    }
    paint();
  };
  const tick = (time) => {
    const dt = last ? Math.min(2, (time - last) / 16.67) : 1;
    last = time;
    for (const node of nodes) {
      if (drag?.node === node || document.activeElement === node.button) continue;
      const phase = time / 720 + node.index * 1.6;
      const targetX = node.anchor.x * width + Math.cos(phase * .8) * 8;
      const targetY = node.anchor.y * height + Math.sin(phase) * 12;
      node.vx = (node.vx + (clamp(targetX, node.halfWidth + 8, width) - node.x) * .065 * dt) * .87 ** dt;
      node.vy = (node.vy + (clamp(targetY, node.halfHeight + 8, height - captionHeight) - node.y) * .065 * dt) * .87 ** dt;
      place(node, node.x + node.vx * dt, node.y + node.vy * dt);
    }
    paint();
    frame = requestAnimationFrame(tick);
  };
  const updateMotion = () => {
    cancelAnimationFrame(frame);
    last = 0;
    if (reduceMotion.matches) resize();
    else frame = requestAnimationFrame(tick);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(graph);
  observer.observe(caption);
  for (const {button} of nodes) observer.observe(button);
  resize();
  updateMotion();
  reduceMotion.addEventListener('change', updateMotion, {signal});

  graph.querySelector('[data-reset-graph]').addEventListener('click', () => {
    for (const node of nodes) {
      const {doc,x,y} = node.button.dataset;
      graphPositions.delete(doc);
      node.anchor = {x:Number(x)/100,y:Number(y)/100};
      node.vx = node.vy = 0;
    }
    if (reduceMotion.matches) resize();
  }, {signal});
  for (const node of nodes) {
    const {button} = node;
    const illuminate = () => {
      for (const edge of edges) {
        const connected = edge.from === node || edge.to === node;
        if (connected) edge.line.classList.toggle('lit',button.matches(':hover,:focus-visible,.dragging'));
      }
    };
    for (const event of ['pointerenter','pointerleave','focus','blur']) button.addEventListener(event,illuminate,{signal});
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || drag) return;
      ignoredClick = null;
      drag = {node, id: event.pointerId, startX: event.clientX, startY: event.clientY, x: node.x, y: node.y, moved: false};
      button.setPointerCapture(event.pointerId);
    }, {signal});
    button.addEventListener('pointermove', event => {
      if (drag?.id !== event.pointerId || drag.node !== node) return;
      const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < 5) return;
      drag.moved = true;
      button.classList.add('dragging');
      illuminate();
      const {x, y} = node;
      place(node, drag.x + dx, drag.y + dy);
      node.vx = Math.max(-6, Math.min(6, node.x - x));
      node.vy = Math.max(-6, Math.min(6, node.y - y));
      paint();
    }, {signal});
    const finish = event => {
      if (drag?.id !== event.pointerId || drag.node !== node) return;
      if (drag.moved) {
        node.anchor = {x: node.x / width, y: node.y / height};
        graphPositions.set(button.dataset.doc, node.anchor);
        ignoredClick = button;
        button.blur();
      }
      drag = null;
      button.classList.remove('dragging');
      illuminate();
    };
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, finish, {signal});
    button.addEventListener('click', event => {
      if (ignoredClick !== button || event.detail === 0) return;
      ignoredClick = null;
      event.stopPropagation();
    }, {signal});
  }
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    controller.abort();
  };
}

function setupWelcome() {
  const panel = byId('welcome');
  const shell = document.querySelector('.app-shell');
  const enter = byId('welcome-enter');
  const replay = byId('replay-welcome');
  let trigger = null;
  let disposeIntro = () => {};
  const show = (source) => {
    trigger = source;
    panel.classList.remove('leaving');
    panel.showModal();
    shell.inert = true;
    disposeIntro = mountPrism(panel.querySelector('[data-prism]'));
    enter.focus({preventScroll:true});
  };
  const dismiss = () => {
    if (!panel.open || panel.classList.contains('leaving')) return;
    const finish = () => {
      panel.close();
      panel.classList.remove('leaving');
      disposeIntro();
      shell.inert = false;
      if (!trigger && !reduceMotion.matches) {
        byId('page').animate([
          {opacity:.35},
          {opacity:1},
        ],{duration:470,easing:'cubic-bezier(.19,1,.22,1)'});
      }
      (trigger || byId('brand-home')).focus({preventScroll:true});
    };
    if (reduceMotion.matches) finish();
    else {
      panel.classList.add('leaving');
      setTimeout(finish, 340);
    }
  };
  enter.addEventListener('click', dismiss);
  replay.addEventListener('click', () => show(replay));
  panel.addEventListener('cancel', event => {event.preventDefault(); dismiss();});
  if (!initialView) show(null);
}
