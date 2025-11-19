import 'normalize.css';
import '@/styles/globals.scss';

import React from 'react';

import BackgroundSnow from '@/components/BackgroundSnow';

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body>
				<BackgroundSnow />
				{children}
			</body>
		</html>
	)
}
