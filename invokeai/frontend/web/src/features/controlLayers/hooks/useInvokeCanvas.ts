import { useStore } from '@nanostores/react';
import { logger } from 'app/logging/logger';
import type { RootState } from 'app/store/store';
import { useAppStore } from 'app/store/storeHooks';
import { useAssertSingleton } from 'common/hooks/useAssertSingleton';
import { CanvasManager } from 'features/controlLayers/konva/CanvasManager';
import { $canvasManager } from 'features/controlLayers/store/ephemeral';
import { positivePromptChanged } from 'features/controlLayers/store/paramsSlice';
import type { CanvasEntityType } from 'features/controlLayers/store/types';
//MOD imports
import { selectLastSelectedItem } from 'features/gallery/store/gallerySelectors';
import { createNewCanvasEntityFromImage } from 'features/imageActions/actions';
import Konva from 'konva';
import { useLayoutEffect, useState } from 'react';
import { getImageDTOSafe } from 'services/api/endpoints/images';
import { $socket } from 'services/events/stores';
import { useDevicePixelRatio } from 'use-device-pixel-ratio';
//

//MOD

type CreateCanvasEntityFromImageType = CanvasEntityType | 'regional_guidance_with_reference_image';

type ParamsBridge = {
  get: () => RootState['params'];
  setPositivePrompt: (prompt: string) => string;
  //setNegativePrompt: (prompt: string | null) => string | null;
  //setSteps: (steps: number) => number;
  //setSeed: (seed: number) => number;
};

type InvokeBridge = {
  addRasterLayer: () => void;
  addInpaintMask: () => void;
  getCanvasState: () => unknown;
  getManagerRepr: () => unknown;
  getManagerId: () => string;
  createNewCanvasEntityFromSelectedImage: (type?: CreateCanvasEntityFromImageType) => Promise<void>;
  params: ParamsBridge;
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
    //log.debug('Initializing renderer');
    if (!container) {
      // Nothing to clean up
      //log.debug('No stage container, skipping initialization');
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
    //
    window.__invokeBridge = {
      addRasterLayer: () => manager.stateApi.addRasterLayer({ isSelected: true }),
      addInpaintMask: () => manager.stateApi.addInpaintMask({ isSelected: true }),
      getCanvasState: () => manager.stateApi.getCanvasState(),
      getManagerRepr: () => manager.repr(),
      getManagerId: () => {
        log.warn(`BRIDGE MANAGER ID ${manager.id}`);
        return manager.id;
      },
      createNewCanvasEntityFromSelectedImage: async (type: CreateCanvasEntityFromImageType = 'raster_layer') => {
        const { dispatch, getState } = store;
        const selected = selectLastSelectedItem(getState());
        if (!selected) {
          log.warn('[bridge] no gallery selection');
          return;
        }
        const imageDTO = await getImageDTOSafe(selected);
        if (!imageDTO) {
          return;
        }
        await createNewCanvasEntityFromImage({
          imageDTO,
          type,
          withResize: false,
          dispatch,
          getState,
        });
      },

      params: {
        get: () => store.getState().params,

        setPositivePrompt: (prompt: string) => {
          store.dispatch(positivePromptChanged(prompt));
          return store.getState().params.positivePrompt;
        },
      },
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
