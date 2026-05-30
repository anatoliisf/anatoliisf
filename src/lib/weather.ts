export type WeatherCondition = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'thunderstorm';

export type BirthplaceWeather = {
	isDay: boolean;
	condition: WeatherCondition;
	temperature: number;
	sunrise: Date;
	sunset: Date;
};

export function weatherCodeToCondition(code: number): WeatherCondition {
	if (code === 0 || code === 1) return 'clear';
	if (code === 2 || code === 3) return 'cloudy';
	if (code === 45 || code === 48) return 'fog';
	if (code >= 95) return 'thunderstorm';
	if (code >= 51 && code <= 67) return 'rain';
	if (code >= 80 && code <= 82) return 'rain';
	if (code >= 71 && code <= 77) return 'snow';
	if (code >= 85 && code <= 86) return 'snow';
	return 'cloudy';
}

/** Parse an Open-Meteo local datetime string (in birthplace timezone) to a UTC Date. */
function parseBirthplaceDateTime(isoLocal: string): Date {
	const normalized = isoLocal.length === 16 ? `${isoLocal}:00` : isoLocal;
	return new Date(`${normalized}+05:00`);
}

export function parseBirthplaceWeather(data: {
	current: { weather_code: number; is_day: number; temperature_2m: number };
	daily: { sunrise: string[]; sunset: string[] };
}): BirthplaceWeather {
	return {
		isDay: data.current.is_day === 1,
		condition: weatherCodeToCondition(data.current.weather_code),
		temperature: data.current.temperature_2m,
		sunrise: parseBirthplaceDateTime(data.daily.sunrise[0]),
		sunset: parseBirthplaceDateTime(data.daily.sunset[0]),
	};
}
