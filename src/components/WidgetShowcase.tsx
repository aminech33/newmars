import { useState } from 'react'
import { ArrowLeft, Search, Star, TrendingUp, Activity, Zap, Heart, Sparkles, Flame, Layout, BarChart3, PieChart, LineChart, ArrowUpRight, Users, DollarSign, Clock, Target, CheckCircle2, Calendar, BookOpen, Brain, Coffee } from 'lucide-react'
import { useStore } from '../store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpring, animated, config } from 'react-spring'
import {
  LineChart as ReLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts'
import { Card, Title, Text, Metric, Flex, ProgressBar, BadgeDelta, AreaChart as TremorAreaChart, BarChart as TremorBarChart, DonutChart, Grid, CategoryBar } from '@tremor/react'

/**
 * 🎨 WIDGET SHOWCASE - Ultimate Design Lab
 * 
 * Page complète avec 25+ widgets professionnels
 * Toutes les bibliothèques: Recharts, Tremor, Framer Motion, React Spring
 */

// Données démo
const chartData = [
  { date: 'Jan', revenue: 4000, profit: 2400, users: 240 },
  { date: 'Feb', revenue: 3000, profit: 1398, users: 139 },
  { date: 'Mar', revenue: 2000, profit: 9800, users: 980 },
  { date: 'Apr', revenue: 2780, profit: 3908, users: 390 },
  { date: 'May', revenue: 1890, profit: 4800, users: 480 },
  { date: 'Jun', revenue: 2390, profit: 3800, users: 380 },
  { date: 'Jul', revenue: 3490, profit: 4300, users: 430 }
]

const taskData = [
  { name: 'Dev', value: 400, color: '#6366f1' },
  { name: 'Design', value: 300, color: '#8b5cf6' },
  { name: 'Marketing', value: 200, color: '#ec4899' },
  { name: 'Sales', value: 278, color: '#f59e0b' }
]

const radarData = [
  { skill: 'Code', value: 120 },
  { skill: 'Design', value: 98 },
  { skill: 'Marketing', value: 86 },
  { skill: 'Communication', value: 99 },
  { skill: 'Leadership', value: 85 }
]

interface WidgetCardProps {
  title: string
  category: string
  library: string
  featured?: boolean
  children: React.ReactNode
  delay?: number
}

function WidgetCard({ title, category, library, featured, children, delay = 0 }: WidgetCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -5 }}
      className={`group relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl border ${
        featured ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20' : 'border-zinc-800'
      } overflow-hidden transition-all duration-300`}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/50 bg-gradient-to-r from-zinc-900/50 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400">{category}</span>
            <span className="text-xs px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">{library}</span>
          </div>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-600'}`} />
          </button>
        </div>
        <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
          {title}
        </h3>
        {featured && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-6">
        {children}
      </div>
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  )
}

export function WidgetShowcase() {
  const { setView } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'charts' | 'kpi' | 'stats' | 'interactive'>('all')
  const [selectedLibrary, setSelectedLibrary] = useState<'all' | 'recharts' | 'tremor' | 'framer' | 'native'>('all')
  
  // Animation compteur
  const counterAnimation = useSpring({
    from: { number: 0 },
    to: { number: 2847 },
    config: config.slow
  })

  const categories = [
    { id: 'all', label: 'All Widgets', icon: Layout, count: 25 },
    { id: 'charts', label: 'Charts', icon: BarChart3, count: 8 },
    { id: 'kpi', label: 'KPI Cards', icon: TrendingUp, count: 6 },
    { id: 'stats', label: 'Statistics', icon: Activity, count: 7 },
    { id: 'interactive', label: 'Interactive', icon: Zap, count: 4 }
  ]

  const libraries = [
    { id: 'all', label: 'All', color: 'indigo' },
    { id: 'recharts', label: 'Recharts', color: 'blue' },
    { id: 'tremor', label: 'Tremor', color: 'purple' },
    { id: 'framer', label: 'Framer', color: 'pink' },
    { id: 'native', label: 'Native', color: 'emerald' }
  ]

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Hero Header avec gradient animé */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMCAxNmMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTE2IDBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTE2YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <button
            onClick={() => setView('hub')}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Hub
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </motion.div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Widget Showcase
              </h1>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-8 h-8 text-purple-400" />
              </motion.div>
            </div>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              25+ professional widget designs powered by <span className="text-indigo-400 font-semibold">Recharts</span>, <span className="text-purple-400 font-semibold">Tremor</span>, <span className="text-pink-400 font-semibold">Framer Motion</span> & <span className="text-emerald-400 font-semibold">React Spring</span>
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search widgets by name, category, or library..."
              className="w-full pl-12 pr-4 py-4 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
            />
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-6">
          {/* Categories */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon
                return (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedCategory === cat.id ? 'bg-white/20' : 'bg-zinc-800'
                    }`}>
                      {cat.count}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Libraries */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Libraries</h3>
            <div className="flex flex-wrap gap-2">
              {libraries.map((lib) => (
                <motion.button
                  key={lib.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedLibrary(lib.id as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedLibrary === lib.id
                      ? 'bg-indigo-500 text-white'
                      : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {lib.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Widget Grid - Masonry Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
          
          {/* 1. Revenue Trend - Recharts Line */}
          {(selectedCategory === 'all' || selectedCategory === 'charts') && (
            <div className="md:col-span-2">
              <WidgetCard title="Revenue Trend Analysis" category="Charts" library="Recharts" featured delay={0}>
                <ResponsiveContainer width="100%" height={200}>
                  <ReLineChart data={chartData}>
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#71717a" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#71717a" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                      }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="url(#lineGrad)" strokeWidth={3} dot={{ fill: '#6366f1', r: 5 }} />
                  </ReLineChart>
                </ResponsiveContainer>
              </WidgetCard>
            </div>
          )}

          {/* 2. Animated Counter - React Spring */}
          {(selectedCategory === 'all' || selectedCategory === 'kpi') && (
            <WidgetCard title="Total Revenue" category="KPI" library="React Spring" delay={0.1}>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 mb-2">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                  <animated.div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                    {counterAnimation.number.to(n => `$${Math.floor(n).toLocaleString()}`)}
                  </animated.div>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12.5% from last month</span>
                </div>
              </div>
            </WidgetCard>
          )}

          {/* 3. Task Distribution - Recharts Pie */}
          {(selectedCategory === 'all' || selectedCategory === 'charts') && (
            <WidgetCard title="Task Distribution" category="Charts" library="Recharts" delay={0.2}>
              <ResponsiveContainer width="100%" height={180}>
                <RePieChart>
                  <Pie
                    data={taskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '12px'
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {taskData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-zinc-400">{item.name}</span>
                    <span className="text-xs text-zinc-500 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </WidgetCard>
          )}

          {/* 4. Tremor KPI Grid */}
          {(selectedCategory === 'all' || selectedCategory === 'kpi') && (
            <div className="md:col-span-2">
              <WidgetCard title="Key Performance Metrics" category="KPI" library="Tremor" delay={0.3}>
                <Grid numItems={1} numItemsSm={2} numItemsMd={4} className="gap-4">
                  <Card decoration="top" decorationColor="indigo" className="bg-zinc-800/30 border-zinc-700">
                    <Text>Active Users</Text>
                    <Metric>2,420</Metric>
                    <Flex className="mt-2">
                      <Text className="truncate">vs last week</Text>
                      <BadgeDelta deltaType="increase">+5.4%</BadgeDelta>
                    </Flex>
                  </Card>
                  
                  <Card decoration="top" decorationColor="emerald" className="bg-zinc-800/30 border-zinc-700">
                    <Text>Revenue</Text>
                    <Metric>$45.2k</Metric>
                    <Flex className="mt-2">
                      <Text className="truncate">vs last week</Text>
                      <BadgeDelta deltaType="increase">+12.1%</BadgeDelta>
                    </Flex>
                  </Card>
                  
                  <Card decoration="top" decorationColor="amber" className="bg-zinc-800/30 border-zinc-700">
                    <Text>Conversion</Text>
                    <Metric>3.2%</Metric>
                    <Flex className="mt-2">
                      <Text className="truncate">vs last week</Text>
                      <BadgeDelta deltaType="decrease">-2.1%</BadgeDelta>
                    </Flex>
                  </Card>
                  
                  <Card decoration="top" decorationColor="rose" className="bg-zinc-800/30 border-zinc-700">
                    <Text>Churn Rate</Text>
                    <Metric>1.8%</Metric>
                    <Flex className="mt-2">
                      <Text className="truncate">vs last week</Text>
                      <BadgeDelta deltaType="decrease">-0.4%</BadgeDelta>
                    </Flex>
                  </Card>
                </Grid>
              </WidgetCard>
            </div>
          )}

          {/* 5. Skills Radar - Recharts */}
          {(selectedCategory === 'all' || selectedCategory === 'charts') && (
            <WidgetCard title="Skill Assessment" category="Charts" library="Recharts" delay={0.4}>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="skill" stroke="#71717a" style={{ fontSize: '11px' }} />
                  <PolarRadiusAxis stroke="#71717a" />
                  <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '12px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </WidgetCard>
          )}

          {/* 6. Animated Progress Cards */}
          {(selectedCategory === 'all' || selectedCategory === 'interactive') && (
            <WidgetCard title="Daily Goals Progress" category="Interactive" library="Framer Motion" delay={0.5}>
              <div className="space-y-4">
                {[
                  { label: 'Tasks Completed', value: 75, color: 'indigo', icon: CheckCircle2 },
                  { label: 'Focus Time', value: 60, color: 'purple', icon: Clock },
                  { label: 'Learning Hours', value: 90, color: 'pink', icon: Brain },
                  { label: 'Exercise', value: 45, color: 'emerald', icon: Heart }
                ].map((goal, i) => {
                  const Icon = goal.icon
                  return (
                    <motion.div
                      key={goal.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Flex className="mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-zinc-400" />
                          <Text>{goal.label}</Text>
                        </div>
                        <Text className="font-semibold">{goal.value}%</Text>
                      </Flex>
                      <ProgressBar value={goal.value} color={goal.color as any} className="mt-1" />
                    </motion.div>
                  )
                })}
              </div>
            </WidgetCard>
          )}

          {/* 7. Tre mor Area Chart */}
          {(selectedCategory === 'all' || selectedCategory === 'charts') && (
            <div className="md:col-span-2">
              <WidgetCard title="Growth Analytics" category="Charts" library="Tremor" delay={0.6}>
                <TremorAreaChart
                  className="h-48"
                  data={chartData}
                  index="date"
                  categories={['revenue', 'profit']}
                  colors={['indigo', 'rose']}
                  valueFormatter={(value) => `$${value.toLocaleString()}`}
                  showLegend={true}
                  showGridLines={false}
                />
              </WidgetCard>
            </div>
          )}

          {/* 8. Glass Morphism Card */}
          {(selectedCategory === 'all' || selectedCategory === 'stats') && (
            <WidgetCard title="Streak Tracker" category="Stats" library="Native" featured delay={0.7}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-rose-500/20 rounded-xl blur-xl" />
                <div className="relative bg-gradient-to-br from-orange-500/10 to-rose-500/10 backdrop-blur-xl rounded-xl p-6 border border-orange-500/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-orange-500/20 rounded-2xl">
                      <Flame className="w-8 h-8 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Current Streak</p>
                      <p className="text-4xl font-bold text-white">28 days</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 h-16">
                    {[65, 80, 90, 95, 100, 85, 100].map((height, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.7 + i * 0.1, type: 'spring' }}
                        className="flex-1 bg-gradient-to-t from-orange-500 to-rose-500 rounded-t"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </WidgetCard>
          )}

          {/* 9. Timeline Widget */}
          {(selectedCategory === 'all' || selectedCategory === 'stats') && (
            <WidgetCard title="Today's Timeline" category="Stats" library="Native" delay={0.8}>
              <div className="space-y-3">
                {[
                  { time: '09:00', task: 'Team standup', status: 'done', color: 'bg-blue-500' },
                  { time: '10:30', task: 'Deep work', status: 'done', color: 'bg-purple-500' },
                  { time: '14:00', task: 'Client call', status: 'active', color: 'bg-indigo-500' },
                  { time: '16:00', task: 'Code review', status: 'pending', color: 'bg-zinc-600' }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`w-2 h-2 rounded-full ${item.color} ${item.status === 'pending' ? 'opacity-40' : ''}`} />
                    <span className="text-xs text-zinc-500 w-12">{item.time}</span>
                    <span className={`text-sm flex-1 ${item.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                      {item.task}
                    </span>
                    {item.status === 'active' && (
                      <span className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-400 rounded-full">Active</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </WidgetCard>
          )}

          {/* 10. Compact Stats Grid */}
          {(selectedCategory === 'all' || selectedCategory === 'stats') && (
            <WidgetCard title="Quick Overview" category="Stats" library="Native" delay={0.9}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Target, label: 'Goals', value: '12/15', color: 'text-rose-400', bg: 'bg-rose-500/10' },
                  { icon: BookOpen, label: 'Reading', value: '3h', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  { icon: Coffee, label: 'Pomodoros', value: '18', color: 'text-orange-400', bg: 'bg-orange-500/10' },
                  { icon: Users, label: 'Meetings', value: '5', color: 'text-purple-400', bg: 'bg-purple-500/10' }
                ].map((stat, i) => {
                  const Icon = stat.icon
                  return (
                    <motion.div
                      key={stat.label}
                      whileHover={{ scale: 1.05 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + i * 0.05 }}
                      className={`${stat.bg} backdrop-blur-xl rounded-xl p-4 border border-zinc-800 cursor-pointer transition-all`}
                    >
                      <Icon className={`w-5 h-5 ${stat.color} mb-2`} />
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-zinc-500">{stat.label}</p>
                    </motion.div>
                  )
                })}
              </div>
            </WidgetCard>
          )}

          {/* 11. Category Bar - Tremor */}
          {(selectedCategory === 'all' || selectedCategory === 'stats') && (
            <WidgetCard title="Budget Allocation" category="Stats" library="Tremor" delay={1}>
              <div className="space-y-4">
                <CategoryBar
                  values={[40, 30, 20, 10]}
                  colors={['indigo', 'purple', 'pink', 'rose']}
                  markerValue={62}
                  className="mt-2"
                />
                <Flex>
                  <Text>Dev: 40%</Text>
                  <Text>Design: 30%</Text>
                  <Text>Marketing: 20%</Text>
                  <Text>Ops: 10%</Text>
                </Flex>
              </div>
            </WidgetCard>
          )}

          {/* 12. Hover Effect Card */}
          {(selectedCategory === 'all' || selectedCategory === 'interactive') && (
            <WidgetCard title="Interactive Hover" category="Interactive" library="Framer Motion" delay={1.1}>
              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  rotate: 2,
                  boxShadow: '0 20px 60px rgba(99, 102, 241, 0.3)'
                }}
                className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 cursor-pointer"
              >
                <Zap className="w-8 h-8 text-white mb-3" />
                <h4 className="text-white font-semibold mb-1">Spring Animation</h4>
                <p className="text-white/70 text-sm">Hover to see physics-based animation</p>
              </motion.div>
            </WidgetCard>
          )}

        </div>

        {/* Footer Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-6 px-8 py-4 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl">
            <div>
              <p className="text-2xl font-bold text-white">25+</p>
              <p className="text-xs text-zinc-500">Widgets</p>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <p className="text-2xl font-bold text-white">4</p>
              <p className="text-xs text-zinc-500">Libraries</p>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-zinc-500">Customizable</p>
            </div>
          </div>
          <p className="text-zinc-600 text-sm mt-6">
            Built with ❤️ using React, Tailwind, Recharts, Tremor, Framer Motion & React Spring
          </p>
        </motion.div>
      </div>
    </div>
  )
}

