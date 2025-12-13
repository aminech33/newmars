import { useState } from 'react'
import { ArrowLeft, TrendingUp, Activity, Zap, Users, DollarSign, ShoppingCart } from 'lucide-react'
import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
import { useSpring, animated } from 'react-spring'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
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
  Radar
} from 'recharts'
import { Card, Metric, Text, ProgressBar, BadgeDelta, Flex, Grid } from '@tremor/react'

/**
 * 🧪 ADVANCED WIDGET EXPERIMENTS
 * 
 * Widgets utilisant les bibliothèques open source:
 * - Recharts pour les graphiques
 * - Tremor pour les composants dashboard
 * - Framer Motion pour les animations
 * - React Spring pour les animations physiques
 */

// Données de démonstration
const salesData = [
  { name: 'Jan', value: 4000, pv: 2400 },
  { name: 'Feb', value: 3000, pv: 1398 },
  { name: 'Mar', value: 2000, pv: 9800 },
  { name: 'Apr', value: 2780, pv: 3908 },
  { name: 'May', value: 1890, pv: 4800 },
  { name: 'Jun', value: 2390, pv: 3800 },
  { name: 'Jul', value: 3490, pv: 4300 },
]

const categoryData = [
  { name: 'Dev', value: 400 },
  { name: 'Design', value: 300 },
  { name: 'Work', value: 300 },
  { name: 'Personal', value: 200 },
]

const radarData = [
  { subject: 'Tasks', A: 120, B: 110, fullMark: 150 },
  { subject: 'Focus', A: 98, B: 130, fullMark: 150 },
  { subject: 'Health', A: 86, B: 130, fullMark: 150 },
  { subject: 'Learning', A: 99, B: 100, fullMark: 150 },
  { subject: 'Reading', A: 85, B: 90, fullMark: 150 },
  { subject: 'Exercise', A: 65, B: 85, fullMark: 150 },
]

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b']

export function AdvancedWidgetExperiments() {
  const { setView } = useStore()
  const [activeLib, setActiveLib] = useState<'all' | 'recharts' | 'tremor' | 'animations'>('all')

  // Animation avec React Spring
  const numberAnimation = useSpring({
    from: { number: 0 },
    to: { number: 12789 },
    config: { duration: 2000 }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => setView('widget-experiments')}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux Widgets Basiques
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">
              🚀 Advanced Widget Library
            </h1>
            <p className="text-zinc-500">
              Recharts • Tremor • Framer Motion • React Spring
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All', icon: '🎨' },
              { id: 'recharts', label: 'Recharts', icon: '📊' },
              { id: 'tremor', label: 'Tremor', icon: '💎' },
              { id: 'animations', label: 'Animations', icon: '✨' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveLib(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeLib === tab.id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1. Recharts - Line Chart */}
          {(activeLib === 'all' || activeLib === 'recharts') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 col-span-1 md:col-span-2"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-200">Revenue Trend</h3>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">Recharts</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="name" stroke="#a1a1aa" />
                  <YAxis stroke="#a1a1aa" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pv"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ fill: '#ec4899', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* 2. Recharts - Area Chart */}
          {(activeLib === 'all' || activeLib === 'recharts') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-200">Growth</h3>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">Recharts</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="name" stroke="#a1a1aa" />
                  <YAxis stroke="#a1a1aa" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* 3. Recharts - Pie Chart */}
          {(activeLib === 'all' || activeLib === 'recharts') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-200">Tasks by Category</h3>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">Recharts</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* 4. Recharts - Bar Chart */}
          {(activeLib === 'all' || activeLib === 'recharts') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 col-span-1 md:col-span-2"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-200">Monthly Comparison</h3>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">Recharts</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="name" stroke="#a1a1aa" />
                  <YAxis stroke="#a1a1aa" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pv" fill="#ec4899" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* 5. Recharts - Radar Chart */}
          {(activeLib === 'all' || activeLib === 'recharts') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-200">Performance Radar</h3>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">Recharts</span>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#3f3f46" />
                  <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" />
                  <PolarRadiusAxis stroke="#a1a1aa" />
                  <Radar
                    name="This Week"
                    dataKey="A"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Last Week"
                    dataKey="B"
                    stroke="#ec4899"
                    fill="#ec4899"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* 6. Tremor - KPI Card */}
          {(activeLib === 'all' || activeLib === 'tremor') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-zinc-900 border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <Text className="text-zinc-400">Total Revenue</Text>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">Tremor</span>
                </div>
                <Metric className="text-white">$45,231</Metric>
                <Flex className="mt-4">
                  <Text className="text-zinc-500">32% of annual target</Text>
                  <BadgeDelta deltaType="increase">+12.3%</BadgeDelta>
                </Flex>
                <ProgressBar value={32} color="indigo" className="mt-2" />
              </Card>
            </motion.div>
          )}

          {/* 7. Tremor - Multiple KPIs */}
          {(activeLib === 'all' || activeLib === 'tremor') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="col-span-1 md:col-span-2"
            >
              <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-zinc-200">Key Metrics</h3>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">Tremor</span>
                </div>
                <Grid numItems={1} numItemsSm={2} numItemsMd={4} className="gap-4">
                  <Card className="bg-zinc-800/50 border-zinc-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      <Text className="text-zinc-400">Active Users</Text>
                    </div>
                    <Metric className="text-white">2,420</Metric>
                    <BadgeDelta deltaType="increase" className="mt-2">+5.4%</BadgeDelta>
                  </Card>

                  <Card className="bg-zinc-800/50 border-zinc-700">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingCart className="w-4 h-4 text-emerald-400" />
                      <Text className="text-zinc-400">Orders</Text>
                    </div>
                    <Metric className="text-white">1,892</Metric>
                    <BadgeDelta deltaType="increase" className="mt-2">+12.1%</BadgeDelta>
                  </Card>

                  <Card className="bg-zinc-800/50 border-zinc-700">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      <Text className="text-zinc-400">Revenue</Text>
                    </div>
                    <Metric className="text-white">$28.5k</Metric>
                    <BadgeDelta deltaType="increase" className="mt-2">+8.3%</BadgeDelta>
                  </Card>

                  <Card className="bg-zinc-800/50 border-zinc-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <Text className="text-zinc-400">New Users</Text>
                    </div>
                    <Metric className="text-white">384</Metric>
                    <BadgeDelta deltaType="decrease" className="mt-2">-2.1%</BadgeDelta>
                  </Card>
                </Grid>
              </div>
            </motion.div>
          )}

          {/* 8. Framer Motion - Animated Card */}
          {(activeLib === 'all' || activeLib === 'animations') && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02, rotate: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-6 border border-indigo-500/20"
            >
              <div className="flex items-center justify-between mb-4">
                <Zap className="w-8 h-8 text-white" />
                <span className="text-xs text-white/70 bg-white/20 px-2 py-1 rounded">Framer Motion</span>
              </div>
              <h3 className="text-sm text-white/80 mb-1">Animated Widget</h3>
              <p className="text-3xl font-bold text-white mb-2">Hover Me!</p>
              <p className="text-sm text-white/70">
                Spring animation with scale & rotate on hover
              </p>
            </motion.div>
          )}

          {/* 9. React Spring - Number Counter */}
          {(activeLib === 'all' || activeLib === 'animations') && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800"
            >
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">React Spring</span>
              </div>
              <h3 className="text-sm text-zinc-400 mb-2">Animated Counter</h3>
              <animated.div className="text-4xl font-bold text-white">
                {numberAnimation.number.to(n => `$${Math.floor(n).toLocaleString()}`)}
              </animated.div>
              <p className="text-sm text-zinc-500 mt-2">
                Physics-based animation
              </p>
            </motion.div>
          )}

          {/* 10. Framer Motion - Staggered List */}
          {(activeLib === 'all' || activeLib === 'animations') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-200">Staggered Animation</h3>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">Framer Motion</span>
              </div>
              <div className="space-y-2">
                {['Task 1', 'Task 2', 'Task 3', 'Task 4'].map((task, i) => (
                  <motion.div
                    key={task}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-zinc-800/50 rounded-lg p-3 text-zinc-300"
                  >
                    {task}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

        </div>

        {/* Info Footer */}
        <div className="mt-12 text-center">
          <p className="text-zinc-500 text-sm">
            🚀 <strong className="text-zinc-400">10 widgets avancés</strong> utilisant des bibliothèques professionnelles
          </p>
          <p className="text-zinc-600 text-xs mt-2">
            Recharts • Tremor • Framer Motion • React Spring
          </p>
        </div>
      </div>
    </div>
  )
}


