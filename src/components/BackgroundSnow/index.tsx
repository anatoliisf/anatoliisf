'use client';

import React, { useEffect, useRef } from 'react';

import styles from './index.module.scss';

type Snowflake = {
	x: number;
	y: number;
	radius: number;
	speedY: number;
	speedX: number;
	opacity: number;
};

const FLAKE_COUNT = 140;

const BackgroundSnow = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const animationRef = useRef<number | null>(null);
	const flakesRef = useRef<Snowflake[]>([]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const setSize = () => {
			const { innerWidth, innerHeight } = window;
			canvas.width = innerWidth;
			canvas.height = innerHeight;
		};

		setSize();
		window.addEventListener('resize', setSize);

		const randomFlake = (): Snowflake => {
			const radius = 1.2 + Math.random() * 2.3;
			return {
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height,
				radius,
				speedY: 20 + Math.random() * 40,
				speedX: -10 + Math.random() * 20,
				opacity: 0.3 + Math.random() * 0.5,
			};
		};

		flakesRef.current = Array.from({ length: FLAKE_COUNT }, randomFlake);

		const prefersDark =
			window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

		let lastTime = performance.now();

		const tick = (time: number) => {
			const dt = (time - lastTime) / 1000;
			lastTime = time;

			const { width, height } = canvas;

			ctx.clearRect(0, 0, width, height);

			for (const flake of flakesRef.current) {
				flake.y += flake.speedY * dt;
				flake.x += flake.speedX * dt;

				if (flake.x < -20) flake.x = width + 20;
				if (flake.x > width + 20) flake.x = -20;

				if (flake.y > height + 10) {
					flake.y = -10;
					flake.x = Math.random() * width;
				}

				ctx.globalAlpha = flake.opacity;

				const inner = prefersDark
					? 'rgba(255, 255, 255, 0.9)'
					: 'rgba(210, 225, 255, 0.95)';
				const outer = prefersDark
					? 'rgba(255, 255, 255, 0)'
					: 'rgba(210, 225, 255, 0)';

				const gradient = ctx.createRadialGradient(
					flake.x,
					flake.y,
					0,
					flake.x,
					flake.y,
					flake.radius * 2,
				);
				gradient.addColorStop(0, inner);
				gradient.addColorStop(1, outer);

				ctx.fillStyle = gradient;
				ctx.beginPath();
				ctx.arc(flake.x, flake.y, flake.radius * 2, 0, Math.PI * 2);
				ctx.fill();

				if (!prefersDark) {
					ctx.strokeStyle = 'rgba(160, 180, 210, 0.4)';
					ctx.lineWidth = 0.5;
					ctx.stroke();
				}
			}

			ctx.globalAlpha = 1;
			animationRef.current = requestAnimationFrame(tick);
		};

		animationRef.current = requestAnimationFrame(tick);

		return () => {
			if (animationRef.current !== null) {
				cancelAnimationFrame(animationRef.current);
			}
			window.removeEventListener('resize', setSize);
		};
	}, []);

	return (
		<div className={styles.container} aria-hidden="true">
			<canvas ref={canvasRef} className={styles.canvas} />
		</div>
	);
};

export default BackgroundSnow;

