'use client';

import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react';

import type { BirthplaceWeather, WeatherCondition } from '@/lib/weather';

export type PreviewTime = 'live' | 'day' | 'night' | 'dawn' | 'dusk';
export type PreviewCondition = 'live' | WeatherCondition;
export type PreviewTheme = 'live' | 'light' | 'dark';

type PreviewState = {
	condition: PreviewCondition;
	time: PreviewTime;
	theme: PreviewTheme;
};

type PreviewContextValue = PreviewState & {
	setCondition: (condition: PreviewCondition) => void;
	setTime: (time: PreviewTime) => void;
	setTheme: (theme: PreviewTheme) => void;
	reset: () => void;
	isPreviewActive: boolean;
};

const defaultState: PreviewState = {
	condition: 'live',
	time: 'live',
	theme: 'live',
};

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<PreviewState>(defaultState);

	const isPreviewActive =
		state.condition !== 'live' || state.time !== 'live' || state.theme !== 'live';

	useEffect(() => {
		if (state.theme === 'live') {
			document.documentElement.removeAttribute('data-theme');
			return;
		}
		document.documentElement.setAttribute('data-theme', state.theme);
	}, [state.theme]);

	const value = useMemo<PreviewContextValue>(
		() => ({
			...state,
			isPreviewActive,
			setCondition: (condition) => setState((s) => ({ ...s, condition })),
			setTime: (time) => setState((s) => ({ ...s, time })),
			setTheme: (theme) => setState((s) => ({ ...s, theme })),
			reset: () => setState(defaultState),
		}),
		[state, isPreviewActive],
	);

	return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function usePreview() {
	const ctx = useContext(PreviewContext);
	if (!ctx) {
		throw new Error('usePreview must be used within PreviewProvider');
	}
	return ctx;
}

export function usePreviewOptional() {
	return useContext(PreviewContext);
}

export function applyPreviewWeather(
	weather: BirthplaceWeather,
	condition: PreviewCondition,
): BirthplaceWeather {
	if (condition === 'live') return weather;
	return { ...weather, condition };
}

export function applyPreviewTime(
	now: Date,
	weather: BirthplaceWeather,
	time: PreviewTime,
): Date {
	if (time === 'live') return now;

	const { sunrise, sunset } = weather;
	const ms = 60_000;

	switch (time) {
		case 'day':
			return new Date((sunrise.getTime() + sunset.getTime()) / 2);
		case 'night':
			return new Date(sunset.getTime() + 4 * 60 * 60 * 1000);
		case 'dawn':
			return new Date(sunrise.getTime() - 30 * ms);
		case 'dusk':
			return new Date(sunset.getTime() + 20 * ms);
		default:
			return now;
	}
}
