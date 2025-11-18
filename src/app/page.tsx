import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

import Main from '../components/Main';

import type { Metadata } from 'next'

export const metadata: Metadata = {
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
    },
    title: 'Nate Kurochkin | Software Engineer | Mentor',
    assets: ['/favicon.ico'],
    description: 'Staff Software Engineer | Frontend Developer | React Developer | JavaScript Developer',
    authors: [{ name: 'Nate Kurochkin' }],
    openGraph: {
        type: 'website',
        title: 'Nate Kurochkin | Software Engineer | Mentor',
        description: 'Staff Software Engineer | Frontend Developer | React Developer | JavaScript Developer',
        url: 'https://anatolii.us',
        siteName: 'Nate Kurochkin',
        images: [{ url: '/images/og.png', width: 320, height: 320, alt: "Nate Kurochkin" }],
    },
}

const Home = () => (
    <>
        <Main />
        <Analytics />
        <SpeedInsights />
    </>
);

export default Home;
