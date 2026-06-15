import { logger } from 'app/logging/logger';
import type { AppStore } from 'app/store/store';
import { getDefaultRefImageConfig } from 'features/controlLayers/hooks/addLayerHooks';
import type { CanvasManager } from 'features/controlLayers/konva/CanvasManager';
import { canvasReset } from 'features/controlLayers/store/actions';
import { paramsReset, positivePromptChanged, setSteps } from 'features/controlLayers/store/paramsSlice';
import { refImageAdded } from 'features/controlLayers/store/refImagesSlice';
import { imageDTOToCroppableImage } from 'features/controlLayers/store/util';
import { selectLastSelectedItem } from 'features/gallery/store/gallerySelectors';
import { createNewCanvasEntityFromImage } from 'features/imageActions/actions';
import { getImageDTOSafe } from 'services/api/endpoints/images';

import type {
  CreateCanvasEntityFromImageType,
  ImageBridge,
  InvokeBridge,
  ParamsBridge,
  QueueBridge,
  StagingAreaBridge,
} from './types';

const log = logger('canvas');

const createStagingAreaBridge = (): StagingAreaBridge => ({
  acceptSelected: () => {
    throw new Error('[bridge] staginarea bridge not installed');
  },
  canAcceptSelected: () => {
    throw new Error('[bridge] staginarea bridge not installed');
  },
  getSelected: () => {
    throw new Error('[bridge] staginarea bridge not installed');
  },
  saveSelectedToGallery: () => {
    throw new Error('[bridge] stagingArea bridge not installed');
  },
});

const createQueueBridge = (): QueueBridge => ({
  invoke: () => {
    throw new Error('[bridge] queue bridge not installed');
  },
  isLoading: () => {
    throw new Error('[bridge] queue bridge not installed');
  },
  isDisabled: () => {
    throw new Error('[bridge] queue bridge not installed');
  },
});

const createImageBridge = (manager: CanvasManager, store: AppStore): ImageBridge => ({
  createGlobalReferenceImageFromImageName: async (imageName: string) => {
    const { dispatch, getState } = store;
    const imageDTO = await getImageDTOSafe(imageName);
    if (!imageDTO) {
      log.warn(`[bridge] image '${imageName}' has no image DTO`);
      return;
    }
    const config = getDefaultRefImageConfig(getState);
    config.image = imageDTOToCroppableImage(imageDTO);
    dispatch(
      refImageAdded({
        overrides: { config },
      })
    );
  },

  resetCanvas: () => {
    store.dispatch(canvasReset());
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
      log.warn('[bridge] selected gallery item has no image DTO');
      return;
    }
    await createNewCanvasEntityFromImage({ imageDTO, type, withResize: false, dispatch, getState });
  },

  createNewCanvasEntityFromImageName: async (
    imageName: string,
    type: CreateCanvasEntityFromImageType = 'raster_layer'
  ) => {
    const { dispatch, getState } = store;
    const imageDTO = await getImageDTOSafe(imageName);
    if (!imageDTO) {
      log.warn(`[bridge] image has no image DTO: ${imageName}`);
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
  resetGenerationSettings: () => {
    store.dispatch(paramsReset());
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
  stagingArea: createStagingAreaBridge(),
});
