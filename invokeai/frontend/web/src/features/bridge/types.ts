import type { RootState } from 'app/store/store';
import type { CanvasEntityType } from 'features/controlLayers/store/types';

export type CreateCanvasEntityFromImageType = CanvasEntityType | 'regional_guidance_with_reference_image';

export type ParamsBridge = {
  get: () => RootState['params'];
  setPositivePrompt: (prompt: string) => string;
  setSteps: (steps: number) => Promise<void>;
};

export type ImageBridge = {
  createNewCanvasEntityFromSelectedImage: (type?: CreateCanvasEntityFromImageType) => Promise<void>;
};

export type InvokeBridge = {
  image: ImageBridge;
  params: ParamsBridge;
};
