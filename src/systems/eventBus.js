// Tiny pub/sub. Event names use colon style ('vm:play:end').

export function createEventBus() {
  const handlers = new Map();

  function on(name, fn) {
    if (!handlers.has(name)) handlers.set(name, new Set());
    handlers.get(name).add(fn);
    return () => off(name, fn);
  }

  function off(name, fn) {
    const set = handlers.get(name);
    if (set) set.delete(fn);
  }

  function emit(name, payload) {
    const set = handlers.get(name);
    if (!set) return;
    // Copy so a handler can unsubscribe itself mid-emit.
    for (const fn of [...set]) fn(payload);
  }

  function clear() {
    handlers.clear();
  }

  return { on, off, emit, clear };
}

// Shared bus for the running game. Tests create their own.
export const bus = createEventBus();
