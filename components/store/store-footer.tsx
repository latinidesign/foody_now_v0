"use client"

import Link from "next/link"
import Image from "next/image"

export function StoreFooter() {
  return (
    <footer className="border-t bg-muted/30 py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Creada con ❤️ por:</span>
          <Link 
            href="https://foodynow.com.ar" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity flex items-center gap-2"
          >
            <Image
              src="/foodynow_logo-wt.svg"
              alt="FoodyNow"
              width={80}
              height={36}
              className="h-6 w-auto"
            />
          </Link>
        </div>
      </div>
    </footer>
  )
}
