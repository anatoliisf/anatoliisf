'use client';

import DevPreviewSwitcher from '@/components/DevPreviewSwitcher';
import { PreviewProvider } from '@/context/PreviewContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
	return (
		<PreviewProvider>
			{children}
			<DevPreviewSwitcher />
		</PreviewProvider>
	);
}
