"use client"

import dynamic from "next/dynamic"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface OrdersTrendChartProps {
  data: Array<{
    date: string
    sales: number
    orders: number
    customers: number
  }>
}

export function OrdersTrendChart({ data }: OrdersTrendChartProps) {
  if (!data.length) {
    return <div className="text-center text-muted-foreground py-8">No hay datos para el período seleccionado</div>
  }

  const chartData = {
    series: [
      {
        name: "Pedidos",
        data: data.map((item) => item.orders),
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
        colors: ["#c026d3"], // fuchsia-600
      },
      markers: {
        size: 4,
        colors: ["#c026d3"], // fuchsia-600
        strokeColors: ["#ffffff"],
        hover: {
          size: 6,
        },
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 1,
          gradientToColors: ["#f7fee7"], // lime-50
          inverseColors: false,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 100],
        },
        colors: ["#ecfccb"], // lime-100
      },
      colors: ["#c026d3"], // fuchsia-600
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
          formatter: (value: number) => `${value} pedidos`,
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
