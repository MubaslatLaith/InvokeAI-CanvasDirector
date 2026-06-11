import type { AppStore } from 'app/store/store';
import type { CanvasManager } from 'features/controlLayers/konva/CanvasManager';
import type { CreateCanvasEntityFromImageType, ImageBridge, InvokeBridge, ParamsBridge } from './types';

import { positivePromptChanged } from 'features/controlLayers/store/paramsSlice';
import { selectLastSelectedItem } from 'features/gallery/store/gallerySelectors';
import { getImageDTOSafe } from 'features/gallery/util/getImageDTOSafe';
import { createNewCanvasEntityFromImage } from 'features/imageActions/actions';
import { logger } from 'app/logging/logger';


const log = logger('invoke-bridge');

export const createImageBridge = (
	manager: CanvasManager,
	store: AppStore
): ImageBridge => ({
	createNewCanvasEntityFromSelectedImage: async (type: CreateCanvasEntityFromImageType = 'raster_layer') => { 
		const { dispatch, getState } = store;
		const selected = selectLastSelectedItem(getState());
		if (!selected) {
			log.warn('[bridge] no gallery selection');
			return;
		}
		const imageDTO = await getImageDTOSafe(selected);
		await createNewCanvasEntityFromImage({imageDTO, type, withResize: false, dispatch, getState,});
	},



});


export const createParamsBridge = (
	        manager: CanvasManager,
		        store: AppStore
): ParamsBridge => ({
	get: () => store.getState().params,
	setPositivePrompt: (prompt: string) => {
		store.dispatch(positivePromptChanged(prompt));
		return store.getState().params.positivePrompt; 
	}
}); 






export const createInvokeBridge = (
	manager: CanvasManager, 
	store: AppStore): InvokeBridge => ({
		image: createImageBridge(manager, store),
		params: createParamsBridge(manager, store), 
	}); 






