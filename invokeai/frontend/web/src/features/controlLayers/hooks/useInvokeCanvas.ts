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

//MOD imports
import { useAppSelector } from 'app/store/storeHooks';
import { selectLastSelectedItem } from 'features/gallery/store/gallerySelectors';
import { useImageDTO } from 'services/api/endpoints/images';
import type { CanvasEntityType } from 'features/controlLayers/store/types';
import { createNewCanvasEntityFromImage } from 'features/imageActions/actions';
//

//MOD
type CreateCanvasEntityFromImageType = CanvasEntityType | 'regional_guidance_with_reference_image';

type InvokeBridge = {
	addRasterLayer: () => void;
	addInpaintMask: () => void;
	getCanvasState: () => unknown;
	getManagerRepr: () => unknown;
	createNewCanvasEntityFromSelectedImage: (type?: CreateCanvasEntityFromImageType) => Promise<void>;
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
  //MOD
  const lastSelectedItem = useAppSelector(selectLastSelectedItem);
  const imageDTO = useImageDTO(lastSelectedItem);
  //MOD
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
      createNewCanvasEntityFromSelectedImage: async (type = 'raster_layer') => {
        if (!imageDTO) {
          console.warn('No selected image');
          return;
        }

        const { dispatch, getState } = store;

        await createNewCanvasEntityFromImage({
          imageDTO,
          type,
          withResize: false,
          dispatch,
          getState,
        });
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
