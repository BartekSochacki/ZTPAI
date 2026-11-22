const { EventEmitter } = require("node:events");

function createEventBus({ now = () => new Date() } = {}) {
  const emitter = new EventEmitter();

  return {
    publish(eventName, payload) {
      emitter.emit(eventName, { name: eventName, occurredAt: now().toISOString(), payload });
    },
    subscribe(eventName, handler) {
      emitter.on(eventName, event => {
        Promise.resolve()
          .then(() => handler(event))
          .catch(err => console.error(`[event:${eventName}] handler failed`, err));
      });
    }
  };
}

const noopEventBus = { publish() {}, subscribe() {} };

module.exports = { createEventBus, noopEventBus };
