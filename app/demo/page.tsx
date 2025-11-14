"use client"

import { StoreHeader } from "@/components/store/store-header"
import { ProductCatalog } from "@/components/store/product-catalog"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { CartProvider } from "@/components/store/cart-context"

export default function DemoPage() {
  const demoStore = {
    id: "demo-store",
    owner_id: "demo-owner",
    name: "FOODYNOW Demo",
    slug: "demo",
    description: "Tienda de demostración - Explora todas las funcionalidades",
    logo_url: "/foodynow-logo_360.png",
    banner_url: "/local1.jpg",
    primary_color: "#2D5016",
    whatsapp_phone: "+5491123456789",
    is_active: true,
    delivery_radius: 10,
    delivery_fee: 500,
    min_order_amount: 1000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business_hours: {
      monday: { open: "09:00", close: "22:00", closed: false },
      tuesday: { open: "09:00", close: "22:00", closed: false },
      wednesday: { open: "09:00", close: "22:00", closed: false },
      thursday: { open: "09:00", close: "22:00", closed: false },
      friday: { open: "09:00", close: "22:00", closed: false },
      saturday: { open: "10:00", close: "23:00", closed: false },
      sunday: { open: "10:00", close: "21:00", closed: false }
    },
    is_open: true,
  }

  const demoCategories = [
    {
      id: "demo-cat-1",
      store_id: "demo-store",
      name: "🍕 Pizzas",
      description: "Nuestras deliciosas pizzas artesanales",
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      products: [
        {
          id: "demo-prod-1",
          store_id: "demo-store",
          category_id: "demo-cat-1",
          name: "Pizza Margherita",
          description: "Salsa de tomate, mozzarella, albahaca fresca, aceite de oliva",
          price: 2500,
          image_url: "/producto-demo.png",
          is_available: true,
          sort_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          product_options: [
            {
              id: "size-1",
              product_id: "demo-prod-1",
              name: "Tamaño",
              type: "single",
              is_required: true,
              sort_order: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              product_option_values: [
                { id: "small", product_option_id: "size-1", name: "Chica", price_modifier: 0, sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: "medium", product_option_id: "size-1", name: "Mediana", price_modifier: 500, sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: "large", product_option_id: "size-1", name: "Grande", price_modifier: 1000, sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
              ]
            }
          ],
        },
        {
          id: "demo-prod-2",
          name: "Pizza Napolitana",
          description: "Salsa de tomate, mozzarella, tomates en rodajas, orégano",
          price: 2800,
          image_url: "/producto-demo.png",
          is_available: true,
          product_options: [
            {
              id: "size",
              name: "Tamaño", 
              type: "single",
              is_required: true,
              product_option_values: [
                { id: "small", name: "Chica", price_modifier: 0 },
                { id: "medium", name: "Mediana", price_modifier: 500 },
                { id: "large", name: "Grande", price_modifier: 1000 }
              ]
            }
          ],
        }
      ],
    },
    {
      id: "demo-cat-2",
      name: "🥤 Bebidas",
      description: "Bebidas refrescantes para acompañar",
      products: [
        {
          id: "demo-prod-3",
          name: "Coca Cola",
          description: "Bebida gaseosa clásica",
          price: 800,
          image_url: "/producto-demo.png",
          is_available: true,
          product_options: [
            {
              id: "size",
              name: "Tamaño",
              type: "single", 
              is_required: true,
              product_option_values: [
                { id: "small", name: "350ml", price_modifier: 0 },
                { id: "large", name: "500ml", price_modifier: 200 }
              ]
            }
          ],
        },
        {
          id: "demo-prod-4",
          name: "Agua Mineral",
          description: "Agua mineral sin gas",
          price: 500,
          image_url: "/producto-demo.png",
          is_available: true,
          product_options: [],
        }
      ],
    },
    {
      id: "demo-cat-3",
      name: "🍰 Postres",
      description: "Deliciosos postres caseros",
      products: [
        {
          id: "demo-prod-5",
          name: "Tiramisú",
          description: "Postre italiano tradicional con café y mascarpone",
          price: 1200,
          image_url: "/producto-demo.png",
          is_available: true,
          product_options: [],
        }
      ],
    }
  ]

  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <StoreHeader store={demoStore as any} />
        <main className="container mx-auto px-4 py-6">
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">🚀 Modo Demostración</h3>
            <p className="text-green-700 text-sm">
              Esta es una tienda de demostración completa. Explora todas las funcionalidades de FOODYNOW: 
              navegación de categorías, carrito de compras, opciones de productos y más.
            </p>
          </div>
          <ProductCatalog store={demoStore as any} categories={demoCategories as any} />
        </main>
        <InstallPrompt />
      </div>
    </CartProvider>
  )
}

// Metadata se maneja automáticamente para páginas de cliente
