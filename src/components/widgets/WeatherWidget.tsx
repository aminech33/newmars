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

  // Small: Température + icône avec gradient
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="" currentSize={size}>
        <div 
          className="absolute inset-0 flex flex-col justify-between p-5 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
          }}
        >
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.5) 0%, transparent 50%)'
          }} />
          
          <div className="relative z-10 flex flex-col items-center justify-center flex-1">
            <div className="w-14 h-14 mb-2 text-white drop-shadow-lg">
              {getWeatherIcon(weather.icon)}
            </div>
            <div className="text-5xl font-bold text-white drop-shadow-md">{weather.temp}°</div>
            <p className="text-xs text-white/80 capitalize mt-1">{weather.description}</p>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // Medium: Température + détails avec gradient
  if (size === 'medium') {
    return (
      <WidgetContainer 
        id={id} 
        title=""
        currentSize={size}
        actions={
          <span className="text-xs text-white/80">{weather.city}</span>
        }
      >
        <div 
          className="absolute inset-0 p-5 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
          }}
        >
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.5) 0%, transparent 50%)'
          }} />
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="mb-3">
              <div className="text-xs font-semibold text-white/80 uppercase tracking-wide">Météo</div>
              <div className="text-2xl font-bold text-white capitalize">{weather.description}</div>
            </div>

            {/* Current weather */}
            <div className="flex items-center gap-4 mb-3">
              <div className="w-16 h-16 text-white drop-shadow-lg">
                {getWeatherIcon(weather.icon)}
              </div>
              <div className="flex-1">
                <div className="text-4xl font-bold text-white drop-shadow-md">{weather.temp}°</div>
                <p className="text-xs text-white/70">Ressenti {weather.feelsLike}°</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Droplets className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">{weather.humidity}%</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Wind className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">{weather.windSpeed} km/h</span>
              </div>
            </div>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // Large: Tout + forecast 4h avec gradient
  return (
    <WidgetContainer 
      id={id} 
      title=""
      currentSize={size}
      actions={
        <span className="text-xs text-white/80">{weather.city}</span>
      }
    >
      <div 
        className="absolute inset-0 p-5 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        }}
      >
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.5) 0%, transparent 50%)'
        }} />
        
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-white/80 uppercase tracking-wide">Météo</div>
            <div className="text-3xl font-bold text-white capitalize">{weather.description}</div>
          </div>

          {/* Current weather */}
          <div className="flex items-center gap-4 mb-3">
            <div className="w-20 h-20 text-white drop-shadow-lg">
              {getWeatherIcon(weather.icon)}
            </div>
            <div className="flex-1">
              <div className="text-5xl font-bold text-white drop-shadow-md mb-1">{weather.temp}°</div>
              <p className="text-xs text-white/70">Ressenti {weather.feelsLike}°</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-2 p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Droplets className="w-4 h-4 text-white" />
              <div>
                <div className="text-xs text-white font-medium">{weather.humidity}%</div>
                <div className="text-[10px] text-white/70">Humidité</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Wind className="w-4 h-4 text-white" />
              <div>
                <div className="text-xs text-white font-medium">{weather.windSpeed} km/h</div>
                <div className="text-[10px] text-white/70">Vent</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Eye className="w-4 h-4 text-white" />
              <div>
                <div className="text-xs text-white font-medium">{weather.visibility} km</div>
                <div className="text-[10px] text-white/70">Visibilité</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Gauge className="w-4 h-4 text-white" />
              <div>
                <div className="text-xs text-white font-medium">{weather.pressure} hPa</div>
                <div className="text-[10px] text-white/70">Pression</div>
              </div>
            </div>
          </div>

          {/* Forecast */}
          <div className="flex-1 overflow-hidden">
            <p className="text-xs text-white/80 mb-2">Prochaines heures</p>
            <div className="grid grid-cols-4 gap-2">
              {forecast.map((item, index) => (
                <div key={index} className="text-center p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <p className="text-[10px] text-white/70 mb-1">{item.time}</p>
                  <div className="w-6 h-6 mx-auto mb-1 text-white drop-shadow">
                    {getWeatherIcon(item.icon)}
                  </div>
                  <p className="text-xs text-white font-medium">{item.temp}°</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
})

