"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
    if (!daySchedule || !daySchedule.isOpen) {
      return {
        day: dayNames[index],
        schedule: "Cerrado",
        isOpen: false,
      }
    }

    let schedule = `de ${daySchedule.open1} a ${daySchedule.close1}`
    if (daySchedule.open2 && daySchedule.close2) {
      schedule += ` y de ${daySchedule.open2} a ${daySchedule.close2}`
    }
    schedule += " hs"

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
          <DialogDescription>Consulta los horarios de atención de {storeName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Día</th>
                  <th className="text-left py-2 px-3 font-medium">Horarios</th>
                </tr>
              </thead>
              <tbody>
                {formattedHours.map((item, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="py-2 px-3 font-medium">{item.day}</td>
                    <td className={`py-2 px-3 ${item.isOpen ? "text-foreground" : "text-muted-foreground"}`}>
                      {item.schedule}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
