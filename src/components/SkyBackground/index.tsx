'use client';

import React, { useEffect, useRef } from 'react';

import {
	applyPreviewTime,
	applyPreviewWeather,
	usePreview,
} from '@/context/PreviewContext';
import {
	getFallbackWeather,
	useBirthplaceTime,
	useBirthplaceWeather,
} from '@/hooks/useBirthplaceWeather';
import { getCelestialPosition, getSkyColorsAtTime, getSkyPhase } from '@/lib/sky';
import type { WeatherCondition } from '@/lib/weather';

import styles from './index.module.scss';

type CloudPuff = { x: number; y: number; r: number };

type Cloud = {
	x: number;
	y: number;
	puffs: CloudPuff[];
	width: number;
	speed: number;
	opacity: number;
	depth: number;
};

type Snowflake = {
	x: number;
	y: number;
	radius: number;
	speedY: number;
	speedX: number;
	opacity: number;
	wobble: number;
	wobbleSpeed: number;
};

type Raindrop = {
	x: number;
	y: number;
	length: number;
	speedY: number;
	opacity: number;
	width: number;
};

type Star = {
	x: number;
	y: number;
	radius: number;
	opacity: number;
	twinkleSpeed: number;
	twinkleOffset: number;
	bright: boolean;
};

const SNOW_COUNT = 160;
const RAIN_COUNT = 220;
const CLOUD_COUNT = 8;
const STAR_COUNT = 120;

function createCloudPuffs(baseWidth: number): CloudPuff[] {
	const puffs: CloudPuff[] = [];
	const count = 7 + Math.floor(Math.random() * 5);
	let cx = 0;

	for (let i = 0; i < count; i++) {
		const r = baseWidth * (0.12 + Math.random() * 0.18);
		puffs.push({
			x: cx,
			y: -r * (0.15 + Math.random() * 0.55),
			r,
		});
		cx += r * (0.55 + Math.random() * 0.35);
	}

	return puffs;
}

function initClouds(width: number, height: number): Cloud[] {
	return Array.from({ length: CLOUD_COUNT }, (_, i) => {
		const baseWidth = 140 + Math.random() * 200;
		const puffs = createCloudPuffs(baseWidth);
		const cloudWidth = puffs.reduce((max, p) => Math.max(max, p.x + p.r * 2), 0);

		return {
			x: Math.random() * width,
			y: height * (0.04 + (i / CLOUD_COUNT) * 0.28 + Math.random() * 0.08),
			puffs,
			width: cloudWidth,
			speed: 4 + Math.random() * 12 + i * 1.5,
			opacity: 0.45 + Math.random() * 0.35,
			depth: i / CLOUD_COUNT,
		};
	});
}

function initSnowflakes(width: number, height: number): Snowflake[] {
	return Array.from({ length: SNOW_COUNT }, () => ({
		x: Math.random() * width,
		y: Math.random() * height,
		radius: 0.8 + Math.random() * 2.8,
		speedY: 18 + Math.random() * 35,
		speedX: -8 + Math.random() * 16,
		opacity: 0.35 + Math.random() * 0.55,
		wobble: Math.random() * Math.PI * 2,
		wobbleSpeed: 1 + Math.random() * 2,
	}));
}

function initRaindrops(width: number, height: number): Raindrop[] {
	return Array.from({ length: RAIN_COUNT }, () => ({
		x: Math.random() * width,
		y: Math.random() * height,
		length: 10 + Math.random() * 18,
		speedY: 350 + Math.random() * 450,
		opacity: 0.15 + Math.random() * 0.45,
		width: 0.8 + Math.random() * 1.2,
	}));
}

function initStars(width: number, height: number): Star[] {
	return Array.from({ length: STAR_COUNT }, () => ({
		x: Math.random() * width,
		y: Math.random() * height * 0.65,
		radius: 0.4 + Math.random() * 1.8,
		opacity: 0.25 + Math.random() * 0.75,
		twinkleSpeed: 0.5 + Math.random() * 3,
		twinkleOffset: Math.random() * Math.PI * 2,
		bright: Math.random() < 0.15,
	}));
}

function drawSkyGradient(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	top: string,
	bottom: string,
) {
	const gradient = ctx.createLinearGradient(0, 0, 0, height);
	gradient.addColorStop(0, top);
	gradient.addColorStop(0.6, bottom);
	gradient.addColorStop(1, bottom);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);
}

function drawSun(ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number) {
	const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
	outerGlow.addColorStop(0, 'rgba(255, 230, 120, 0.35)');
	outerGlow.addColorStop(0.5, 'rgba(255, 190, 60, 0.12)');
	outerGlow.addColorStop(1, 'rgba(255, 160, 0, 0)');
	ctx.fillStyle = outerGlow;
	ctx.beginPath();
	ctx.arc(cx, cy, 120, 0, Math.PI * 2);
	ctx.fill();

	const midGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 55);
	midGlow.addColorStop(0, 'rgba(255, 245, 180, 0.95)');
	midGlow.addColorStop(0.5, 'rgba(255, 210, 80, 0.5)');
	midGlow.addColorStop(1, 'rgba(255, 180, 0, 0)');
	ctx.fillStyle = midGlow;
	ctx.beginPath();
	ctx.arc(cx, cy, 55, 0, Math.PI * 2);
	ctx.fill();

	ctx.save();
	ctx.translate(cx, cy);
	ctx.rotate(time * 0.00005);
	ctx.strokeStyle = 'rgba(255, 220, 100, 0.08)';
	ctx.lineWidth = 2;
	for (let i = 0; i < 12; i++) {
		ctx.beginPath();
		ctx.moveTo(0, 28);
		ctx.lineTo(0, 48);
		ctx.stroke();
		ctx.rotate(Math.PI / 6);
	}
	ctx.restore();

	const disc = ctx.createRadialGradient(cx, cy - 3, 0, cx, cy, 24);
	disc.addColorStop(0, '#fff8dc');
	disc.addColorStop(0.7, '#ffe066');
	disc.addColorStop(1, '#ffb830');
	ctx.fillStyle = disc;
	ctx.beginPath();
	ctx.arc(cx, cy, 24, 0, Math.PI * 2);
	ctx.fill();
}

function drawMoon(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
	const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70);
	glow.addColorStop(0, 'rgba(210, 220, 255, 0.25)');
	glow.addColorStop(0.6, 'rgba(180, 195, 255, 0.08)');
	glow.addColorStop(1, 'rgba(160, 180, 255, 0)');
	ctx.fillStyle = glow;
	ctx.beginPath();
	ctx.arc(cx, cy, 70, 0, Math.PI * 2);
	ctx.fill();

	ctx.save();
	ctx.beginPath();
	ctx.arc(cx, cy, 20, 0, Math.PI * 2);
	ctx.fillStyle = '#e8ecf4';
	ctx.fill();

	ctx.globalCompositeOperation = 'destination-out';
	ctx.beginPath();
	ctx.arc(cx + 9, cy - 3, 17, 0, Math.PI * 2);
	ctx.fill();
	ctx.globalCompositeOperation = 'source-over';

	ctx.fillStyle = 'rgba(180, 190, 210, 0.25)';
	ctx.beginPath();
	ctx.arc(cx - 5, cy + 4, 3, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(cx + 2, cy - 6, 2, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(cx - 2, cy - 2, 1.5, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}

function drawStars(
	ctx: CanvasRenderingContext2D,
	stars: Star[],
	time: number,
	phase: string,
) {
	const starVisibility =
		phase === 'night' ? 1 : phase === 'dawn' || phase === 'dusk' ? 0.55 : 0;
	if (starVisibility <= 0) return;

	for (const star of stars) {
		const twinkle =
			0.55 + 0.45 * Math.sin(time * 0.001 * star.twinkleSpeed + star.twinkleOffset);
		const alpha = star.opacity * twinkle * starVisibility;
		ctx.globalAlpha = alpha;
		ctx.fillStyle = star.bright ? '#fffef0' : '#ffffff';
		ctx.beginPath();
		ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
		ctx.fill();

		if (star.bright) {
			ctx.globalAlpha = alpha * 0.4;
			ctx.beginPath();
			ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
			ctx.fill();
		}
	}
	ctx.globalAlpha = 1;
}

function drawRealisticCloud(
	ctx: CanvasRenderingContext2D,
	cloud: Cloud,
	isNight: boolean,
) {
	const { x, y, puffs, opacity } = cloud;
	const sorted = [...puffs].sort((a, b) => a.y - b.y);

	const shadowAlpha = isNight ? 0.15 : 0.22;
	const highlightBase = isNight ? 180 : 255;
	const shadowBase = isNight ? 60 : 190;

	ctx.globalAlpha = opacity * shadowAlpha;
	for (const puff of sorted) {
		const sx = x + puff.x;
		const sy = y + puff.y + puff.r * 0.35;
		const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, puff.r * 1.1);
		grad.addColorStop(0, `rgba(${shadowBase - 30}, ${shadowBase - 20}, ${shadowBase - 10}, 0.6)`);
		grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
		ctx.fillStyle = grad;
		ctx.beginPath();
		ctx.arc(sx, sy, puff.r * 1.1, 0, Math.PI * 2);
		ctx.fill();
	}

	for (const puff of sorted) {
		const px = x + puff.x;
		const py = y + puff.y;
		const grad = ctx.createRadialGradient(
			px - puff.r * 0.15,
			py - puff.r * 0.25,
			puff.r * 0.1,
			px,
			py,
			puff.r,
		);
		const edge = highlightBase - 15;
		grad.addColorStop(0, `rgba(${highlightBase}, ${highlightBase}, ${highlightBase}, 0.95)`);
		grad.addColorStop(0.55, `rgba(${edge}, ${edge}, ${edge + 5}, 0.75)`);
		grad.addColorStop(1, `rgba(${shadowBase}, ${shadowBase + 5}, ${shadowBase + 15}, 0)`);

		ctx.globalAlpha = opacity;
		ctx.fillStyle = grad;
		ctx.beginPath();
		ctx.arc(px, py, puff.r, 0, Math.PI * 2);
		ctx.fill();
	}

	ctx.globalAlpha = 1;
}

function drawFog(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
	const wave = Math.sin(time * 0.0003) * 0.02;
	const gradient = ctx.createLinearGradient(0, height * (0.25 + wave), 0, height);
	gradient.addColorStop(0, 'rgba(210, 220, 230, 0)');
	gradient.addColorStop(0.4, 'rgba(210, 220, 230, 0.08)');
	gradient.addColorStop(0.7, 'rgba(200, 215, 225, 0.22)');
	gradient.addColorStop(1, 'rgba(190, 205, 220, 0.4)');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);
}

function drawSnowflake(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	radius: number,
	opacity: number,
) {
	ctx.globalAlpha = opacity;
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
	ctx.lineWidth = 0.6;
	ctx.beginPath();
	for (let i = 0; i < 6; i++) {
		const angle = (Math.PI / 3) * i;
		ctx.moveTo(x, y);
		ctx.lineTo(x + Math.cos(angle) * radius * 2, y + Math.sin(angle) * radius * 2);
	}
	ctx.stroke();

	const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
	glow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
	glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
	ctx.fillStyle = glow;
	ctx.beginPath();
	ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
	ctx.fill();
	ctx.globalAlpha = 1;
}

function cloudIntensity(condition: WeatherCondition): number {
	switch (condition) {
		case 'fog': return 0.35;
		case 'rain': return 0.7;
		case 'snow': return 0.65;
		case 'thunderstorm': return 0.85;
		case 'cloudy': return 1;
		case 'clear': return 0.25;
		default: return 0.5;
	}
}

const SkyBackground = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const animationRef = useRef<number | null>(null);
	const snowRef = useRef<Snowflake[]>([]);
	const rainRef = useRef<Raindrop[]>([]);
	const cloudsRef = useRef<Cloud[]>([]);
	const starsRef = useRef<Star[]>([]);
	const flashRef = useRef(0);

	const weatherData = useBirthplaceWeather();
	const now = useBirthplaceTime();
	const { condition: previewCondition, time: previewTime } = usePreview();

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const setSize = () => {
			const { innerWidth, innerHeight } = window;
			canvas.width = innerWidth;
			canvas.height = innerHeight;
			snowRef.current = initSnowflakes(innerWidth, innerHeight);
			rainRef.current = initRaindrops(innerWidth, innerHeight);
			cloudsRef.current = initClouds(innerWidth, innerHeight);
			starsRef.current = initStars(innerWidth, innerHeight);
		};

		setSize();
		window.addEventListener('resize', setSize);

		let lastTime = performance.now();

		const tick = (time: number) => {
			const dt = (time - lastTime) / 1000;
			lastTime = time;

			const { width, height } = canvas;
			const baseWeather = weatherData ?? getFallbackWeather();
			const weather = applyPreviewWeather(baseWeather, previewCondition);
			const previewNow = applyPreviewTime(now, weather, previewTime);
			const { sunrise, sunset, condition } = weather;

			const skyColors = getSkyColorsAtTime(previewNow, sunrise, sunset);
			const phase = getSkyPhase(previewNow, sunrise, sunset);
			const celestial = getCelestialPosition(previewNow, sunrise, sunset);
			const isNight = phase === 'night' || phase === 'dusk';

			ctx.clearRect(0, 0, width, height);
			drawSkyGradient(ctx, width, height, skyColors.top, skyColors.bottom);

			drawStars(ctx, starsRef.current, time, phase);

			const cx = celestial.x * width;
			const cy = celestial.y * height;

			if (celestial.visible === 'sun') {
				drawSun(ctx, cx, cy, time);
			} else {
				drawMoon(ctx, cx, cy);
			}

			const intensity = cloudIntensity(condition);
			const sortedClouds = [...cloudsRef.current].sort((a, b) => a.depth - b.depth);

			for (const cloud of sortedClouds) {
					cloud.x += cloud.speed * dt * (0.5 + cloud.depth * 0.8);
					if (cloud.x > width + cloud.width) {
						cloud.x = -cloud.width;
					}

					const renderCloud = { ...cloud, opacity: cloud.opacity * intensity };
					drawRealisticCloud(ctx, renderCloud, isNight);
			}

			if (condition === 'snow') {
				for (const flake of snowRef.current) {
					flake.wobble += flake.wobbleSpeed * dt;
					flake.y += flake.speedY * dt;
					flake.x += (flake.speedX + Math.sin(flake.wobble) * 12) * dt;

					if (flake.x < -20) flake.x = width + 20;
					if (flake.x > width + 20) flake.x = -20;
					if (flake.y > height + 10) {
						flake.y = -10;
						flake.x = Math.random() * width;
					}

					if (flake.radius > 2) {
						drawSnowflake(ctx, flake.x, flake.y, flake.radius, flake.opacity);
					} else {
						ctx.globalAlpha = flake.opacity;
						const gradient = ctx.createRadialGradient(
							flake.x, flake.y, 0,
							flake.x, flake.y, flake.radius * 2.5,
						);
						gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
						gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
						ctx.fillStyle = gradient;
						ctx.beginPath();
						ctx.arc(flake.x, flake.y, flake.radius * 2.5, 0, Math.PI * 2);
						ctx.fill();
						ctx.globalAlpha = 1;
					}
				}
			}

			if (condition === 'rain' || condition === 'thunderstorm') {
				for (const drop of rainRef.current) {
					drop.y += drop.speedY * dt;
					drop.x -= 18 * dt;
					if (drop.y > height + drop.length) {
						drop.y = -drop.length;
						drop.x = Math.random() * width;
					}

					const x2 = drop.x - drop.length * 0.12;
					const y2 = drop.y + drop.length;

					const grad = ctx.createLinearGradient(drop.x, drop.y, x2, y2);
					grad.addColorStop(0, `rgba(200, 220, 245, ${drop.opacity * 0.3})`);
					grad.addColorStop(0.5, `rgba(170, 200, 235, ${drop.opacity * 0.7})`);
					grad.addColorStop(1, `rgba(140, 175, 220, ${drop.opacity})`);

					ctx.strokeStyle = grad;
					ctx.lineWidth = drop.width;
					ctx.lineCap = 'round';
					ctx.beginPath();
					ctx.moveTo(drop.x, drop.y);
					ctx.lineTo(x2, y2);
					ctx.stroke();
				}

				if (condition === 'thunderstorm') {
					if (Math.random() < 0.0015) {
						flashRef.current = 0.35 + Math.random() * 0.25;
					}
					if (flashRef.current > 0) {
						ctx.fillStyle = `rgba(240, 245, 255, ${flashRef.current * 0.35})`;
						ctx.fillRect(0, 0, width, height);
						flashRef.current -= dt * 1.2;
					}
				}
			}

			if (condition === 'fog') {
				drawFog(ctx, width, height, time);
			}

			animationRef.current = requestAnimationFrame(tick);
		};

		animationRef.current = requestAnimationFrame(tick);

		return () => {
			if (animationRef.current !== null) {
				cancelAnimationFrame(animationRef.current);
			}
			window.removeEventListener('resize', setSize);
		};
	}, [weatherData, now, previewCondition, previewTime]);

	return (
		<div className={styles.container} aria-hidden="true">
			<canvas ref={canvasRef} className={styles.canvas} />
			<div className={styles.overlay} />
		</div>
	);
};

export default SkyBackground;
