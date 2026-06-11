import type { AppStore } from 'app/store/store';
import type { CanvasManager } from 'features/controlLayers/konva/CanvasManager';
import { createParamsBridge } from './createParamsBridge';
import type { InvokeBridge } from './types';

export const createImageBridge = (manager, store) => ({
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

export const createParamsBridge = (manager, store) => ({
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






