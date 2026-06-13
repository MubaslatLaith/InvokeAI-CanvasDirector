import { logger } from 'app/logging/logger';
import type { AppStore } from 'app/store/store';
import type { CanvasManager } from 'features/controlLayers/konva/CanvasManager';
import { positivePromptChanged, setSteps } from 'features/controlLayers/store/paramsSlice';
import { selectLastSelectedItem } from 'features/gallery/store/gallerySelectors';
import { createNewCanvasEntityFromImage } from 'features/imageActions/actions';
import { getImageDTOSafe } from 'services/api/endpoints/images';

import type { CreateCanvasEntityFromImageType, ImageBridge, InvokeBridge, ParamsBridge, QueueBridge } from './types';

const log = logger('canvas');

const createQueueBridge = (): QueueBridge => ({
  invoke: () => {
    throw new Error('[bridge] queue bridge not installed');
  },
});

const createImageBridge = (manager: CanvasManager, store: AppStore): ImageBridge => ({
  createNewCanvasEntityFromSelectedImage: async (type: CreateCanvasEntityFromImageType = 'raster_layer') => {
    const { dispatch, getState } = store;
    const selected = selectLastSelectedItem(getState());
    if (!selected) {
      log.warn('[bridge] no gallery selection');
      return;
    }
    const imageDTO = await getImageDTOSafe(selected);

    if (!imageDTO) {
      log.warn('[bridge] selected gallery item has no image DTO');
      return;
    }

    await createNewCanvasEntityFromImage({ imageDTO, type, withResize: false, dispatch, getState });
  },
});

const createParamsBridge = (manager: CanvasManager, store: AppStore): ParamsBridge => ({
  get: () => store.getState().params,
  setPositivePrompt: (prompt: string) => {
    store.dispatch(positivePromptChanged(prompt));
    return store.getState().params.positivePrompt;
  },
  setSteps: async (steps: number) => {
    await store.dispatch(setSteps(steps));
  },
});

export const createInvokeBridge = (
  manager: CanvasManager,
  store: AppStore
  //queue: ReturnType<typeof useInvoke>
): InvokeBridge => ({
  image: createImageBridge(manager, store),
  params: createParamsBridge(manager, store),
  queue: createQueueBridge(),
});
