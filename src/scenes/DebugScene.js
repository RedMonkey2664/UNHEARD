// Debug panel overlay (docs/09 section 1). Dev builds only: main.js imports
// this file behind import.meta.env.DEV, so it is not in production bundles.
// A DOM panel beside the canvas: real sliders, and it never steals game taps.

import Phaser from 'phaser';
import { ROOM_IDS } from '../config/constants.js';
import { EVIDENCE, TOOLS } from '../data/items.js';
import { bus } from '../systems/eventBus.js';
import { completedCount, createState, deriveAct, VM_COUNT } from '../systems/gameState.js';

const REFRESH_MS = 100;
const TRIPLE_TAP_MS = 600;
const CORNER_PX = 60;

const CSS_TEXT = `
#debug{position:fixed;top:0;right:0;width:300px;max-height:100vh;overflow-y:auto;overflow-x:hidden;
z-index:20;background:rgba(10,14,15,.94);color:#e8e2d0;font:12px/1.4 ui-monospace,Consolas,monospace;
padding:8px;box-sizing:border-box;border-left:1px solid #2b3b3b;display:none;touch-action:auto;
-webkit-user-select:text;user-select:text}
#debug.show{display:block}
#debug h4{margin:10px 0 4px;color:#f2b35a;font-size:12px}
#debug pre{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
#debug button{font:inherit;background:#101617;color:#e8e2d0;border:1px solid #2b3b3b;
padding:6px 8px;margin:2px;min-height:32px;cursor:pointer}
#debug button.on{border-color:#f3ddb1;color:#f3ddb1}
#debug input[type=range]{width:100%}
`;

export class DebugScene extends Phaser.Scene {
  constructor() {
    super('Debug');
  }

  create() {
    this.buildDom();
    this.lastRefresh = 0;

    this.onKey = (e) => {
      if (e.code === 'Backquote') this.toggle();
    };
    this.taps = [];
    this.onTouch = (e) => {
      if (e.clientX > CORNER_PX || e.clientY > CORNER_PX) return;
      const now = performance.now();
      this.taps = this.taps.filter((t) => now - t < TRIPLE_TAP_MS);
      this.taps.push(now);
      if (this.taps.length >= 3) {
        this.taps = [];
        this.toggle();
      }
    };
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('pointerdown', this.onTouch);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', this.onKey);
      window.removeEventListener('pointerdown', this.onTouch);
      this.root.remove();
      this.style.remove();
    });
  }

  state() {
    return this.registry.get('state');
  }

  toggle() {
    this.root.classList.toggle('show');
  }

  // --- DOM ----------------------------------------------------------------

  buildDom() {
    this.style = document.createElement('style');
    this.style.textContent = CSS_TEXT;
    document.head.appendChild(this.style);

    const root = document.createElement('div');
    root.id = 'debug';
    this.root = root;
    document.body.appendChild(root);

    const section = (title) => {
      const h = document.createElement('h4');
      h.textContent = title;
      root.appendChild(h);
      const div = document.createElement('div');
      root.appendChild(div);
      return div;
    };
    const button = (parent, label, fn) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.addEventListener('click', () => { fn(b); this.refresh(); });
      parent.appendChild(b);
      return b;
    };

    this.readout = document.createElement('pre');
    section('State').appendChild(this.readout);

    const bat = section('Battery');
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.step = '1';
    slider.addEventListener('input', () => {
      this.registry.get('systems').battery.set(this.state(), Number(slider.value));
    });
    bat.appendChild(slider);
    this.batterySlider = slider;

    const tp = section('Teleport');
    for (const room of ROOM_IDS) button(tp, room, () => bus.emit('debug:teleport', { room }));

    const ts = section('Time scale');
    this.scaleButtons = [1, 3].map((n) => button(ts, 'x' + n, () => this.registry.set('timeScale', n)));

    const view = section('View');
    this.hitboxButton = button(view, 'Show hitboxes', () => {
      this.registry.set('debugHitboxes', !this.registry.get('debugHitboxes'));
    });

    const give = section('Give / progress');
    button(give, 'All tools', () => {
      const s = this.state();
      for (const id of Object.keys(TOOLS)) if (!s.inventory.tools.includes(id)) s.inventory.tools.push(id);
    });
    button(give, 'All evidence', () => {
      const s = this.state();
      for (const id of Object.keys(EVIDENCE)) if (!s.inventory.evidence.includes(id)) s.inventory.evidence.push(id);
      s.stats.evidenceCount = s.inventory.evidence.length;
    });
    const done = document.createElement('div');
    done.textContent = 'Complete voicemail 1..N: ';
    give.appendChild(done);
    for (let n = 1; n <= VM_COUNT; n++) {
      button(done, String(n), () => this.registry.get('systems').flow.debugComplete(this.state(), n));
    }

    const misc = section('Run');
    this.assistButton = button(misc, 'Assist', () => {
      const s = this.state();
      s.settings.assist = !s.settings.assist;
    });
    this.prologueButton = button(misc, 'Skip prologue', () => {
      this.registry.set('skipPrologue', !this.registry.get('skipPrologue'));
    });
    button(misc, 'Reset run', () => this.resetRun());
  }

  resetRun() {
    for (const key of ['Memory', 'Prologue']) if (this.scene.isActive(key)) this.scene.stop(key);
    this.registry.set('state', createState(this.registry.get('settings')));
    this.scene.get('Room').scene.restart();
  }

  // --- refresh ------------------------------------------------------------

  update(time) {
    if (!this.root.classList.contains('show')) return;
    if (time - this.lastRefresh < REFRESH_MS) return;
    this.lastRefresh = time;
    this.refresh();
  }

  refresh() {
    const s = this.state();
    if (!s) return;
    s.act = deriveAct(s);
    const p = s.player;
    const v = s.vikram;
    const f = s.flags;
    const vms = [];
    for (let id = 1; id <= VM_COUNT; id++) vms.push(id + ':' + s.voicemails[id].status);
    this.readout.textContent = [
      `act ${s.act}  completed ${completedCount(s)}  run ${s.clock.runSeconds.toFixed(1)}s`,
      `battery ${s.battery.toFixed(2)}  noise ${s.noise.toFixed(1)}  presence ${s.presence.toFixed(1)}`,
      `player ${p.room} x=${p.x.toFixed(0)} hidden=${p.hidden} locked=${p.locked}`,
      `  torch=${s.torchOn} sneak=${p.sneaking} moving=${p.moving}`,
      `vikram ${v.state} ${v.room ?? '-'} x=${v.x.toFixed(0)} st=${v.stateTimer.toFixed(1)} away=${v.awayTimer.toFixed(1)}`,
      `  route=${v.routeId} target=${v.target ?? '-'} seenHiding=${v.seenHiding}`,
      `flags temptation=${f.temptationShown} locker=${f.lockerOpened} tape=${f.tapeTaken}`,
      `  call=${f.callConnected} eta=${f.policeEta ?? '-'} deadAir=${f.deadAirTimer ?? '-'}`,
      `stats ${JSON.stringify(s.stats)}`,
      `tools ${s.inventory.tools.join(',') || '-'}  cards ${s.cardPieces.join(',') || '-'}`,
      `evidence ${s.inventory.evidence.join(',') || '-'}`,
      `vm ${vms.join(' ')}`
    ].join('\n');

    if (document.activeElement !== this.batterySlider) {
      this.batterySlider.value = String(Math.round(s.battery));
    }
    const scale = this.registry.get('timeScale') || 1;
    this.scaleButtons.forEach((b, i) => b.classList.toggle('on', [1, 3][i] === scale));
    this.hitboxButton.classList.toggle('on', Boolean(this.registry.get('debugHitboxes')));
    this.assistButton.classList.toggle('on', s.settings.assist);
    this.prologueButton.classList.toggle('on', Boolean(this.registry.get('skipPrologue')));
  }
}
