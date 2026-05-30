'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import {
	type PreviewCondition,
	type PreviewTheme,
	type PreviewTime,
	usePreview,
} from '@/context/PreviewContext';

import styles from './index.module.scss';

type Option<T extends string> = { value: T; label: string; hint?: string };

const WEATHER_OPTIONS: Option<PreviewCondition>[] = [
	{ value: 'live', label: 'Live' },
	{ value: 'clear', label: 'Clear' },
	{ value: 'cloudy', label: 'Cloudy' },
	{ value: 'rain', label: 'Rain' },
	{ value: 'snow', label: 'Snow' },
	{ value: 'fog', label: 'Fog' },
	{ value: 'thunderstorm', label: 'Storm' },
];

const TIME_OPTIONS: Option<PreviewTime>[] = [
	{ value: 'live', label: 'Live' },
	{ value: 'day', label: 'Day' },
	{ value: 'night', label: 'Night' },
	{ value: 'dawn', label: 'Dawn' },
	{ value: 'dusk', label: 'Dusk' },
];

const THEME_OPTIONS: Option<PreviewTheme>[] = [
	{ value: 'live', label: 'System' },
	{ value: 'light', label: 'Light' },
	{ value: 'dark', label: 'Dark' },
];

const FOCUSABLE =
	'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type OptionGroupProps<T extends string> = {
	legend: string;
	description?: string;
	value: T;
	options: Option<T>[];
	onChange: (value: T) => void;
	columns?: 2 | 3 | 5;
};

function OptionGroup<T extends string>({
	legend,
	description,
	value,
	options,
	onChange,
	columns = 3,
}: OptionGroupProps<T>) {
	const groupId = useId();

	return (
		<fieldset className={styles.fieldset}>
			<legend className={styles.legend} id={groupId}>
				{legend}
			</legend>
			{description && <p className={styles.fieldDescription}>{description}</p>}
			<div
				className={styles.options}
				style={{ '--columns': columns } as React.CSSProperties}
				role="radiogroup"
				aria-labelledby={groupId}
			>
				{options.map(({ value: optionValue, label, hint }) => {
					const isActive = value === optionValue;
					return (
						<button
							key={optionValue}
							type="button"
							role="radio"
							aria-checked={isActive}
							className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
							onClick={() => onChange(optionValue)}
						>
							<span className={styles.optionLabel}>{label}</span>
							{hint && <span className={styles.optionHint}>{hint}</span>}
						</button>
					);
				})}
			</div>
		</fieldset>
	);
}

const DevPreviewSwitcher = () => {
	const [isOpen, setIsOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);
	const titleId = useId();

	const {
		condition,
		time,
		theme,
		setCondition,
		setTime,
		setTheme,
		reset,
		isPreviewActive,
	} = usePreview();

	const close = useCallback(() => setIsOpen(false), []);

	const open = useCallback(() => setIsOpen(true), []);

	useEffect(() => {
		if (!isOpen) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		const dialog = dialogRef.current;
		if (!dialog) return;

		const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE);
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		first?.focus();

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				close();
				return;
			}

			if (e.key !== 'Tab' || focusables.length === 0) return;

			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last?.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first?.focus();
			}
		};

		window.addEventListener('keydown', onKeyDown);

		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener('keydown', onKeyDown);
			triggerRef.current?.focus();
		};
	}, [isOpen, close]);

	return (
		<>
			<button
				ref={triggerRef}
				type="button"
				className={`${styles.trigger} ${isOpen ? styles.triggerHidden : ''}`}
				onClick={open}
				aria-label="Open sky and theme settings"
				aria-expanded={isOpen}
				aria-haspopup="dialog"
			>
				<span className={styles.triggerDot} />
			</button>

			{isOpen && (
				<div className={styles.dialogRoot}>
					<button
						type="button"
						className={styles.backdrop}
						onClick={close}
						tabIndex={-1}
						aria-hidden="true"
					/>

					<div
						ref={dialogRef}
						className={styles.dialog}
						role="dialog"
						aria-modal="true"
						aria-labelledby={titleId}
					>
						<div className={styles.dialogAccent} aria-hidden="true" />

						<header className={styles.header}>
							<div className={styles.headerText}>
								<h2 className={styles.title} id={titleId}>
									Sky & theme
								</h2>
							</div>
							<button
								type="button"
								className={styles.close}
								onClick={close}
								aria-label="Close dialog"
							>
								<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
									<path
										d="M1 1l12 12M13 1L1 13"
										stroke="currentColor"
										strokeWidth="1.5"
										strokeLinecap="round"
									/>
								</svg>
							</button>
						</header>

						<div className={styles.body}>
							<OptionGroup
								legend="Weather"
								value={condition}
								options={WEATHER_OPTIONS}
								onChange={setCondition}
								columns={3}
							/>

							<OptionGroup
								legend="Time of day"
								value={time}
								options={TIME_OPTIONS}
								onChange={setTime}
								columns={3}
							/>

							<OptionGroup
								legend="Theme"
								value={theme}
								options={THEME_OPTIONS}
								onChange={setTheme}
								columns={3}
							/>
						</div>

						<footer className={styles.footer}>
							<button
								type="button"
								className={styles.reset}
								onClick={reset}
								disabled={!isPreviewActive}
							>
								Reset to live
							</button>
							<button type="button" className={styles.done} onClick={close}>
								Done
							</button>
						</footer>
					</div>
				</div>
			)}
		</>
	);
};

export default DevPreviewSwitcher;
