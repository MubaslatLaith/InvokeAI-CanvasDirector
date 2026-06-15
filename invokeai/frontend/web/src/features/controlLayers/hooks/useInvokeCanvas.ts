import { useStore } from '@nanostores/react';
import { logger } from 'app/logging/logger';
import { useAppSelector, useAppStore } from 'app/store/storeHooks';
import { useAssertSingleton } from 'common/hooks/useAssertSingleton';
import { createInvokeBridge } from 'features/bridge/createInvokeBridge';
import { installInvokeBridge } from 'features/bridge/installInvokeBridge';
import { useStagingAreaContext } from 'features/controlLayers/components/StagingArea/context';
import { CanvasManager } from 'features/controlLayers/konva/CanvasManager';
import { $canvasManager } from 'features/controlLayers/store/ephemeral';
import { selectAutoAddBoardId } from 'features/gallery/store/gallerySelectors';
import { useInvoke } from 'features/queue/hooks/useInvoke';
import Konva from 'konva';
import { useEffect, useLayoutEffect, useState } from 'react';
import { copyImage } from 'services/api/endpoints/images';
import { $socket } from 'services/events/stores';
import { useDevicePixelRatio } from 'use-device-pixel-ratio';

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

  //add hooks
  const queue = useInvoke();
  const stagingArea = useStagingAreaContext();
  const autoAddBoardId = useAppSelector(selectAutoAddBoardId);

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
    installInvokeBridge(createInvokeBridge(manager, store));

    return () => {
      manager.destroy();
      $canvasManager.set(null);
    };
  }, [container, socket, store]);

  useEffect(() => {
    const bridge = window.__invokeBridge;

    if (!bridge) {
      return;
    }

    bridge.queue.invoke = queue.enqueueBack;
    bridge.queue.isLoading = () => queue.isLoading;
    bridge.queue.isDisabled = () => queue.isDisabled;

    bridge.stagingArea.discardAll = () => stagingArea.discardAll();
    bridge.stagingArea.canAcceptSelected = () => stagingArea.$acceptSelectedIsEnabled.get();
    bridge.stagingArea.getSelected = () => stagingArea.$selectedItem.get();
    bridge.stagingArea.acceptSelected = stagingArea.acceptSelected;
    bridge.stagingArea.saveSelectedToGallery = async (boardId?: string) => {
      const imageDTO = stagingArea.$selectedItemImageDTO.get();
      if (!imageDTO) {
        return;
      }

      await copyImage(imageDTO.image_name, {
        image_category: 'general',
        is_intermediate: false,
        board_id: boardId ?? (autoAddBoardId === 'none' ? undefined : autoAddBoardId),
        silent: true,
      });
    };
  }, [autoAddBoardId, stagingArea, queue.enqueueBack, queue.isLoading, queue.isDisabled]);
  return containerRef;
};
