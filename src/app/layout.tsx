import 'normalize.css';
import '@/styles/globals.scss';

import React from 'react';

import SkyBackground from '@/components/SkyBackground';

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body>
				<SkyBackground />
				{children}
			</body>
		</html>
	)
}
