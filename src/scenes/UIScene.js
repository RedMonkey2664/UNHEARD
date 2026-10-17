// HUD, subtitles and toasts, running on top of RoomScene. Reads GameState to
// draw and forwards button taps as ui:* events.

import Phaser from 'phaser';
import { bus } from '../systems/eventBus.js';
import { Subtitles } from '../audio/Subtitles.js';
import { Hud } from '../ui/Hud.js';
import { Toast } from '../ui/Toast.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    this.subs = [];
    this.events.once('shutdown', () => this.subs.forEach((off) => off()));
    const on = (name, fn) => this.subs.push(bus.on(name, fn));

    this.hud = new Hud(this, {
      torch: () => bus.emit('ui:torch', {}),
      sneak: () => bus.emit('ui:sneak', {}),
      phone: () => bus.emit('ui:phone', {})
    });
    this.subtitles = new Subtitles(this, 20);
    this.toast = new Toast(this, 20);

    on('battery:changed', ({ value }) => this.hud.setBattery(value));
    on('ui:subtitle', ({ who, text, sec }) => {
      this.subtitles.show(who, text, sec, this.state().settings.subtitleSize);
    });
    on('ui:toast', ({ text }) => this.toast.show(text));
    this.hud.setBattery(this.state().battery);
  }

  // Read from the registry each time: a debug reset swaps the object.
  state() {
    return this.registry.get('state');
  }

  update() {
    this.hud.update(this.state());
  }
}
