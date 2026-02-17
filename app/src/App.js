import { useState, useEffect, useRef, useCallback } from "react"
import "./App.css"

const THEMES = {
  sunny: { bg: "theme-sunny", icon: "☀️", label: "Sunny" },
  night: { bg: "theme-night", icon: "🌙", label: "Night" },
  rainy: { bg: "theme-rainy", icon: "🌧️", label: "Rainy" },
  stormy: { bg: "theme-stormy", icon: "⛈️", label: "Storm" },
  snowy: { bg: "theme-snowy", icon: "❄️", label: "Snow" },
  cloudy: { bg: "theme-cloudy", icon: "⛅", label: "Cloudy" },
  foggy: { bg: "theme-foggy", icon: "🌫️", label: "Foggy" },
}

function getThemeKey(weatherId, isNight) {
  if (isNight) return "night"
  if (weatherId >= 200 && weatherId < 300) return "stormy"
  if (weatherId >= 300 && weatherId < 600) return "rainy"
  if (weatherId >= 600 && weatherId < 700) return "snowy"
  if (weatherId >= 700 && weatherId < 800) return "foggy"
  if (weatherId === 800) return "sunny"
  return "cloudy"
}

function rand(min, max) {
  return Math.random() * (max - min) + min
}

function RainLayer() {
  const drops = Array.from({ length: 70 }, (_, i) => ({
    id: i,
    left: rand(0, 100),
    height: rand(40, 110),
    duration: rand(0.5, 1.0),
    delay: rand(0, 2),
    opacity: rand(0.35, 0.75),
  }))
  return (
    <div className="fx-layer rain-layer" aria-hidden>
      {drops.map((d) => (
        <div
          key={d.id}
          className="raindrop"
          style={{
            left: `${d.left}%`,
            height: `${d.height}px`,
            animationDuration: `${d.duration}s`,
            animationDelay: `-${d.delay}s`,
            opacity: d.opacity,
          }}
        />
      ))}
    </div>
  )
}

function SnowLayer() {
  const flakes = Array.from({ length: 55 }, (_, i) => ({
    id: i,
    left: rand(0, 100),
    size: rand(8, 20),
    duration: rand(6, 15),
    delay: rand(0, 14),
    drift: rand(-60, 60),
    char: ["❄", "❅", "❆", "·", "∗"][Math.floor(Math.random() * 5)],
  }))
  return (
    <div className="fx-layer snow-layer" aria-hidden>
      {flakes.map((f) => (
        <span
          key={f.id}
          className="snowflake"
          style={{
            left: `${f.left}%`,
            fontSize: `${f.size}px`,
            animationDuration: `${f.duration}s`,
            animationDelay: `-${f.delay}s`,
            "--drift": `${f.drift}px`,
          }}
        >
          {f.char}
        </span>
      ))}
    </div>
  )
}

function StarLayer() {
  const stars = Array.from({ length: 90 }, (_, i) => ({
    id: i,
    top: rand(0, 72),
    left: rand(0, 100),
    size: rand(1, 3),
    duration: rand(2, 6),
    delay: rand(0, 6),
  }))
  return (
    <div className="fx-layer star-layer" aria-hidden>
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDuration: `${s.duration}s`,
            animationDelay: `-${s.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

function CloudLayer({ count = 5 }) {
  const clouds = Array.from({ length: count }, (_, i) => ({
    id: i,
    top: rand(3, 35),
    width: rand(160, 280),
    height: rand(70, 120),
    duration: rand(35, 70),
    delay: rand(0, 60),
    opacity: rand(0.06, 0.18),
  }))
  return (
    <div className="fx-layer cloud-layer" aria-hidden>
      {clouds.map((c) => (
        <div
          key={c.id}
          className="cloud"
          style={{
            top: `${c.top}%`,
            width: `${c.width}px`,
            height: `${c.height}px`,
            animationDuration: `${c.duration}s`,
            animationDelay: `-${c.delay}s`,
            opacity: c.opacity,
          }}
        />
      ))}
    </div>
  )
}

function LightningLayer() {
  const [flash, setFlash] = useState(false)
  useEffect(() => {
    let t
    const loop = () => {
      t = setTimeout(
        () => {
          setFlash(true)
          setTimeout(() => setFlash(false), 150)
          loop()
        },
        rand(2500, 8000),
      )
    }
    loop()
    return () => clearTimeout(t)
  }, [])
  return (
    <div className={`lightning-flash ${flash ? "active" : ""}`} aria-hidden />
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

function SunArc({ sunrise, sunset, current }) {
  const total = sunset - sunrise
  const elapsed = Math.min(Math.max(current - sunrise, 0), total)
  const pct = total > 0 ? elapsed / total : 0
  const arcX = 50 + 40 * Math.sin(pct * Math.PI)
  const arcY = 55 - 40 * Math.abs(Math.sin(pct * Math.PI))
  return (
    <svg viewBox="0 0 100 60" className="sun-arc" aria-hidden>
      <path
        d="M 5 55 A 45 45 0 0 1 95 55"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
      />
      <circle
        cx={arcX}
        cy={arcY}
        r="5"
        fill="rgba(255,220,100,0.9)"
        style={{ filter: "drop-shadow(0 0 6px rgba(255,200,50,0.8))" }}
      />
    </svg>
  )
}

export default function App() {
  const [query, setQuery] = useState("")
  const [weather, setWeather] = useState(null)
  const [themeKey, setThemeKey] = useState("sunny")
  const [unit, setUnit] = useState("metric")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [cardVis, setCardVis] = useState(false)
  const inputRef = useRef(null)

  const theme = THEMES[themeKey]

  const toDisplay = useCallback(
    (c) => (unit === "metric" ? Math.round(c) : Math.round((c * 9) / 5 + 32)),
    [unit],
  )
  const unitSymbol = unit === "metric" ? "°C" : "°F"
  const speedUnit = unit === "metric" ? "m/s" : "mph"
  const windConv = useCallback(
    (ms) => (unit === "metric" ? ms.toFixed(1) : (ms * 2.237).toFixed(1)),
    [unit],
  )

  const fetchWeather = async (city = query) => {
    const q = city.trim()
    if (!q) return
    setLoading(true)
    setError("")
    setCardVis(false)
    try {
      // ✅ Relative URL — proxy handles routing, zero CORS issues anywhere
      const res = await fetch(`/weatherApi?city=${encodeURIComponent(q)}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `City not found (${res.status})`)
      }
      const data = await res.json()
      const wId = data.weather[0].id
      const night = data.dt < data.sys.sunrise || data.dt > data.sys.sunset
      setThemeKey(getThemeKey(wId, night))
      setWeather(data)
      setTimeout(() => setCardVis(true), 60)
    } catch (e) {
      setError(e.message || "Failed to fetch weather.")
    } finally {
      setLoading(false)
    }
  }

  const fmtTime = (unix, tz) => {
    const d = new Date((unix + tz) * 1000)
    return d.toUTCString().slice(17, 22)
  }
  const fmtDate = (unix, tz) => {
    const d = new Date((unix + tz) * 1000)
    return d.toUTCString().slice(0, 22)
  }

  const renderFX = () => {
    switch (themeKey) {
      case "sunny":
        return <div className="sun-orb" aria-hidden />
      case "night":
        return (
          <>
            <StarLayer />
            <div className="moon-orb" aria-hidden />
          </>
        )
      case "rainy":
        return (
          <>
            <CloudLayer />
            <RainLayer />
          </>
        )
      case "stormy":
        return (
          <>
            <CloudLayer count={7} />
            <RainLayer />
            <LightningLayer />
          </>
        )
      case "snowy":
        return <SnowLayer />
      case "cloudy":
        return <CloudLayer />
      case "foggy":
        return (
          <>
            <div className="fog-band" />
            <div className="fog-band fog-band--2" />
          </>
        )
      default:
        return null
    }
  }

  const QUICK = ["London", "Tokyo", "New York", "Dubai", "Sydney", "Reykjavik"]

  return (
    <div className={`app-root ${theme.bg}`}>
      <div className="bg-canvas">{renderFX()}</div>
      <div className="app-content">
        <header className="app-header">
          <div className="brand-name">Atmosphera</div>
          <div className="brand-sub">Live Weather</div>
        </header>

        <div className="search-row">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input
              ref={inputRef}
              className="search-input"
              type="text"
              placeholder="Search city…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchWeather()}
              autoComplete="off"
            />
            {query && (
              <button
                className="clear-btn"
                onClick={() => {
                  setQuery("")
                  inputRef.current?.focus()
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button
            className="search-btn"
            onClick={() => fetchWeather()}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : "Go"}
          </button>
        </div>

        <div className="unit-toggle">
          <button
            className={unit === "metric" ? "active" : ""}
            onClick={() => setUnit("metric")}
          >
            °C
          </button>
          <button
            className={unit === "imperial" ? "active" : ""}
            onClick={() => setUnit("imperial")}
          >
            °F
          </button>
        </div>

        <div className="chips-row">
          {QUICK.map((c) => (
            <button
              key={c}
              className="chip"
              onClick={() => {
                setQuery(c)
                fetchWeather(c)
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {error && <div className="error-banner">⚠ {error}</div>}

        {loading && (
          <div className="skeleton-card">
            <div className="skel skel-title" />
            <div className="skel skel-temp" />
            <div className="skel skel-row" />
          </div>
        )}

        {weather && !loading && (
          <div className={`weather-card ${cardVis ? "card-visible" : ""}`}>
            <div className="card-top">
              <div>
                <div className="city-name">{weather.name}</div>
                <div className="country-tag">{weather.sys.country}</div>
                <div className="date-str">
                  {fmtDate(weather.dt, weather.timezone)}
                </div>
              </div>
              <div className="big-icon">{theme.icon}</div>
            </div>
            <div className="temp-block">
              <span className="temp-number">
                {toDisplay(weather.main.temp)}
              </span>
              <span className="temp-sym">{unitSymbol}</span>
            </div>
            <div className="feels-like">
              Feels like {toDisplay(weather.main.feels_like)}
              {unitSymbol}
            </div>
            <div className="condition-str">
              {weather.weather[0].description}
            </div>
            <SunArc
              sunrise={weather.sys.sunrise}
              sunset={weather.sys.sunset}
              current={weather.dt}
            />
            <div className="stats-grid">
              <StatCard
                icon="💧"
                label="Humidity"
                value={`${weather.main.humidity}%`}
              />
              <StatCard
                icon="🌬️"
                label={`Wind (${speedUnit})`}
                value={windConv(weather.wind.speed)}
              />
              <StatCard
                icon="👁️"
                label="Visibility"
                value={
                  weather.visibility
                    ? `${(weather.visibility / 1000).toFixed(1)} km`
                    : "—"
                }
              />
              <StatCard
                icon="🌡️"
                label="Min / Max"
                value={`${toDisplay(weather.main.temp_min)}° / ${toDisplay(weather.main.temp_max)}°`}
              />
              <StatCard
                icon="☁️"
                label="Clouds"
                value={`${weather.clouds.all}%`}
              />
              <StatCard
                icon="📊"
                label="Pressure"
                value={`${weather.main.pressure} hPa`}
              />
            </div>
            <div className="divider" />
            <div className="sun-row">
              <div className="sun-block">
                <span className="sun-icon-lg">🌅</span>
                <span className="sun-time">
                  {fmtTime(weather.sys.sunrise, weather.timezone)}
                </span>
                <span className="sun-lbl">Sunrise</span>
              </div>
              <div className="sun-sep" />
              <div className="sun-block">
                <span className="sun-icon-lg">🌇</span>
                <span className="sun-time">
                  {fmtTime(weather.sys.sunset, weather.timezone)}
                </span>
                <span className="sun-lbl">Sunset</span>
              </div>
            </div>
          </div>
        )}

        {!weather && !loading && !error && (
          <p className="hint-text">Enter any city to see live weather ✦</p>
        )}
      </div>
    </div>
  )
}
