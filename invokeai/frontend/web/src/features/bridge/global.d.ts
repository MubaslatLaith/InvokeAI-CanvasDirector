import type { InvokeBridge } from './types';

declare global {
  interface Window {
    __invokeBridge?: InvokeBridge;
  }
}

export {};
