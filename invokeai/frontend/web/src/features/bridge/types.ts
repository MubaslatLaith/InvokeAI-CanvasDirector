import type { RootState } from 'app/store/store';
import type { CanvasEntityType } from 'features/controlLayers/store/types';

export type CreateCanvasEntityFromImageType = CanvasEntityType | 'regional_guidance_with_reference_image';

export type StagingAreaBridge = {
  acceptSelected: () => void;
  canAcceptSelected: () => boolean;
  getSelected: () => unknown;
  discardAll: () => void;
  saveSelectedToGallery: (boardId?: string) => Promise<void>;
};

export type QueueBridge = {
  invoke: () => void;
  isLoading: () => boolean;
  isDisabled: () => boolean;
};

export type ParamsBridge = {
  get: () => RootState['params'];
  setPositivePrompt: (prompt: string) => string;
  setSteps: (steps: number) => Promise<void>;
  resetGenerationSettings: () => void;
};

export type ImageBridge = {
  createNewCanvasEntityFromSelectedImage: (type?: CreateCanvasEntityFromImageType) => Promise<void>;
  createNewCanvasEntityFromImageName: (imageName: string, type?: CreateCanvasEntityFromImageType) => Promise<void>;
  resetCanvas: () => void;
  createGlobalReferenceImageFromImageName: (imageName: string) => Promise<void>;
  deleteAllGlobalReferenceImages: () => void;
};

export type InvokeBridge = {
  image: ImageBridge;
  params: ParamsBridge;
  queue: QueueBridge;
  stagingArea: StagingAreaBridge;
};
