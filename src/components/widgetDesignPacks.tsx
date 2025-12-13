import { CheckCircle2, AlertCircle, Zap, Clock, Calendar, Heart, TrendingUp, BookOpen, Flame, GraduationCap, Timer, Play, Pause, Library, Target, Sparkles, MessageSquare, Activity } from 'lucide-react'
import {
  LineChart as ReLineChart,
  Line,
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
  Radar
} from 'recharts'
import { Card, Text, Metric, Grid, BadgeDelta, ProgressBar, Flex } from '@tremor/react'
import { motion } from 'framer-motion'

// Données démo
export const chartData = [
  { date: 'Jan', revenue: 4000, profit: 2400, users: 240 },
  { date: 'Feb', revenue: 3000, profit: 1398, users: 139 },
  { date: 'Mar', revenue: 2000, profit: 9800, users: 980 },
  { date: 'Apr', revenue: 2780, profit: 3908, users: 390 },
  { date: 'May', revenue: 1890, profit: 4800, users: 480 },
  { date: 'Jun', revenue: 2390, profit: 3800, users: 380 },
  { date: 'Jul', revenue: 3490, profit: 4300, users: 430 }
]

export const taskData = [
  { name: 'Dev', value: 400, color: '#6366f1' },
  { name: 'Design', value: 300, color: '#8b5cf6' },
  { name: 'Marketing', value: 200, color: '#ec4899' },
  { name: 'Sales', value: 278, color: '#f59e0b' }
]

export type LibraryId = 'recharts' | 'tremor' | 'framer' | 'native' | 'react-spring'
export type CategoryId = 'all' | 'tasks' | 'calendar' | 'journal' | 'pomodoro' | 'habits' | 'health' | 'learning' | 'library' | 'ai'

export interface DesignPack {
  id: string
  title: string
  category: CategoryId
  description: string
  examples: Array<{
    id: string
    label: string
    library: LibraryId
    tag: string
    content: React.ReactNode
  }>
}

// Note: Ce fichier contient TOUTES les variations (6-8 par widget)
// Il sera importé par WidgetShowcase.tsx

export const designPacks: DesignPack[] = [
  // TÂCHES - 8 variations
  {
    id: 'tasks',
    title: 'Tâches',
    category: 'tasks',
    description: 'Explore 8 designs différents',
    examples: [
      {
        id: 'tasks-1',
        label: '1. Command Center',
        library: 'native',
        tag: 'Priorités par blocs colorés',
        content: (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div className="text-2xl font-bold text-white">18</div>
              <div className="text-[10px] text-emerald-400/80 uppercase">TÂCHES</div>
            </div>
            <div className="p-2 rounded-lg bg-rose-500/10 border-l-2 border-rose-500">
              <div className="text-[10px] font-bold text-rose-400 mb-1">2 URGENT</div>
              <div className="text-xs text-rose-200">• Fix prod bug</div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 border-l-2 border-emerald-500">
              <div className="text-[10px] font-bold text-emerald-400 mb-1">2 QUICK WIN</div>
              <div className="text-xs text-emerald-200">• Update status</div>
            </div>
          </div>
        )
      },
      {
        id: 'tasks-2',
        label: '2. Minimaliste',
        library: 'native',
        tag: 'Ultra compact, liste simple',
        content: (
          <div className="space-y-2">
            <div className="text-4xl font-bold text-white text-center mb-3">18</div>
            {['Fix prod bug', 'Préparer démo', 'Code review', 'Update docs'].map((task, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded">
                <div className="w-3 h-3 rounded border-2 border-zinc-600" />
                <span className="text-xs text-zinc-300 flex-1">{task}</span>
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'tasks-3',
        label: '3. Dashboard Cards',
        library: 'tremor',
        tag: 'Grandes cartes avec métriques',
        content: (
          <Grid numItems={2} className="gap-2">
            {[
              { title: 'Done', metric: '18', color: 'emerald', icon: '✓' },
              { title: 'In Progress', metric: '7', color: 'indigo', icon: '→' },
              { title: 'Urgent', metric: '2', color: 'rose', icon: '!' },
              { title: 'Blocked', metric: '1', color: 'amber', icon: '⚠' }
            ].map(card => (
              <Card key={card.title} decoration="left" decorationColor={card.color as any} className="bg-zinc-900/60 border-zinc-800">
                <div className="text-2xl mb-1">{card.icon}</div>
                <Metric className="text-white">{card.metric}</Metric>
                <Text className="text-zinc-400 text-xs">{card.title}</Text>
              </Card>
            ))}
          </Grid>
        )
      },
      {
        id: 'tasks-4',
        label: '4. Kanban Mini',
        library: 'native',
        tag: 'Colonnes Todo/Doing/Done',
        content: (
          <div className="flex gap-2">
            {[
              { label: 'Todo', count: 8, color: 'bg-zinc-700' },
              { label: 'Doing', count: 7, color: 'bg-indigo-500' },
              { label: 'Done', count: 18, color: 'bg-emerald-500' }
            ].map(col => (
              <div key={col.label} className="flex-1">
                <div className="text-[9px] text-zinc-500 uppercase mb-1">{col.label}</div>
                <div className={`${col.color} rounded-lg p-3 text-center`}>
                  <div className="text-2xl font-bold text-white">{col.count}</div>
                </div>
                <div className="mt-1 space-y-1">
                  {col.count > 0 && [1,2].map(i => (
                    <div key={i} className="h-1 bg-white/20 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'tasks-5',
        label: '5. Progress Rings',
        library: 'native',
        tag: 'Cercles de progression',
        content: (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">18 / 25</div>
              <div className="text-xs text-zinc-500">tâches complétées</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Urgent', value: 80, color: 'text-rose-400' },
                { label: 'High', value: 60, color: 'text-amber-400' },
                { label: 'Normal', value: 45, color: 'text-emerald-400' }
              ].map(item => (
                <div key={item.label} className="text-center">
                  <div className={`text-2xl font-bold ${item.color}`}>{item.value}%</div>
                  <div className="text-[9px] text-zinc-600">{item.label}</div>
                  <div className="h-1 bg-white/10 rounded-full mt-1">
                    <div className={`h-full ${item.color.replace('text-', 'bg-')} rounded-full`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'tasks-6',
        label: '6. Timeline',
        library: 'native',
        tag: 'Vue chronologique',
        content: (
          <div className="space-y-2">
            {[
              { time: '09:00', task: 'Fix prod bug', status: 'done', color: 'bg-emerald-500' },
              { time: '11:00', task: 'Code review', status: 'active', color: 'bg-indigo-500' },
              { time: '14:00', task: 'Préparer démo', status: 'pending', color: 'bg-zinc-600' },
              { time: '16:00', task: 'Update docs', status: 'pending', color: 'bg-zinc-600' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-xs text-zinc-500 w-12">{item.time}</span>
                <span className={`text-xs flex-1 ${item.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                  {item.task}
                </span>
                {item.status === 'active' && <div className="text-[9px] text-indigo-400 px-1.5 py-0.5 bg-indigo-500/20 rounded">Now</div>}
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'tasks-7',
        label: '7. Grid Stats',
        library: 'tremor',
        tag: 'Métriques en grille',
        content: (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Total', value: '25', icon: CheckCircle2, color: 'text-zinc-400' },
              { label: 'Done', value: '18', icon: CheckCircle2, color: 'text-emerald-400' },
              { label: 'In Progress', value: '7', icon: Clock, color: 'text-indigo-400' },
              { label: 'Urgent', value: '2', icon: AlertCircle, color: 'text-rose-400' }
            ].map(stat => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 text-center">
                  <Icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-[9px] text-zinc-500">{stat.label}</div>
                </div>
              )
            })}
          </div>
        )
      },
      {
        id: 'tasks-8',
        label: '8. Graph + Liste',
        library: 'recharts',
        tag: 'Mixte donut + tâches',
        content: (
          <div className="space-y-2">
            <ResponsiveContainer width="100%" height={120}>
              <RePieChart>
                <Pie data={taskData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4}>
                  {taskData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </RePieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1">
              {taskData.map(item => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-zinc-400">{item.name}</span>
                  <span className="text-zinc-600">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }
    ]
  },

  // CALENDRIER - 7 variations
  {
    id: 'calendar',
    title: 'Calendrier',
    category: 'calendar',
    description: 'Explore 7 designs différents',
    examples: [
      {
        id: 'cal-1',
        label: '1. Mini 7 jours',
        library: 'native',
        tag: 'Date + 7 jours + Événements',
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-cyan-400" />
              <div className="text-3xl font-bold text-white">{new Date().getDate()}</div>
              <div className="text-[10px] text-cyan-400/80 uppercase">
                {new Date().toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
              </div>
            </div>
            <div className="flex gap-1 justify-between">
              {['L','M','M','J','V','S','D'].map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="text-[9px] text-zinc-600 mb-1">{day}</div>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                    i === 0 ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white' : 'bg-white/10 text-zinc-300'
                  }`}>
                    {11 + i}
                  </div>
                  {i !== 0 && i < 3 && <div className="w-1 h-1 rounded-full bg-blue-400 mt-1" />}
                </div>
              ))}
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1">À venir</div>
              {[
                { title: 'Team standup', time: '09:00' },
                { title: 'Client call', time: '14:00' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-zinc-300">{item.title}</div>
                    <div className="text-[10px] text-zinc-500">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'cal-2',
        label: '2. Liste compacte',
        library: 'native',
        tag: 'Événements du jour',
        content: (
          <div className="space-y-2">
            <div className="text-center mb-3">
              <div className="text-4xl font-bold text-white">{new Date().getDate()}</div>
              <div className="text-xs text-zinc-500">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', month: 'long' })}
              </div>
            </div>
            {[
              { time: '09:00', title: 'Standup', color: 'bg-indigo-500' },
              { time: '11:00', title: 'Deep work', color: 'bg-emerald-500' },
              { time: '14:00', title: 'Client call', color: 'bg-amber-500' },
              { time: '16:00', title: 'Code review', color: 'bg-purple-500' }
            ].map((event, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-1 h-8 ${event.color} rounded`} />
                <div className="flex-1">
                  <div className="text-xs text-zinc-300">{event.title}</div>
                  <div className="text-[10px] text-zinc-600">{event.time}</div>
                </div>
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'cal-3',
        label: '3. Timeline jour',
        library: 'native',
        tag: 'Vue horaire',
        content: (
          <div className="space-y-1">
            {[
              { hour: '09', event: 'Standup', active: false },
              { hour: '10', event: 'Deep work', active: true },
              { hour: '11', event: null, active: false },
              { hour: '12', event: 'Lunch', active: false },
              { hour: '14', event: 'Meeting', active: false }
            ].map((slot, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="text-xs text-zinc-600 w-8">{slot.hour}h</div>
                {slot.event ? (
                  <div className={`flex-1 px-2 py-1.5 rounded text-xs ${
                    slot.active ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/5 text-zinc-400'
                  }`}>
                    {slot.event}
                    {slot.active && <span className="ml-2 text-[9px]">→</span>}
                  </div>
                ) : (
                  <div className="flex-1 border-t border-zinc-800" />
                )}
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'cal-4',
        label: '4. KPI Cards',
        library: 'tremor',
        tag: 'Stats événements',
        content: (
          <Grid numItems={3} className="gap-2">
            {[
              { title: 'Events', metric: '24', delta: '+3' },
              { title: 'Recurring', metric: '6', delta: '+1' },
              { title: 'Meetings', metric: '4', delta: '0' }
            ].map(card => (
              <Card key={card.title} decoration="top" decorationColor="cyan" className="bg-zinc-900/60 border-zinc-800">
                <Text className="text-zinc-400 text-xs">{card.title}</Text>
                <Metric className="text-white">{card.metric}</Metric>
                <Text className="text-zinc-500 text-xs mt-1">{card.delta}</Text>
              </Card>
            ))}
          </Grid>
        )
      },
      {
        id: 'cal-5',
        label: '5. Mini mois',
        library: 'native',
        tag: 'Vue mensuelle compacte',
        content: (
          <div className="space-y-2">
            <div className="text-center text-sm font-semibold text-white mb-2">
              {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['L','M','M','J','V','S','D'].map((day, i) => (
                <div key={i} className="text-[8px] text-zinc-600 text-center">{day}</div>
              ))}
              {Array.from({ length: 28 }, (_, i) => (
                <div key={i} className={`text-[10px] text-center p-1 rounded ${
                  i === 10 ? 'bg-cyan-500 text-white font-bold' : 
                  [5, 12, 18].includes(i) ? 'bg-white/10 text-zinc-300' : 
                  'text-zinc-600'
                }`}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'cal-6',
        label: '6. Heatmap semaine',
        library: 'native',
        tag: 'Charge par jour',
        content: (
          <div className="space-y-2">
            <div className="text-xs text-zinc-500 mb-2">Charge hebdomadaire</div>
            <div className="flex gap-1">
              {[3, 5, 8, 6, 4, 2, 1].map((count, i) => (
                <div key={i} className="flex-1">
                  <div className={`rounded-t h-16 ${
                    count > 6 ? 'bg-rose-500' : 
                    count > 4 ? 'bg-amber-500' : 
                    count > 2 ? 'bg-emerald-500' : 
                    'bg-zinc-700'
                  }`} style={{ height: `${(count / 8) * 64}px` }} />
                  <div className="text-[9px] text-zinc-600 text-center mt-1">
                    {['L','M','M','J','V','S','D'][i]}
                  </div>
                  <div className="text-[10px] text-zinc-500 text-center">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'cal-7',
        label: '7. Graph charge',
        library: 'recharts',
        tag: 'Courbe événements',
        content: (
          <ResponsiveContainer width="100%" height={140}>
            <ReLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#71717a" style={{ fontSize: '11px' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }} />
            </ReLineChart>
          </ResponsiveContainer>
        )
      }
      ]
  },

  // SANTÉ - 7 variations
  {
    id: 'health',
    title: 'Santé',
    category: 'health',
    description: 'Explore 7 designs différents',
    examples: [
      {
        id: 'health-1',
        label: '1. Poids + Sparkline',
        library: 'native',
        tag: 'Poids actuel + tendance 7j',
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              <div className="text-2xl font-bold text-white">72.5</div>
              <div className="text-[10px] text-zinc-500 uppercase">KG</div>
              <div className="ml-auto flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-400">-1.2kg</span>
              </div>
            </div>
            <div className="h-12 flex items-end gap-1">
              {[74, 73.8, 73.5, 73.2, 73, 72.8, 72.5].map((val, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-rose-500/80 to-rose-400/40 rounded-t" 
                     style={{ height: `${((val - 70) / 5) * 100}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
              <div>
                <div className="text-[9px] text-zinc-600">BMI</div>
                <div className="text-sm font-bold text-white">23.1</div>
              </div>
              <div>
                <div className="text-[9px] text-zinc-600">Calories</div>
                <div className="text-sm font-bold text-white">1850</div>
              </div>
              <div>
                <div className="text-[9px] text-zinc-600">H2O</div>
                <div className="text-sm font-bold text-white">2.1L</div>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'health-2',
        label: '2. Dashboard KPIs',
        library: 'tremor',
        tag: 'Métriques principales',
        content: (
          <Grid numItems={2} className="gap-2">
            {[
              { title: 'Poids', metric: '72.5 kg', delta: '-1.2', color: 'rose' },
              { title: 'BMI', metric: '23.1', delta: '-0.3', color: 'emerald' },
              { title: 'Calories', metric: '1850', delta: '+150', color: 'amber' },
              { title: 'Eau', metric: '2.1 L', delta: '+0.5', color: 'cyan' }
            ].map(card => (
              <Card key={card.title} decoration="left" decorationColor={card.color as any} className="bg-zinc-900/60 border-zinc-800">
                <Text className="text-zinc-400 text-xs">{card.title}</Text>
                <Metric className="text-white">{card.metric}</Metric>
                <BadgeDelta deltaType={card.delta.startsWith('-') ? 'decrease' : 'increase'} size="xs" className="mt-1">
                  {card.delta}
                </BadgeDelta>
              </Card>
            ))}
          </Grid>
        )
      },
      {
        id: 'health-3',
        label: '3. Courbe poids',
        library: 'recharts',
        tag: 'Évolution mensuelle',
        content: (
          <ResponsiveContainer width="100%" height={160}>
            <ReLineChart data={[
              { date: 'S1', weight: 74 },
              { date: 'S2', weight: 73.8 },
              { date: 'S3', weight: 73.5 },
              { date: 'S4', weight: 73.2 },
              { date: 'S5', weight: 73 },
              { date: 'S6', weight: 72.8 },
              { date: 'S7', weight: 72.5 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#71717a" style={{ fontSize: '10px' }} />
              <YAxis domain={[72, 75]} stroke="#71717a" style={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="weight" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, fill: '#f43f5e' }} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }} />
            </ReLineChart>
          </ResponsiveContainer>
        )
      },
      {
        id: 'health-4',
        label: '4. Cercles progress',
        library: 'native',
        tag: 'Objectifs quotidiens',
        content: (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Calories', value: 85, color: 'text-amber-400', max: '2200' },
              { label: 'Eau', value: 70, color: 'text-cyan-400', max: '3L' },
              { label: 'Steps', value: 92, color: 'text-emerald-400', max: '10k' }
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className={`text-3xl font-bold ${item.color}`}>{item.value}%</div>
                <div className="text-[9px] text-zinc-600 mb-1">{item.label}</div>
                <div className="h-1.5 bg-white/10 rounded-full">
                  <div className={`h-full ${item.color.replace('text-', 'bg-')} rounded-full`} 
                       style={{ width: `${item.value}%` }} />
                </div>
                <div className="text-[8px] text-zinc-700 mt-0.5">{item.max}</div>
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'health-5',
        label: '5. Radar santé',
        library: 'recharts',
        tag: 'Vue multidimensionnelle',
        content: (
          <ResponsiveContainer width="100%" height={150}>
            <RadarChart data={[
              { metric: 'Poids', value: 85 },
              { metric: 'BMI', value: 90 },
              { metric: 'Calories', value: 75 },
              { metric: 'Eau', value: 70 },
              { metric: 'Steps', value: 92 }
            ]}>
              <PolarGrid stroke="#3f3f46" />
              <PolarAngleAxis dataKey="metric" stroke="#71717a" style={{ fontSize: '10px' }} />
              <Radar dataKey="value" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        )
      },
      {
        id: 'health-6',
        label: '6. Timeline activité',
        library: 'native',
        tag: 'Log journalier',
        content: (
          <div className="space-y-2">
            {[
              { time: '08:00', activity: 'Petit déjeuner', calories: 450, icon: '🍳' },
              { time: '10:00', activity: 'Course', calories: -350, icon: '🏃' },
              { time: '13:00', activity: 'Déjeuner', calories: 650, icon: '🥗' },
              { time: '16:00', activity: 'Eau 500ml', calories: 0, icon: '💧' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                <div className="text-xl">{item.icon}</div>
                <div className="flex-1">
                  <div className="text-xs text-zinc-300">{item.activity}</div>
                  <div className="text-[10px] text-zinc-600">{item.time}</div>
                </div>
                <div className={`text-xs font-semibold ${
                  item.calories > 0 ? 'text-amber-400' : item.calories < 0 ? 'text-emerald-400' : 'text-zinc-500'
                }`}>
                  {item.calories > 0 ? '+' : ''}{item.calories}
                </div>
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'health-7',
        label: '7. Minimaliste',
        library: 'native',
        tag: 'Ultra compact',
        content: (
          <div className="text-center space-y-3">
            <div className="text-5xl font-bold text-white">72.5</div>
            <div className="text-sm text-zinc-500">kg</div>
            <div className="flex justify-center gap-4 pt-2 border-t border-zinc-800">
              <div>
                <div className="text-xs text-zinc-600">BMI</div>
                <div className="text-lg font-bold text-white">23.1</div>
              </div>
              <div>
                <div className="text-xs text-zinc-600">Δ</div>
                <div className="text-lg font-bold text-emerald-400">-1.2</div>
              </div>
            </div>
          </div>
        )
      }
    ]
  },

  // POMODORO - 7 variations
  {
    id: 'pomodoro',
    title: 'Pomodoro',
    category: 'pomodoro',
    description: 'Explore 7 designs différents',
    examples: [
      {
        id: 'pomo-1',
        label: '1. Timer classique',
        library: 'native',
        tag: 'Timer + controls + stats',
        content: (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-white tabular-nums">25:00</div>
              <div className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold mt-1">FOCUS MODE</div>
            </div>
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-500 to-orange-500"
                initial={{ width: '75%' }}
                style={{ width: '75%' }}
              />
            </div>
            <div className="flex justify-center gap-2">
              <button className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-600 transition">
                <Play className="w-4 h-4 text-white" />
              </button>
              <button className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition">
                <Pause className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
              <div className="text-center">
                <div className="text-xs text-zinc-600">Sessions</div>
                <div className="text-lg font-bold text-white">4</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-zinc-600">Minutes</div>
                <div className="text-lg font-bold text-white">100</div>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'pomo-2',
        label: '2. Cercle progress',
        library: 'native',
        tag: 'Timer circulaire',
        content: (
          <div className="space-y-3">
            <div className="relative mx-auto w-32 h-32">
              <svg className="transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#27272a" strokeWidth="8" />
                <circle cx="60" cy="60" r="54" fill="none" stroke="url(#gradient)" strokeWidth="8" 
                        strokeDasharray="339.29" strokeDashoffset="84.82" strokeLinecap="round" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-white">25:00</div>
                <div className="text-[9px] text-zinc-500">75% complete</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-zinc-500 mb-2">Focus: Write code</div>
              <div className="flex justify-center gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs">Start</button>
                <button className="px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-xs">Reset</button>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'pomo-3',
        label: '3. Minimaliste',
        library: 'native',
        tag: 'Ultra simple',
        content: (
          <div className="space-y-4 text-center">
            <div className="text-6xl font-bold text-white tabular-nums">25</div>
            <div className="text-xs text-zinc-500">minutes restantes</div>
            <div className="h-1 bg-white/10 rounded-full">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: '75%' }} />
            </div>
            <div className="flex gap-2 justify-center">
              {[1,2,3,4].map((i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i <= 2 ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'pomo-4',
        label: '4. Dashboard stats',
        library: 'tremor',
        tag: 'KPIs journaliers',
        content: (
          <Grid numItems={2} className="gap-2">
            {[
              { title: 'Sessions', metric: '4', color: 'rose' },
              { title: 'Minutes', metric: '100', color: 'orange' },
              { title: 'Breaks', metric: '3', color: 'emerald' },
              { title: 'Streak', metric: '7d', color: 'indigo' }
            ].map(card => (
              <Card key={card.title} decoration="top" decorationColor={card.color as any} className="bg-zinc-900/60 border-zinc-800">
                <Text className="text-zinc-400 text-xs">{card.title}</Text>
                <Metric className="text-white">{card.metric}</Metric>
              </Card>
            ))}
          </Grid>
        )
      },
      {
        id: 'pomo-5',
        label: '5. Timeline sessions',
        library: 'native',
        tag: 'Historique du jour',
        content: (
          <div className="space-y-2">
            {[
              { time: '09:00', type: 'Focus', duration: '25min', status: 'done' },
              { time: '09:30', type: 'Break', duration: '5min', status: 'done' },
              { time: '09:40', type: 'Focus', duration: '25min', status: 'active' },
              { time: '10:10', type: 'Break', duration: '5min', status: 'pending' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  item.status === 'done' ? 'bg-emerald-500' :
                  item.status === 'active' ? 'bg-rose-500' : 'bg-zinc-700'
                }`} />
                <span className="text-xs text-zinc-500 w-12">{item.time}</span>
                <span className={`text-xs flex-1 ${
                  item.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-300'
                }`}>
                  {item.type} ({item.duration})
                </span>
                {item.status === 'active' && (
                  <div className="text-[9px] text-rose-400 px-1.5 py-0.5 bg-rose-500/20 rounded">Now</div>
                )}
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'pomo-6',
        label: '6. Graph barres',
        library: 'recharts',
        tag: 'Sessions par jour',
        content: (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={[
              { day: 'L', count: 3 },
              { day: 'M', count: 5 },
              { day: 'M', count: 4 },
              { day: 'J', count: 6 },
              { day: 'V', count: 4 },
              { day: 'S', count: 2 },
              { day: 'D', count: 1 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" stroke="#71717a" style={{ fontSize: '10px' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '10px' }} />
              <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }} />
            </BarChart>
          </ResponsiveContainer>
        )
      },
      {
        id: 'pomo-7',
        label: '7. Compact focus',
        library: 'native',
        tag: 'Focus task + timer',
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-rose-400" />
              <div className="text-2xl font-bold text-white tabular-nums">25:00</div>
            </div>
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <div className="text-xs text-rose-200 mb-1">Current Focus</div>
              <div className="text-sm font-semibold text-white">Write technical documentation</div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold">
                Start
              </button>
              <button className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Target className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>
        )
      }
    ]
  },

  // HABITUDES - 6 variations
  {
    id: 'habits',
    title: 'Habitudes',
    category: 'habits',
    description: 'Explore 6 designs différents',
    examples: [
      {
        id: 'habits-1',
        label: '1. Streak + Liste',
        library: 'native',
        tag: 'Streak + habitudes du jour',
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-400" />
              <div className="text-3xl font-bold text-white">7</div>
              <div className="text-[10px] text-orange-400/80 uppercase">JOURS</div>
            </div>
            <div className="flex gap-1">
              {[1,1,1,1,1,1,1].map((done, i) => (
                <div key={i} className={`flex-1 h-8 rounded ${done ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
              ))}
            </div>
            {[
              { name: 'Méditation', done: true },
              { name: 'Exercice', done: true },
              { name: 'Lecture', done: false },
              { name: 'Journaling', done: false }
            ].map((habit, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  habit.done ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                }`}>
                  {habit.done && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={`text-sm flex-1 ${habit.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                  {habit.name}
                </span>
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'habits-2',
        label: '2. Heatmap',
        library: 'native',
        tag: 'Calendrier de tracking',
        content: (
          <div className="space-y-2">
            <div className="text-xs text-zinc-500 mb-2">30 derniers jours</div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 28 }, (_, i) => {
                const done = Math.random() > 0.3
                return (
                  <div key={i} className={`aspect-square rounded ${
                    done ? 'bg-emerald-500' : 'bg-zinc-800'
                  }`} />
                )
              })}
            </div>
            <div className="flex justify-between text-[9px] text-zinc-600 mt-2">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-zinc-800 rounded" />
                <div className="w-3 h-3 bg-emerald-800 rounded" />
                <div className="w-3 h-3 bg-emerald-600 rounded" />
                <div className="w-3 h-3 bg-emerald-500 rounded" />
              </div>
              <span>More</span>
            </div>
          </div>
        )
      },
      {
        id: 'habits-3',
        label: '3. Progress bars',
        library: 'native',
        tag: 'Progression par habitude',
        content: (
          <div className="space-y-3">
            {[
              { name: 'Méditation', progress: 85, streak: 7, color: 'bg-purple-500' },
              { name: 'Exercice', progress: 70, streak: 5, color: 'bg-emerald-500' },
              { name: 'Lecture', progress: 60, streak: 4, color: 'bg-indigo-500' },
              { name: 'Journaling', progress: 40, streak: 2, color: 'bg-amber-500' }
            ].map((habit, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-300">{habit.name}</span>
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span className="text-xs text-zinc-500">{habit.streak}d</span>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${habit.color}`} style={{ width: `${habit.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'habits-4',
        label: '4. KPIs Tremor',
        library: 'tremor',
        tag: 'Métriques globales',
        content: (
          <Grid numItems={2} className="gap-2">
            {[
              { title: 'Streak', metric: '7d', color: 'orange' },
              { title: 'Done Today', metric: '3/4', color: 'emerald' },
              { title: 'This Week', metric: '18/28', color: 'indigo' },
              { title: 'Success', metric: '85%', color: 'purple' }
            ].map(card => (
              <Card key={card.title} decoration="top" decorationColor={card.color as any} className="bg-zinc-900/60 border-zinc-800">
                <Text className="text-zinc-400 text-xs">{card.title}</Text>
                <Metric className="text-white">{card.metric}</Metric>
              </Card>
            ))}
          </Grid>
        )
      },
      {
        id: 'habits-5',
        label: '5. Cercles',
        library: 'native',
        tag: 'Vue circulaire',
        content: (
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Méditation', progress: 85, emoji: '🧘' },
              { name: 'Exercice', progress: 70, emoji: '💪' },
              { name: 'Lecture', progress: 60, emoji: '📚' },
              { name: 'Journal', progress: 40, emoji: '✍️' }
            ].map((habit, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl mb-1">{habit.emoji}</div>
                <div className="text-2xl font-bold text-white">{habit.progress}%</div>
                <div className="text-[9px] text-zinc-600">{habit.name}</div>
                <div className="h-1 bg-white/10 rounded-full mt-1">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${habit.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'habits-6',
        label: '6. Graph tendance',
        library: 'recharts',
        tag: 'Évolution hebdomadaire',
        content: (
          <ResponsiveContainer width="100%" height={140}>
            <ReLineChart data={[
              { day: 'L', count: 3 },
              { day: 'M', count: 4 },
              { day: 'M', count: 3 },
              { day: 'J', count: 4 },
              { day: 'V', count: 4 },
              { day: 'S', count: 3 },
              { day: 'D', count: 2 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" stroke="#71717a" style={{ fontSize: '10px' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }} />
            </ReLineChart>
          </ResponsiveContainer>
        )
      }
    ]
  }

  // JOURNAL - 6 variations
  ,{
    id: 'journal',
    title: 'Journal',
    category: 'journal',
    description: 'Explore 6 designs différents',
    examples: [
      {
        id: 'journal-1',
        label: '1. Entrée du jour',
        library: 'native',
        tag: 'Objectif + Réflexion + Mood',
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <div className="text-[10px] text-amber-400/80 uppercase">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 border-l-2 border-amber-500">
              <div className="text-[9px] text-amber-400 font-bold mb-1">OBJECTIF</div>
              <div className="text-xs text-amber-200">Finir le widget lab</div>
            </div>
            <div className="p-2 rounded-lg bg-white/5">
              <div className="text-[9px] text-zinc-500 font-bold mb-1">RÉFLEXION</div>
              <div className="text-xs text-zinc-400 line-clamp-2">
                Bonne journée productive, j'ai bien avancé sur le projet...
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[9px] text-zinc-600">Mood:</div>
              {['😊', '😐', '😔', '😄', '😴'].map((emoji, i) => (
                <div key={i} className={`text-lg ${i === 0 ? 'opacity-100 scale-110' : 'opacity-30'}`}>
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'journal-2',
        label: '2. Timeline entrées',
        library: 'native',
        tag: 'Dernières entrées',
        content: (
          <div className="space-y-2">
            {[
              { date: 'Aujourd\'hui', mood: '😊', preview: 'Bonne journée productive...' },
              { date: 'Hier', mood: '😄', preview: 'Super meeting avec l\'équipe...' },
              { date: '9 Dec', mood: '😐', preview: 'Jour difficile mais j\'ai...' },
              { date: '8 Dec', mood: '😊', preview: 'Atteint mes objectifs...' }
            ].map((entry, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
                <div className="text-xl">{entry.mood}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-zinc-500">{entry.date}</div>
                  <div className="text-xs text-zinc-300 truncate">{entry.preview}</div>
                </div>
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'journal-3',
        label: '3. Stats mood',
        library: 'tremor',
        tag: 'Répartition émotions',
        content: (
          <div className="space-y-3">
            <div className="flex justify-around">
              {[
                { emoji: '😊', count: 12 },
                { emoji: '😄', count: 8 },
                { emoji: '😐', count: 5 },
                { emoji: '😔', count: 2 }
              ].map((mood, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl">{mood.emoji}</div>
                  <div className="text-sm font-bold text-white">{mood.count}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              {[
                { label: 'Happy', value: 45, color: 'bg-emerald-500' },
                { label: 'Neutral', value: 30, color: 'bg-zinc-500' },
                { label: 'Sad', value: 10, color: 'bg-rose-500' }
              ].map(bar => (
                <div key={bar.label}>
                  <div className="flex justify-between text-[9px] text-zinc-500 mb-0.5">
                    <span>{bar.label}</span>
                    <span>{bar.value}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${bar.color}`} style={{ width: `${bar.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'journal-4',
        label: '4. Streak + KPIs',
        library: 'native',
        tag: 'Métriques d\'écriture',
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-400" />
              <div className="text-3xl font-bold text-white">14</div>
              <div className="text-[10px] text-orange-400/80 uppercase">JOURS</div>
            </div>
            <Grid numItems={3} className="gap-2">
              {[
                { label: 'Entrées', value: '27' },
                { label: 'Mots', value: '1.2k' },
                { label: 'Ce mois', value: '12' }
              ].map(stat => (
                <div key={stat.label} className="text-center p-2 rounded-lg bg-white/5 border border-zinc-800">
                  <div className="text-lg font-bold text-white">{stat.value}</div>
                  <div className="text-[9px] text-zinc-600">{stat.label}</div>
                </div>
              ))}
            </Grid>
          </div>
        )
      },
      {
        id: 'journal-5',
        label: '5. Heatmap activité',
        library: 'native',
        tag: 'Calendrier d\'entrées',
        content: (
          <div className="space-y-2">
            <div className="text-xs text-zinc-500">Activité mensuelle</div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 28 }, (_, i) => {
                const hasEntry = Math.random() > 0.4
                return (
                  <div key={i} className={`aspect-square rounded ${
                    hasEntry ? 'bg-amber-500' : 'bg-zinc-800'
                  }`} />
                )
              })}
            </div>
          </div>
        )
      },
      {
        id: 'journal-6',
        label: '6. Compact card',
        library: 'native',
        tag: 'Vue minimale',
        content: (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-4xl mb-1">📝</div>
              <div className="text-2xl font-bold text-white">27</div>
              <div className="text-xs text-zinc-500">entrées ce mois</div>
            </div>
            <div className="flex gap-1">
              {[1,1,0,1,1,1,0].map((has, i) => (
                <div key={i} className={`flex-1 h-6 rounded ${has ? 'bg-amber-500' : 'bg-zinc-800'}`} />
              ))}
            </div>
          </div>
        )
      }
    ]
  },

  // APPRENTISSAGE - 6 variations
  {
    id: 'learning',
    title: 'Apprentissage',
    category: 'learning',
    description: 'Explore 6 designs différents',
    examples: [
      {
        id: 'learning-1',
        label: '1. Cours actifs',
        library: 'native',
        tag: 'Cours en cours + Stats',
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <div className="text-[10px] text-indigo-400/80 uppercase">APPRENTISSAGE</div>
            </div>
            {[
              { title: 'React Advanced', progress: 75, color: 'bg-indigo-500' },
              { title: 'TypeScript Pro', progress: 45, color: 'bg-purple-500' }
            ].map((course, i) => (
              <div key={i} className="p-2 rounded-lg bg-white/5">
                <div className="text-sm font-semibold text-white mb-1">{course.title}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${course.color}`} style={{ width: `${course.progress}%` }} />
                  </div>
                  <span className="text-xs text-zinc-500">{course.progress}%</span>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
              <div className="text-center">
                <div className="text-lg font-bold text-white">142</div>
                <div className="text-[9px] text-zinc-600">Messages</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">28</div>
                <div className="text-[9px] text-zinc-600">Flashcards</div>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'learning-2',
        label: '2. Progress cards',
        library: 'tremor',
        tag: 'Stats par catégorie',
        content: (
          <Grid numItems={2} className="gap-2">
            {[
              { title: 'Cours', metric: '3', color: 'indigo' },
              { title: 'Leçons', metric: '42', color: 'purple' },
              { title: 'Messages', metric: '142', color: 'cyan' },
              { title: 'Flashcards', metric: '28', color: 'emerald' }
            ].map(card => (
              <Card key={card.title} decoration="left" decorationColor={card.color as any} className="bg-zinc-900/60 border-zinc-800">
                <Text className="text-zinc-400 text-xs">{card.title}</Text>
                <Metric className="text-white">{card.metric}</Metric>
              </Card>
            ))}
          </Grid>
        )
      },
      {
        id: 'learning-3',
        label: '3. Timeline leçons',
        library: 'native',
        tag: 'Récentes + À venir',
        content: (
          <div className="space-y-2">
            <div className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Récent</div>
            {[
              { title: 'Hooks avancés', course: 'React', status: 'done' },
              { title: 'Generics', course: 'TypeScript', status: 'active' },
              { title: 'Context API', course: 'React', status: 'pending' }
            ].map((lesson, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                <div className={`w-2 h-2 rounded-full ${
                  lesson.status === 'done' ? 'bg-emerald-500' :
                  lesson.status === 'active' ? 'bg-indigo-500' : 'bg-zinc-700'
                }`} />
                <div className="flex-1">
                  <div className={`text-xs ${lesson.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                    {lesson.title}
                  </div>
                  <div className="text-[9px] text-zinc-600">{lesson.course}</div>
                </div>
                {lesson.status === 'active' && (
                  <Play className="w-3 h-3 text-indigo-400" />
                )}
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'learning-4',
        label: '4. Cercles progress',
        library: 'native',
        tag: 'Progression par cours',
        content: (
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: 'React', progress: 75, color: 'text-cyan-400' },
              { name: 'TS', progress: 45, color: 'text-indigo-400' },
              { name: 'Node', progress: 30, color: 'text-emerald-400' }
            ].map(course => (
              <div key={course.name} className="text-center">
                <div className={`text-3xl font-bold ${course.color}`}>{course.progress}%</div>
                <div className="text-[9px] text-zinc-600 mb-1">{course.name}</div>
                <div className="h-1 bg-white/10 rounded-full">
                  <div className={`h-full ${course.color.replace('text-', 'bg-')} rounded-full`} 
                       style={{ width: `${course.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'learning-5',
        label: '5. Flashcards',
        library: 'native',
        tag: 'Révision du jour',
        content: (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
              <div className="text-xs text-indigo-200 mb-2">Question du jour</div>
              <div className="text-sm font-semibold text-white">
                Qu'est-ce qu'un Hook en React ?
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-xs">
                Je sais
              </button>
              <button className="flex-1 py-2 rounded-lg bg-zinc-800 text-white text-xs">
                Réviser
              </button>
            </div>
            <div className="text-center text-xs text-zinc-500">
              28 cartes à réviser aujourd'hui
            </div>
          </div>
        )
      },
      {
        id: 'learning-6',
        label: '6. Graph activité',
        library: 'recharts',
        tag: 'Leçons par semaine',
        content: (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={[
              { day: 'L', count: 2 },
              { day: 'M', count: 3 },
              { day: 'M', count: 1 },
              { day: 'J', count: 4 },
              { day: 'V', count: 2 },
              { day: 'S', count: 1 },
              { day: 'D', count: 0 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" stroke="#71717a" style={{ fontSize: '10px' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '10px' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }} />
            </BarChart>
          </ResponsiveContainer>
        )
      }
    ]
  },

  // BIBLIOTHÈQUE - 6 variations
  {
    id: 'library',
    title: 'Bibliothèque',
    category: 'library',
    description: 'Explore 6 designs différents',
    examples: [
      {
        id: 'library-1',
        label: '1. En cours',
        library: 'native',
        tag: 'Lectures actuelles',
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Library className="w-5 h-5 text-purple-400" />
              <div className="text-[10px] text-purple-400/80 uppercase">BIBLIOTHÈQUE</div>
            </div>
            {[
              { title: 'Clean Code', progress: 65, pages: '195/300' },
              { title: 'Atomic Habits', progress: 30, pages: '90/300' }
            ].map((book, i) => (
              <div key={i} className="p-2 rounded-lg bg-white/5">
                <div className="text-sm font-semibold text-white mb-1">{book.title}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: `${book.progress}%` }} />
                  </div>
                  <span className="text-xs text-zinc-500">{book.pages}</span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-zinc-800 text-center">
              <div className="text-2xl font-bold text-white">12 / 24</div>
              <div className="text-xs text-zinc-500">Objectif annuel</div>
            </div>
          </div>
        )
      },
      {
        id: 'library-2',
        label: '2. KPIs lecture',
        library: 'tremor',
        tag: 'Stats globales',
        content: (
          <Grid numItems={2} className="gap-2">
            {[
              { title: 'En cours', metric: '2', color: 'purple' },
              { title: 'Terminés', metric: '12', color: 'emerald' },
              { title: 'Pages', metric: '3.2k', color: 'indigo' },
              { title: 'Objectif', metric: '50%', color: 'amber' }
            ].map(card => (
              <Card key={card.title} decoration="top" decorationColor={card.color as any} className="bg-zinc-900/60 border-zinc-800">
                <Text className="text-zinc-400 text-xs">{card.title}</Text>
                <Metric className="text-white">{card.metric}</Metric>
              </Card>
            ))}
          </Grid>
        )
      },
      {
        id: 'library-3',
        label: '3. Timeline récente',
        library: 'native',
        tag: 'Dernières lectures',
        content: (
          <div className="space-y-2">
            {[
              { title: 'Clean Code', status: 'reading', date: 'En cours' },
              { title: 'The Pragmatic Programmer', status: 'done', date: '5 Dec' },
              { title: 'Design Patterns', status: 'done', date: '28 Nov' },
              { title: 'Refactoring', status: 'done', date: '15 Nov' }
            ].map((book, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                <div className={`w-2 h-2 rounded-full ${
                  book.status === 'reading' ? 'bg-purple-500' : 'bg-emerald-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-zinc-300 truncate">{book.title}</div>
                  <div className="text-[10px] text-zinc-600">{book.date}</div>
                </div>
                {book.status === 'reading' && (
                  <BookOpen className="w-3 h-3 text-purple-400" />
                )}
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'library-4',
        label: '4. Progress annuel',
        library: 'native',
        tag: 'Objectif 2024',
        content: (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-5xl font-bold text-white">12</div>
              <div className="text-xs text-zinc-500 mb-2">livres lus en 2024</div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '50%' }} />
              </div>
              <div className="text-xs text-zinc-600 mt-1">50% de l'objectif (24 livres)</div>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className={`aspect-[3/4] rounded ${
                  i < 12 ? 'bg-purple-500' : 'bg-zinc-800'
                }`} />
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'library-5',
        label: '5. Catégories',
        library: 'native',
        tag: 'Par genre',
        content: (
          <div className="space-y-2">
            {[
              { category: 'Tech', count: 8, color: 'bg-indigo-500' },
              { category: 'Business', count: 3, color: 'bg-emerald-500' },
              { category: 'Fiction', count: 1, color: 'bg-purple-500' }
            ].map(cat => (
              <div key={cat.category}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">{cat.category}</span>
                  <span className="text-zinc-600">{cat.count}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color}`} style={{ width: `${(cat.count / 12) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'library-6',
        label: '6. Graph pages',
        library: 'recharts',
        tag: 'Pages par mois',
        content: (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={[
              { month: 'Jan', pages: 450 },
              { month: 'Feb', pages: 320 },
              { month: 'Mar', pages: 580 },
              { month: 'Apr', pages: 420 },
              { month: 'May', pages: 650 },
              { month: 'Jun', pages: 380 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" stroke="#71717a" style={{ fontSize: '10px' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '10px' }} />
              <Bar dataKey="pages" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }} />
            </BarChart>
          </ResponsiveContainer>
        )
      }
    ]
  },

  // AI - 5 variations
  {
    id: 'ai',
    title: 'AI Assistant',
    category: 'ai',
    description: 'Explore 5 designs différents',
    examples: [
      {
        id: 'ai-1',
        label: '1. Accès rapide',
        library: 'native',
        tag: 'Statut + Prompts',
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <div className="text-[10px] text-cyan-400/80 uppercase">AI ASSISTANT</div>
              <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
              <MessageSquare className="w-4 h-4 text-cyan-300 mb-1" />
              <div className="text-xs text-cyan-100">Demandez-moi n'importe quoi</div>
            </div>
            <div className="space-y-1">
              <div className="text-[9px] text-zinc-600 font-bold uppercase">Prompts rapides</div>
              {['Résumer', 'Expliquer', 'Code review'].map((prompt, i) => (
                <button key={i} className="w-full text-left px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs text-zinc-300 transition">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'ai-2',
        label: '2. Stats usage',
        library: 'tremor',
        tag: 'Métriques AI',
        content: (
          <Grid numItems={2} className="gap-2">
            {[
              { title: 'Messages', metric: '142', color: 'cyan' },
              { title: 'Tokens', metric: '24k', color: 'indigo' },
              { title: 'Sessions', metric: '18', color: 'purple' },
              { title: 'Uptime', metric: '99%', color: 'emerald' }
            ].map(card => (
              <Card key={card.title} decoration="left" decorationColor={card.color as any} className="bg-zinc-900/60 border-zinc-800">
                <Text className="text-zinc-400 text-xs">{card.title}</Text>
                <Metric className="text-white">{card.metric}</Metric>
              </Card>
            ))}
          </Grid>
        )
      },
      {
        id: 'ai-3',
        label: '3. Historique',
        library: 'native',
        tag: 'Dernières conversations',
        content: (
          <div className="space-y-2">
            {[
              { title: 'Expliquer les Hooks React', time: '2h ago' },
              { title: 'Debug erreur TypeScript', time: '5h ago' },
              { title: 'Optimiser performances', time: '1d ago' },
              { title: 'Refactor code', time: '2d ago' }
            ].map((conv, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer">
                <MessageSquare className="w-3 h-3 text-cyan-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-zinc-300 truncate">{conv.title}</div>
                  <div className="text-[10px] text-zinc-600">{conv.time}</div>
                </div>
              </div>
            ))}
          </div>
        )
      },
      {
        id: 'ai-4',
        label: '4. Compact status',
        library: 'native',
        tag: 'Minimaliste',
        content: (
          <div className="space-y-3 text-center">
            <div className="text-4xl">🤖</div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-400">En ligne</span>
              </div>
              <div className="text-2xl font-bold text-white">142</div>
              <div className="text-xs text-zinc-500">messages échangés</div>
            </div>
            <button className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold">
              Nouvelle conversation
            </button>
          </div>
        )
      },
      {
        id: 'ai-5',
        label: '5. Graph usage',
        library: 'recharts',
        tag: 'Messages par jour',
        content: (
          <ResponsiveContainer width="100%" height={140}>
            <ReLineChart data={[
              { day: 'L', count: 15 },
              { day: 'M', count: 22 },
              { day: 'M', count: 18 },
              { day: 'J', count: 28 },
              { day: 'V', count: 20 },
              { day: 'S', count: 12 },
              { day: 'D', count: 8 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" stroke="#71717a" style={{ fontSize: '10px' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4, fill: '#06b6d4' }} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }} />
            </ReLineChart>
          </ResponsiveContainer>
        )
      }
    ]
  }
]

