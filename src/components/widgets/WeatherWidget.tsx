import { memo, useState, useEffect } from 'react'
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets, Eye, Gauge } from 'lucide-react'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface WeatherWidgetProps {
  widget: Widget
}

interface WeatherData {
  temp: number
  feelsLike: number
  humidity: number
  windSpeed: number
  visibility: number
  pressure: number
  description: string
  icon: string
  city: string
}

interface ForecastData {
  time: string
  temp: number
  icon: string
}

// API gratuite OpenWeatherMap (besoin d'une clé API)
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo'
const DEFAULT_CITY = 'Paris'

export const WeatherWidget = memo(function WeatherWidget({ widget }: WeatherWidgetProps) {
  const { id, size = 'small' } = widget
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // En mode démo sans API key, utiliser des données fictives
    if (API_KEY === 'demo') {
      setWeather({
        temp: 18,
        feelsLike: 16,
        humidity: 65,
        windSpeed: 12,
        visibility: 10,
        pressure: 1013,
        description: 'Partiellement nuageux',
        icon: '02d',
        city: DEFAULT_CITY
      })
      setForecast([
        { time: '12:00', temp: 19, icon: '02d' },
        { time: '15:00', temp: 21, icon: '01d' },
        { time: '18:00', temp: 18, icon: '03d' },
        { time: '21:00', temp: 15, icon: '02n' }
      ])
      setLoading(false)
      return
    }

    // Fetch real weather data
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${DEFAULT_CITY}&appid=${API_KEY}&units=metric&lang=fr`
        )
        const data = await response.json()
        
        if (data.cod === 200) {
          setWeather({
            temp: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
            visibility: Math.round(data.visibility / 1000), // meters to km
            pressure: data.main.pressure,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            city: data.name
          })
          
          // Fetch forecast
          const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${DEFAULT_CITY}&appid=${API_KEY}&units=metric&lang=fr`
          )
          const forecastData = await forecastResponse.json()
          
          if (forecastData.cod === '200') {
            const next4Hours = forecastData.list.slice(0, 4).map((item: any) => ({
              time: new Date(item.dt * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              temp: Math.round(item.main.temp),
              icon: item.weather[0].icon
            }))
            setForecast(next4Hours)
          }
        } else {
          setError('Impossible de charger la météo')
        }
      } catch (err) {
        setError('Erreur de connexion')
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getWeatherIcon = (iconCode: string) => {
    if (iconCode.startsWith('01')) return <Sun className="w-full h-full" />
    if (iconCode.startsWith('02')) return <Cloud className="w-full h-full" />
    if (iconCode.startsWith('09') || iconCode.startsWith('10')) return <CloudRain className="w-full h-full" />
    if (iconCode.startsWith('13')) return <CloudSnow className="w-full h-full" />
    return <Cloud className="w-full h-full" />
  }

  const getWeatherColor = (iconCode: string) => {
    if (iconCode.startsWith('01')) return 'text-yellow-400'
    if (iconCode.startsWith('02')) return 'text-blue-300'
    if (iconCode.startsWith('09') || iconCode.startsWith('10')) return 'text-blue-500'
    if (iconCode.startsWith('13')) return 'text-cyan-300'
    return 'text-zinc-400'
  }

  if (loading) {
    return (
      <WidgetContainer id={id} title="Météo" currentSize={size}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin">
            <Cloud className="w-8 h-8 text-zinc-600" />
          </div>
        </div>
      </WidgetContainer>
    )
  }

  if (error || !weather) {
    return (
      <WidgetContainer id={id} title="Météo" currentSize={size}>
        <div className="flex flex-col items-center justify-center h-full">
          <Cloud className="w-8 h-8 text-zinc-700 mb-2" />
          <p className="text-xs text-zinc-600">{error || 'Données indisponibles'}</p>
        </div>
      </WidgetContainer>
    )
  }

  // Small: Température + icône
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Météo" currentSize={size}>
        <div className="flex flex-col items-center justify-center h-full">
          <div className={`w-12 h-12 mb-2 ${getWeatherColor(weather.icon)}`}>
            {getWeatherIcon(weather.icon)}
          </div>
          <div className="text-3xl font-bold text-zinc-200">{weather.temp}°</div>
          <p className="text-xs text-zinc-500">{weather.city}</p>
        </div>
      </WidgetContainer>
    )
  }

  // Medium: Température + détails + 4h forecast
  if (size === 'medium') {
    return (
      <WidgetContainer 
        id={id} 
        title="Météo"
        currentSize={size}
        actions={
          <span className="text-xs text-zinc-600">{weather.city}</span>
        }
      >
        <div className="flex flex-col h-full">
          {/* Current weather */}
          <div className="flex items-center gap-4 mb-3 pb-3 border-b border-white/5">
            <div className={`w-16 h-16 ${getWeatherColor(weather.icon)}`}>
              {getWeatherIcon(weather.icon)}
            </div>
            <div className="flex-1">
              <div className="text-4xl font-bold text-zinc-200">{weather.temp}°</div>
              <p className="text-sm text-zinc-500 capitalize">{weather.description}</p>
              <p className="text-xs text-zinc-600">Ressenti {weather.feelsLike}°</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs">
              <Droplets className="w-3 h-3 text-blue-400" />
              <span className="text-zinc-400">{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Wind className="w-3 h-3 text-cyan-400" />
              <span className="text-zinc-400">{weather.windSpeed} km/h</span>
            </div>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // Large: Tout + forecast 4h
  return (
    <WidgetContainer 
      id={id} 
      title="Météo"
      currentSize={size}
      actions={
        <span className="text-xs text-zinc-600">{weather.city}</span>
      }
    >
      <div className="flex flex-col h-full">
        {/* Current weather */}
        <div className="flex items-center gap-4 mb-3">
          <div className={`w-20 h-20 ${getWeatherColor(weather.icon)}`}>
            {getWeatherIcon(weather.icon)}
          </div>
          <div className="flex-1">
            <div className="text-5xl font-bold text-zinc-200 mb-1">{weather.temp}°</div>
            <p className="text-sm text-zinc-400 capitalize">{weather.description}</p>
            <p className="text-xs text-zinc-600">Ressenti {weather.feelsLike}°</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg">
            <Droplets className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-xs text-blue-300 font-medium">{weather.humidity}%</div>
              <div className="text-[10px] text-blue-400/70">Humidité</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-cyan-500/10 rounded-lg">
            <Wind className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-xs text-cyan-300 font-medium">{weather.windSpeed} km/h</div>
              <div className="text-[10px] text-cyan-400/70">Vent</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-violet-500/10 rounded-lg">
            <Eye className="w-4 h-4 text-violet-400" />
            <div>
              <div className="text-xs text-violet-300 font-medium">{weather.visibility} km</div>
              <div className="text-[10px] text-violet-400/70">Visibilité</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-indigo-500/10 rounded-lg">
            <Gauge className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="text-xs text-indigo-300 font-medium">{weather.pressure} hPa</div>
              <div className="text-[10px] text-indigo-400/70">Pression</div>
            </div>
          </div>
        </div>

        {/* Forecast */}
        <div>
          <p className="text-xs text-zinc-500 mb-2">Prochaines heures</p>
          <div className="grid grid-cols-4 gap-2">
            {forecast.map((item, index) => (
              <div key={index} className="text-center p-2 bg-zinc-900/30 rounded-lg">
                <p className="text-[10px] text-zinc-600 mb-1">{item.time}</p>
                <div className={`w-6 h-6 mx-auto mb-1 ${getWeatherColor(item.icon)}`}>
                  {getWeatherIcon(item.icon)}
                </div>
                <p className="text-xs text-zinc-300 font-medium">{item.temp}°</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
})

