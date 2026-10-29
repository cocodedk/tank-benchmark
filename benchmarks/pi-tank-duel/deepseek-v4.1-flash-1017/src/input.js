const TRACKED = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
  'Space',
]);

export class Input {
  constructor(target = window) {
    this.held = new Set();
    this.fireQueued = false;

    target.addEventListener('keydown', (event) => {
      if (!TRACKED.has(event.code)) return;
      event.preventDefault();
      if (event.code === 'Space') {
        if (!event.repeat) this.fireQueued = true;
      } else {
        this.held.add(event.code);
      }
    });

    target.addEventListener('keyup', (event) => {
      if (!TRACKED.has(event.code)) return;
      event.preventDefault();
      this.held.delete(event.code);
    });

    target.addEventListener('blur', () => {
      this.held.clear();
      this.fireQueued = false;
    });
  }

  consumeFire() {
    const queued = this.fireQueued;
    this.fireQueued = false;
    return queued;
  }
}
