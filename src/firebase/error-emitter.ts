import { EventEmitter } from 'events';
import type { FirestorePermissionError } from './errors';

type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// This is a simple event emitter that is used to communicate between different parts of the application.
// It is used to emit and listen for custom events, such as permission errors.
// This is a global event emitter that is used to communicate between different parts of the application.
class AppEventEmitter extends EventEmitter {
  emit<E extends keyof AppEvents>(event: E, ...args: Parameters<AppEvents[E]>) {
    return super.emit(event, ...args);
  }
  on<E extends keyof AppEvents>(event: E, listener: AppEvents[E]) {
    return super.on(event, listener);
  }
  off<E extends keyof AppEvents>(event: E, listener: AppEvents[E]) {
    return super.off(event, listener);
  }
}

export const errorEmitter = new AppEventEmitter();
