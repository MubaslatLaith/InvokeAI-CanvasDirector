import type { InvokeBridge } from './types';

export const installInvokeBridge = (bridge: InvokeBridge) => {
	window.__invokeBridge = bridge;
};

export const uninstallInvokeBridge = () => {
	delete window.__invokeBridge;
};
