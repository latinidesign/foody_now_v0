"use client"

import dynamic from "next/dynamic"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface CustomersTrendChartProps {
  data: Array<{
    date: string
    sales: number
    orders: number
    customers: number
  }>
}

export function CustomersTrendChart({ data }: CustomersTrendChartProps) {
  if (!data.length) {
    return <div className="text-center text-muted-foreground py-8">No hay datos para el período seleccionado</div>
  }

  const chartData = {
    series: [
      {
        name: "Clientes",
        data: data.map((item) => item.customers),
      },
    ],
    options: {
      chart: {
        type: "area" as const,
        height: 300,
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth" as const,
        width: 2,
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100],
        },
      },
      colors: ["hsl(var(--chart-3))"],
      xaxis: {
        categories: data.map((item) => format(new Date(item.date), "dd/MM", { locale: es })),
        labels: {
          style: {
            fontSize: "12px",
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (value: number) => `${Math.round(value)}`,
          style: {
            fontSize: "12px",
          },
        },
      },
      tooltip: {
        x: {
          formatter: (value: number, { dataPointIndex }: any) => {
            const originalDate = data[dataPointIndex]?.date
            return originalDate ? format(new Date(originalDate), "dd 'de' MMMM, yyyy", { locale: es }) : ""
          },
        },
        y: {
          formatter: (value: number) => `${value} clientes`,
        },
      },
      grid: {
        show: true,
        borderColor: "hsl(var(--border))",
        strokeDashArray: 3,
      },
    },
  }

  return (
    <div className="h-[300px]">
      <Chart options={chartData.options} series={chartData.series} type="area" height={300} />
    </div>
  )
}
