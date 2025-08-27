import { WhatsAppSettings } from "@/components/admin/whatsapp-settings"

export default function WhatsAppSettingsPage() {
  // In a real app, you would fetch the store data from the database
  const mockStore = {
    slug: "burger-house",
    name: "Burger House",
    phone: "+5491187654321",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">WhatsApp</h1>
        <p className="text-muted-foreground">
          Configura la integración con WhatsApp para recibir y enviar notificaciones
        </p>
      </div>

      <WhatsAppSettings storeSlug={mockStore.slug} storeName={mockStore.name} currentPhone={mockStore.phone} />
    </div>
  )
}
