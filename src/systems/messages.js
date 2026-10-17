// Phone text messages (docs/05 texts.messages). Pure.

import { TEXTS } from '../data/texts.js';

// The night starts at 9:40 PM (docs/01 section 4); in-game clock follows real time.
const START_MINUTES = 21 * 60 + 40;

export function clockLabel(runSeconds) {
  const total = START_MINUTES + Math.floor(runSeconds / 60);
  const h24 = Math.floor(total / 60) % 24;
  const m = total % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

export function createMessages(bus) {
  return {
    // key: 'mom1' | 'mom2'. Each message is sent once.
    send(state, key) {
      if (state.messages.some((m) => m.id === key)) return false;
      const msg = TEXTS.messages[key];
      state.messages.push({ id: key, from: msg.from, text: msg.text,
        time: clockLabel(state.clock.runSeconds) });
      if (key === 'mom1') state.flags.momText1Sent = true;
      if (key === 'mom2') state.flags.momText2Sent = true;
      bus.emit('message:received', { id: key });
      return true;
    }
  };
}
