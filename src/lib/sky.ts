export type SkyPhase = 'night' | 'dawn' | 'day' | 'dusk';

export type SkyColors = {
	top: string;
	bottom: string;
};

const SKY_PALETTE: Record<SkyPhase, SkyColors> = {
	night: { top: '#0a0e27', bottom: '#1a1f3a' },
	dawn: { top: '#2d1b4e', bottom: '#ff8c69' },
	day: { top: '#4a90d9', bottom: '#87ceeb' },
	dusk: { top: '#1a1a4e', bottom: '#ff6b35' },
};

const MS_PER_MINUTE = 60_000;

export function getSkyPhase(now: Date, sunrise: Date, sunset: Date): SkyPhase {
	const t = now.getTime();
	const dawnStart = sunrise.getTime() - 45 * MS_PER_MINUTE;
	const dawnEnd = sunrise.getTime() + 15 * MS_PER_MINUTE;
	const duskStart = sunset.getTime() - 15 * MS_PER_MINUTE;
	const duskEnd = sunset.getTime() + 45 * MS_PER_MINUTE;

	if (t >= dawnStart && t < dawnEnd) return 'dawn';
	if (t >= duskStart && t < duskEnd) return 'dusk';
	if (t >= dawnEnd && t < duskStart) return 'day';
	return 'night';
}

export function getSkyColors(phase: SkyPhase): SkyColors {
	return SKY_PALETTE[phase];
}

export function interpolateSkyColors(a: SkyColors, b: SkyColors, t: number): SkyColors {
	const clamp = (v: number) => Math.min(1, Math.max(0, v));
	const mix = (c1: string, c2: string, ratio: number) => {
		const parse = (hex: string) => {
			const h = hex.replace('#', '');
			return [
				parseInt(h.slice(0, 2), 16),
				parseInt(h.slice(2, 4), 16),
				parseInt(h.slice(4, 6), 16),
			];
		};
		const [r1, g1, b1] = parse(c1);
		const [r2, g2, b2] = parse(c2);
		const r = Math.round(r1 + (r2 - r1) * ratio);
		const g = Math.round(g1 + (g2 - g1) * ratio);
		const b = Math.round(b1 + (b2 - b1) * ratio);
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	};
	const ratio = clamp(t);
	return {
		top: mix(a.top, b.top, ratio),
		bottom: mix(a.bottom, b.bottom, ratio),
	};
}

export function getSkyColorsAtTime(now: Date, sunrise: Date, sunset: Date): SkyColors {
	const phase = getSkyPhase(now, sunrise, sunset);
	const t = now.getTime();

	const transitions: { start: number; end: number; from: SkyPhase; to: SkyPhase }[] = [
		{
			start: sunrise.getTime() - 45 * MS_PER_MINUTE,
			end: sunrise.getTime() + 15 * MS_PER_MINUTE,
			from: 'night',
			to: 'day',
		},
		{
			start: sunset.getTime() - 15 * MS_PER_MINUTE,
			end: sunset.getTime() + 45 * MS_PER_MINUTE,
			from: 'day',
			to: 'night',
		},
	];

	for (const { start, end, from, to } of transitions) {
		if (t >= start && t <= end) {
			const ratio = (t - start) / (end - start);
			return interpolateSkyColors(SKY_PALETTE[from], SKY_PALETTE[to], ratio);
		}
	}

	return SKY_PALETTE[phase];
}

/** Sun/moon position as normalized x (0–1) and y (0–1, 0 = top). */
export function getCelestialPosition(
	now: Date,
	sunrise: Date,
	sunset: Date,
): { x: number; y: number; visible: 'sun' | 'moon' } {
	const t = now.getTime();
	const dayLength = sunset.getTime() - sunrise.getTime();
	const isDaytime = t >= sunrise.getTime() && t < sunset.getTime();

	if (isDaytime) {
		const progress = (t - sunrise.getTime()) / dayLength;
		const angle = Math.PI * progress;
		return {
			x: 0.15 + progress * 0.7,
			y: 0.15 + Math.sin(angle) * 0.35,
			visible: 'sun',
		};
	}

	const nightStart = sunset.getTime();
	const nightEnd = sunrise.getTime() + 24 * 60 * 60 * 1000;
	const nightLength = nightEnd - nightStart;
	const nightProgress =
		t >= nightStart
			? (t - nightStart) / nightLength
			: (t + 24 * 60 * 60 * 1000 - nightStart) / nightLength;
	const angle = Math.PI * nightProgress;

	return {
		x: 0.15 + nightProgress * 0.7,
		y: 0.12 + Math.sin(angle) * 0.3,
		visible: 'moon',
	};
}
