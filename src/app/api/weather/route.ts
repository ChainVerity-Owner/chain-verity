// OpenWeatherMap — current conditions at a lat/lon coordinate
// Requires OPENWEATHERMAP_API_KEY env var (free tier: 1,000 calls/day)
// Register at https://openweathermap.org/api
//
// Used by: NetworkMap tooltip (live conditions at factory locations)

export const revalidate = 1800; // 30-minute cache

const CONDITION_EMOJI: Record<string, string> = {
  Thunderstorm: "⛈",
  Drizzle: "🌦",
  Rain: "🌧",
  Snow: "❄️",
  Mist: "🌫",
  Smoke: "🌫",
  Haze: "🌫",
  Fog: "🌫",
  Tornado: "🌪",
  Clear: "☀️",
  Clouds: "☁️",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return Response.json({ error: "lat and lon params required" }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return Response.json({ noKey: true }, { status: 503 });
  }

  try {
    const url =
      `https://api.openweathermap.org/data/2.5/weather` +
      `?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    const res = await fetch(url);
    if (!res.ok) {
      return Response.json({ error: `OWM error ${res.status}` }, { status: 502 });
    }

    const d = await res.json();
    const main = d.weather?.[0]?.main ?? "Clear";

    return Response.json({
      temp: Math.round(d.main?.temp ?? 0),
      feelsLike: Math.round(d.main?.feels_like ?? 0),
      humidity: d.main?.humidity ?? 0,
      conditions: main,
      description: d.weather?.[0]?.description ?? "",
      icon: d.weather?.[0]?.icon ?? "",
      emoji: CONDITION_EMOJI[main] ?? "🌡",
      windSpeed: Math.round((d.wind?.speed ?? 0) * 3.6), // m/s → km/h
      windDir: d.wind?.deg ?? 0,
      visibility: d.visibility ?? null,
      cloudCover: d.clouds?.all ?? 0,
    });
  } catch (err) {
    console.error("Weather error:", err);
    return Response.json({ error: String(err) }, { status: 502 });
  }
}
