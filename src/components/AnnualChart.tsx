import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { AnnualSummaryMonth } from '../types/AnnualSummary'
import type { TooltipItem } from 'chart.js'


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title
)

interface Props {
  data: AnnualSummaryMonth[]
}

export default function AnnualChart({ data }: Props) {
  if (!data.length) return null

  // Nomes dos meses
  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ]

  const chartData = {
    labels: data.map(m => monthNames[m.month - 1]),
    datasets: [
      {
        label: 'Entradas',
        data: data.map(m => m.income),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(16, 185, 129, 1)'
      },
      {
        label: 'Gastos',
        data: data.map(m => m.expense),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#ef4444',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(239, 68, 68, 1)'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Removemos a legenda do gráfico pois já temos fora
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
          const label = context.dataset.label || ''
          const value = context.parsed.y ?? 0

          return `${label}: R$ ${value.toFixed(2)}`
}


        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false
        },
        ticks: {
          color: '#94a3b8'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false
        },
        ticks: {
          color: '#94a3b8',
          callback: (value: string | number) =>
  `R$ ${Number(value).toFixed(2)}`

        }
      }
    }
  }

  return (
    <div style={{
      height: 300,
      position: 'relative' as const,
      marginBottom: 20
    }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}