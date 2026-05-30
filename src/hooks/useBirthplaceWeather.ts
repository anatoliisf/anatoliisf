'use client';

import { useEffect, useState } from 'react';

import { birthplace } from '@/config/birthplace';
import { type BirthplaceWeather, parseBirthplaceWeather } from '@/lib/weather';

const REFRESH_MS = 15 * 60 * 1000;

function defaultSunTimes(): { sunrise: Date; sunset: Date } {
	const now = new Date();
	const dateStr = new Intl.DateTimeFormat('en-CA', {
		timeZone: birthplace.timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(now);

	return {
		sunrise: new Date(`${dateStr}T06:00:00+05:00`),
		sunset: new Date(`${dateStr}T20:00:00+05:00`),
	};
}

export function useBirthplaceWeather(): BirthplaceWeather | null {
	const [weather, setWeather] = useState<BirthplaceWeather | null>(null);

	useEffect(() => {
		let cancelled = false;

		const fetchWeather = async () => {
			try {
				const params = new URLSearchParams({
					latitude: String(birthplace.latitude),
					longitude: String(birthplace.longitude),
					timezone: birthplace.timezone,
					forecast_days: '1',
					current: 'weather_code,is_day,temperature_2m',
					daily: 'sunrise,sunset',
				});

				const res = await fetch(
					`https://api.open-meteo.com/v1/forecast?${params.toString()}`,
				);
				if (!res.ok) return;

				const data = await res.json();
				if (cancelled) return;

				setWeather(parseBirthplaceWeather(data));
			} catch {
				// Fall back to time-based defaults on network failure
			}
		};

		fetchWeather();
		const interval = setInterval(fetchWeather, REFRESH_MS);

		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, []);

	return weather;
}

export function useBirthplaceTime(): Date {
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		const tick = () => setNow(new Date());
		const interval = setInterval(tick, 60_000);
		return () => clearInterval(interval);
	}, []);

	return now;
}

export function getFallbackWeather(): BirthplaceWeather {
	const { sunrise, sunset } = defaultSunTimes();
	const hour = Number(
		new Intl.DateTimeFormat('en-US', {
			timeZone: birthplace.timezone,
			hour: 'numeric',
			hour12: false,
		}).format(new Date()),
	);
	const isDay = hour >= 6 && hour < 20;

	return {
		isDay,
		condition: 'clear',
		temperature: 0,
		sunrise,
		sunset,
	};
}
