"use client"

import { CheckIcon, Zap } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PricingTier {
  name: string
  id: string
  priceMonthly: string
  description: string
  features: string[]
  featured: boolean
  trialDays?: number
}

interface ModernPricingSectionProps {
  onSubscribe: (planId: string) => void
  isLoading?: boolean
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function ModernPricingSection({ onSubscribe, isLoading }: ModernPricingSectionProps) {
  const tiers: PricingTier[] = [
    {
      name: 'Plan Básico',
      id: 'tier-basic',
      priceMonthly: '$29.99',
      description: "Perfecto para pequeños emprendimientos que están comenzando.",
      features: [
        'Tienda online completa',
        'Hasta 500 productos',
        'WhatsApp Business básico',
        'Estadísticas básicas',
        'Soporte por email'
      ],
      featured: false,
      trialDays: 30,
    },
    {
      name: 'Plan Pro',
      id: 'tier-pro',
      priceMonthly: '$59.99',
      description: 'La solución completa para hacer crecer tu negocio online.',
      features: [
        'Productos ilimitados',
        'WhatsApp Business completo',
        'Analytics avanzados',
        'Soporte prioritario 24/7',
        'Automatizaciones de marketing',
        'Integraciones personalizadas',
        'Personalización de marca',
        'Reportes detallados'
      ],
      featured: true,
      trialDays: 30,
    },
  ]

  return (
    <div className="relative isolate bg-gray-900 px-6 py-24 sm:py-32 lg:px-8 rounded-3xl">
      {/* Decorative background element */}
      <div aria-hidden="true" className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl">
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20"
        />
      </div>
      
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-base/7 font-semibold text-indigo-400">Planes de Suscripción</h2>
        <p className="mt-2 text-5xl font-semibold tracking-tight text-balance text-white sm:text-6xl">
          Elige el plan perfecto para ti
        </p>
      </div>
      
      <p className="mx-auto mt-6 max-w-2xl text-center text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
        Comienza con 30 días gratis y accede a todas las herramientas que necesitas para hacer crecer tu negocio online.
      </p>
      
      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
        {tiers.map((tier, tierIdx) => (
          <div
            key={tier.id}
            className={classNames(
              tier.featured ? 'relative bg-gray-800' : 'bg-white/5 sm:mx-8 lg:mx-0',
              tier.featured
                ? ''
                : tierIdx === 0
                  ? 'rounded-t-3xl sm:rounded-b-none lg:rounded-tr-none lg:rounded-bl-3xl'
                  : 'sm:rounded-t-none lg:rounded-tr-3xl lg:rounded-bl-none',
              'rounded-3xl p-8 ring-1 ring-white/10 sm:p-10',
            )}
          >
            {tier.featured && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-indigo-500 text-white px-3 py-1 text-sm font-semibold">
                  MÁS POPULAR
                </Badge>
              </div>
            )}
            
            <h3
              id={tier.id}
              className={classNames(
                tier.featured ? 'text-indigo-400' : 'text-indigo-400', 
                'text-base/7 font-semibold'
              )}
            >
              {tier.name}
            </h3>
            
            <p className="mt-4 flex items-baseline gap-x-2">
              <span
                className={classNames(
                  tier.featured ? 'text-white' : 'text-white',
                  'text-5xl font-semibold tracking-tight',
                )}
              >
                {tier.priceMonthly}
              </span>
              <span className={classNames(
                tier.featured ? 'text-gray-400' : 'text-gray-400', 
                'text-base'
              )}>
                /mes
              </span>
            </p>
            
            {tier.trialDays && (
              <div className="mt-3">
                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                  <Zap className="h-3 w-3 mr-1" />
                  {tier.trialDays} días GRATIS
                </Badge>
              </div>
            )}
            
            <p className={classNames(
              tier.featured ? 'text-gray-300' : 'text-gray-300', 
              'mt-6 text-base/7'
            )}>
              {tier.description}
            </p>
            
            <ul
              role="list"
              className={classNames(
                tier.featured ? 'text-gray-300' : 'text-gray-300',
                'mt-8 space-y-3 text-sm/6 sm:mt-10',
              )}
            >
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <CheckIcon
                    aria-hidden="true"
                    className={classNames(
                      tier.featured ? 'text-indigo-400' : 'text-indigo-400', 
                      'h-6 w-5 flex-none'
                    )}
                  />
                  {feature}
                </li>
              ))}
            </ul>
            
            <Button
              onClick={() => onSubscribe(tier.id)}
              disabled={isLoading}
              className={classNames(
                tier.featured
                  ? 'bg-indigo-500 text-white hover:bg-indigo-400 focus-visible:outline-indigo-500'
                  : 'bg-white/10 text-white ring-1 ring-inset ring-white/5 hover:bg-white/20 focus-visible:outline-white',
                'mt-8 w-full rounded-md px-3.5 py-2.5 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-10',
              )}
            >
              {isLoading ? (
                "Procesando..."
              ) : tier.trialDays ? (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Comenzar Prueba Gratuita
                </>
              ) : (
                "Empezar Ahora"
              )}
            </Button>
            
            {tier.trialDays && (
              <p className="mt-4 text-xs text-center text-gray-400">
                Sin compromiso • Cancela cuando quieras
              </p>
            )}
          </div>
        ))}
      </div>
      
      {/* Additional info section */}
      <div className="mx-auto mt-16 max-w-2xl text-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4">
            ¿Por qué elegir FoodyNow?
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mb-2">
                <CheckIcon className="h-4 w-4 text-white" />
              </div>
              <span>Fácil de usar</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mb-2">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span>Configuración rápida</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mb-2">
                <CheckIcon className="h-4 w-4 text-white" />
              </div>
              <span>Soporte 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
