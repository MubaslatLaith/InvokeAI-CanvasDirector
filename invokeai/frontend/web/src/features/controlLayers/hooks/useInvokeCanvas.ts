import { useStore } from '@nanostores/react';
import { logger } from 'app/logging/logger';
import { useAppStore } from 'app/store/storeHooks';
import { useAssertSingleton } from 'common/hooks/useAssertSingleton';
import { CanvasManager } from 'features/controlLayers/konva/CanvasManager';
import { $canvasManager } from 'features/controlLayers/store/ephemeral';
import Konva from 'konva';
import { useLayoutEffect, useState } from 'react';
import { $socket } from 'services/events/stores';
import { useDevicePixelRatio } from 'use-device-pixel-ratio';
//MOD
type InvokeBridge = {
  addRasterLayer: () => void;
  addInpaintMask: () => void;
  getCanvasState: () => unknown;
  getManagerRepr: () => unknown;
};

declare global {
  interface Window {
    __invokeBridge?: InvokeBridge;
  }
}
//

const log = logger('canvas');

// This will log warnings when layers > 5
Konva.showWarnings = import.meta.env.MODE === 'development';

const useKonvaPixelRatioWatcher = () => {
  useAssertSingleton('useKonvaPixelRatioWatcher');

  const dpr = useDevicePixelRatio({ round: false });

  useLayoutEffect(() => {
    Konva.pixelRatio = dpr;
  }, [dpr]);
};

export const useInvokeCanvas = (): ((el: HTMLDivElement | null) => void) => {
  useAssertSingleton('useInvokeCanvas');
  useKonvaPixelRatioWatcher();
  const store = useAppStore();
  const socket = useStore($socket);
  const [container, containerRef] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    log.debug('Initializing renderer');
    if (!container) {
      // Nothing to clean up
      log.debug('No stage container, skipping initialization');
      return () => {};
    }

    if (!socket) {
      log.debug('Socket not connected, skipping initialization');
      return () => {};
    }

    const currentManager = $canvasManager.get();
    if (currentManager) {
      currentManager.stage.setContainer(container);
      return;
    }

    const manager = new CanvasManager(container, store, socket);
    manager.initialize();

    //MOD
    window.__invokeBridge = {
      addRasterLayer: () => manager.stateApi.addRasterLayer({ isSelected: true }),
      addInpaintMask: () => manager.stateApi.addInpaintMask({ isSelected: true }),
      getCanvasState: () => manager.stateApi.getCanvasState(),
      getManagerRepr: () => manager.repr(),
    };
    //

    return () => {
      manager.destroy();
      //mod
      delete window.__invokeBridge;
      //
      $canvasManager.set(null);
    };
  }, [container, socket, store]);

  return containerRef;
};
