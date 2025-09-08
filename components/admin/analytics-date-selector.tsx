"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

export function AnalyticsDateSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
    to: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
  })

  const handleQuickSelect = (period: string) => {
    const now = new Date()
    let startDate: Date
    const endDate: Date = now

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "quarter":
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        break
      default:
        return
    }

    setDateRange({ from: startDate, to: endDate })
    updateURL(startDate, endDate)
  }

  const updateURL = (startDate: Date, endDate: Date) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("startDate", startDate.toISOString().split("T")[0])
    params.set("endDate", endDate.toISOString().split("T")[0])
    router.replace(`/admin/analytics?${params.toString()}`)
  }

  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (!range) return
    setDateRange(range)
    if (range.from && range.to) {
      updateURL(range.from, range.to)
    }
  }

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => handleQuickSelect("today")}>
          Hoy
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleQuickSelect("week")}>
          7 días
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleQuickSelect("month")}>
          Este mes
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleQuickSelect("quarter")}>
          Trimestre
        </Button>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal bg-background border",
              !dateRange.from && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy", { locale: es })} -{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: es })
              )
            ) : (
              "Seleccionar período"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-background border shadow-lg" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={dateRange}
            onSelect={handleDateRangeSelect}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
