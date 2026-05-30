import 'normalize.css';
import '@/styles/globals.scss';

import React from 'react';

import SkyBackground from '@/components/SkyBackground';
import { AppProviders } from '@/components/AppProviders';

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body>
				<AppProviders>
					<SkyBackground />
					{children}
				</AppProviders>
			</body>
		</html>
	)
}
