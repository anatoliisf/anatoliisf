'use client';

import { useEffect, useRef } from 'react';

import faceImage from '../images/face.png';
import styles from '../Main.module.scss';

type Particle = {
	x: number;
	y: number;
	originX: number;
	originY: number;
	vx: number;
	vy: number;
	color: string;
};

const GRID_SIZE = 3;
const HOLE_RADIUS = 32;
const REPULSION_STRENGTH = 3.2;

const FaceExplosion = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const particlesRef = useRef<Particle[]>([]);
	const hoverRef = useRef(false);
	const mouseRef = useRef<{ x: number; y: number } | null>(null);
	const animationRef = useRef<number | null>(null);
	const touchTimeoutRef = useRef<number | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let rect = canvas.getBoundingClientRect();
		let width = rect.width;
		let height = rect.height;

		const dpr = window.devicePixelRatio || 1;
		canvas.width = width * dpr;
		canvas.height = height * dpr;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const img = new Image();
		img.src = faceImage.src;
		img.crossOrigin = 'anonymous';

		const createParticlesFromImage = () => {
			const offscreen = document.createElement('canvas');
			offscreen.width = width;
			offscreen.height = height;
			const offCtx = offscreen.getContext('2d');
			if (!offCtx) return;

			const iw = img.width;
			const ih = img.height;
			const ir = iw / ih;
			const cr = width / height;

			let sx = 0;
			let sy = 0;
			let sw = iw;
			let sh = ih;

			if (ir > cr) {
				// image is wider than canvas
				sh = ih;
				sw = ih * cr;
				sx = (iw - sw) / 2;
				sy = 0;
			} else {
				// image is taller than canvas
				sw = iw;
				sh = iw / cr;
				sx = 0;
				sy = (ih - sh) / 2;
			}

			offCtx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

			const imageData = offCtx.getImageData(0, 0, width, height);
			const data = imageData.data;

			const particles: Particle[] = [];
			const gap = GRID_SIZE;

			for (let y = 0; y < height; y += gap) {
				for (let x = 0; x < width; x += gap) {
					const index = (y * width + x) * 4;
					const r = data[index];
					const g = data[index + 1];
					const b = data[index + 2];
					const a = data[index + 3];

					if (a < 50) continue;

					particles.push({
						x,
						y,
						originX: x,
						originY: y,
						vx: 0,
						vy: 0,
						color: `rgba(${r}, ${g}, ${b}, ${a / 255})`,
					});
				}
			}

			particlesRef.current = particles;
		};

		const render = () => {
			const particles = particlesRef.current;

			ctx.clearRect(0, 0, width, height);

			if (!particles.length) {
				animationRef.current = requestAnimationFrame(render);
				return;
			}

			const mouse = mouseRef.current;

			for (const p of particles) {
				if (hoverRef.current && mouse) {
					const dx = p.x - mouse.x;
					const dy = p.y - mouse.y;
					const dist = Math.sqrt(dx * dx + dy * dy) || 1;

					if (dist < HOLE_RADIUS) {
						const force = ((HOLE_RADIUS - dist) / HOLE_RADIUS) * REPULSION_STRENGTH;
						const nx = dx / dist;
						const ny = dy / dist;

						p.vx += nx * force;
						p.vy += ny * force;
					}
				}

				const springX = p.originX - p.x;
				const springY = p.originY - p.y;
				p.vx += springX * 0.02;
				p.vy += springY * 0.02;

				p.vx *= 0.86;
				p.vy *= 0.86;

				p.x += p.vx;
				p.y += p.vy;

				ctx.fillStyle = p.color;
				ctx.fillRect(p.x, p.y, GRID_SIZE, GRID_SIZE);
			}

			animationRef.current = requestAnimationFrame(render);
		};

		const handleResize = () => {
			rect = canvas.getBoundingClientRect();
			width = rect.width;
			height = rect.height;

			const dprResize = window.devicePixelRatio || 1;
			canvas.width = width * dprResize;
			canvas.height = height * dprResize;
			ctx.setTransform(dprResize, 0, 0, dprResize, 0, 0);

			if (img.complete) {
				createParticlesFromImage();
			}
		};

		img.onload = () => {
			createParticlesFromImage();
		};

		window.addEventListener('resize', handleResize);
		animationRef.current = requestAnimationFrame(render);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className={styles.faceCanvas}
			onMouseEnter={(event) => {
				// Desktop hover starts the effect
				hoverRef.current = true;
				const canvas = canvasRef.current;
				if (!canvas) return;
				const rect = canvas.getBoundingClientRect();
				mouseRef.current = {
					x: event.clientX - rect.left,
					y: event.clientY - rect.top,
				};
			}}
			onMouseMove={(event) => {
				// Keep effect running while hovered, updating position
				hoverRef.current = true;
				const canvas = canvasRef.current;
				if (!canvas) return;
				const rect = canvas.getBoundingClientRect();
				mouseRef.current = {
					x: event.clientX - rect.left,
					y: event.clientY - rect.top,
				};
			}}
			onMouseLeave={() => {
				// Stop effect on hover-out
				hoverRef.current = false;
				mouseRef.current = null;
			}}
			onTouchStart={(event) => {
				const canvas = canvasRef.current;
				if (!canvas) return;
				const touch = event.touches[0];
				if (!touch) return;
				const rect = canvas.getBoundingClientRect();

				hoverRef.current = true;
				mouseRef.current = {
					x: touch.clientX - rect.left,
					y: touch.clientY - rect.top,
				};

				// For tap-like interaction on mobile, automatically relax back shortly after.
				if (touchTimeoutRef.current !== null) {
					window.clearTimeout(touchTimeoutRef.current);
				}
				touchTimeoutRef.current = window.setTimeout(() => {
					hoverRef.current = false;
					mouseRef.current = null;
					touchTimeoutRef.current = null;
				}, 220);
			}}
			onTouchEnd={() => {
				if (touchTimeoutRef.current === null) {
					hoverRef.current = false;
					mouseRef.current = null;
				}
			}}
			onTouchCancel={() => {
				if (touchTimeoutRef.current !== null) {
					window.clearTimeout(touchTimeoutRef.current);
					touchTimeoutRef.current = null;
				}
				hoverRef.current = false;
				mouseRef.current = null;
			}}
		/>
	);
};

export default FaceExplosion;


