const INPUT = 'input';
const OUTPUT = 'output';

export class GraphUI {
  constructor({ canvas, createModule, onConnect }) {
    this.canvas = canvas;
    this.createModule = createModule;
    this.onConnect = onConnect;
    this.selectedOutput = null;
    this.moduleElements = new Map();

    this.cableSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.cableSvg.classList.add('cables');
    this.canvas.appendChild(this.cableSvg);
  }

  addModuleCard(module, configRows = []) {
    const card = document.createElement('article');
    card.className = 'module';
    card.style.left = `${module.position.x}px`;
    card.style.top = `${module.position.y}px`;

    card.innerHTML = `
      <div class="module-header">
        <strong>${module.type.toUpperCase()}</strong>
        <small>#${module.id}</small>
      </div>
      <div class="module-body"></div>
      <div class="ports">
        <div class="port input" data-dir="${INPUT}" title="audio in"></div>
        <div class="port output" data-dir="${OUTPUT}" title="audio out"></div>
      </div>
    `;

    const body = card.querySelector('.module-body');
    configRows.forEach((row) => body.appendChild(row));

    card.querySelectorAll('.port').forEach((port) => {
      port.addEventListener('click', () => {
        const direction = port.dataset.dir;
        if (direction === OUTPUT) {
          this.selectedOutput = { moduleId: module.id, el: port };
          return;
        }
        if (direction === INPUT && this.selectedOutput) {
          this.onConnect({ from: this.selectedOutput.moduleId, to: module.id });
          this.selectedOutput = null;
        }
      });
    });

    this.makeDraggable(card, module);
    this.canvas.appendChild(card);
    this.moduleElements.set(module.id, card);
  }

  updateCableRender(connections) {
    this.cableSvg.innerHTML = '';
    connections.forEach((c) => {
      const from = this.moduleElements.get(c.from)?.querySelector('.port.output');
      const to = this.moduleElements.get(c.to)?.querySelector('.port.input');
      if (!from || !to) return;
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const p = this.canvas.getBoundingClientRect();
      const x1 = a.left - p.left + a.width / 2 + this.canvas.scrollLeft;
      const y1 = a.top - p.top + a.height / 2 + this.canvas.scrollTop;
      const x2 = b.left - p.left + b.width / 2 + this.canvas.scrollLeft;
      const y2 = b.top - p.top + b.height / 2 + this.canvas.scrollTop;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${y1} C ${x1 + 70} ${y1}, ${x2 - 70} ${y2}, ${x2} ${y2}`);
      path.setAttribute('stroke', '#6ab2ff');
      path.setAttribute('fill', 'transparent');
      path.setAttribute('stroke-width', '3');
      this.cableSvg.appendChild(path);
    });
  }

  clear() {
    this.canvas.innerHTML = '';
    this.canvas.appendChild(this.cableSvg);
    this.moduleElements.clear();
  }

  makeDraggable(card, module) {
    const handle = card.querySelector('.module-header');
    let dragging = false;
    let dx = 0;
    let dy = 0;

    handle.addEventListener('pointerdown', (e) => {
      dragging = true;
      card.style.zIndex = String(Date.now());
      dx = e.clientX - module.position.x;
      dy = e.clientY - module.position.y;
      handle.setPointerCapture(e.pointerId);
      handle.style.cursor = 'grabbing';
      e.preventDefault();
    });

    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      module.position.x = e.clientX - dx;
      module.position.y = e.clientY - dy;
      card.style.left = `${module.position.x}px`;
      card.style.top = `${module.position.y}px`;
      this.updateCableRender(window.__ambeoConnections || []);
    });

    const stopDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      handle.style.cursor = 'grab';
      if (e?.pointerId !== undefined && handle.hasPointerCapture(e.pointerId)) {
        handle.releasePointerCapture(e.pointerId);
      }
    };

    handle.addEventListener('pointerup', stopDrag);
    handle.addEventListener('pointercancel', stopDrag);
  }

  static controlRow(label, input) {
    const row = document.createElement('label');
    row.className = 'module-row';
    const span = document.createElement('span');
    span.textContent = label;
    row.appendChild(span);
    row.appendChild(input);
    return row;
  }
}
