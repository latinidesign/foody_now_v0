'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react'; // Opcional: instalando lucide-react

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // Mostrar el botón cuando se baja más de 300px
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        type="button"
        onClick={scrollToTop}
        className={`
          ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          bg-fuchsia-600 hover:bg-fuchsia-700 text-white p-3 rounded-full shadow-lg 
          transition-all duration-300 ease-in-out hover:scale-110 active:scale-95
        `}
        aria-label="Volver arriba"
      >
        <ChevronUp size={24} />
      </button>
    </div>
  );
}
