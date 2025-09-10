"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock } from "lucide-react"

interface BusinessHoursModalProps {
  businessHours: any
  storeName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatBusinessHours(businessHours: any) {
  if (!businessHours) return []

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  return days.map((day, index) => {
    const daySchedule = businessHours[day]
    if (!daySchedule || !daySchedule.enabled) {
      return {
        day: dayNames[index],
        schedule: "Cerrado",
        isOpen: false,
      }
    }

    let schedule = `${daySchedule.open1} - ${daySchedule.close1}`
    if (daySchedule.open2 && daySchedule.close2) {
      schedule += ` y ${daySchedule.open2} - ${daySchedule.close2}`
    }

    return {
      day: dayNames[index],
      schedule: schedule,
      isOpen: true,
    }
  })
}

export function BusinessHoursModal({ businessHours, storeName, open, onOpenChange }: BusinessHoursModalProps) {
  const formattedHours = formatBusinessHours(businessHours)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horarios de Atención
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">Horarios de atención de {storeName}</p>

          <div className="space-y-2">
            {formattedHours.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/50">
                <span className="font-medium">{item.day}</span>
                <span className={`text-sm ${item.isOpen ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.schedule}
                </span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
