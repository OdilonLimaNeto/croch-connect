import { useEffect } from 'react';

// Extend CSSStyleDeclaration to include webkit properties
declare global {
  interface CSSStyleDeclaration {
    webkitOverflowScrolling?: string;
  }
}

/**
 * Hook para aplicar correções específicas de scroll em dispositivos iOS
 * Especialmente útil para modais e overlays que precisam de scroll
 */
export function useIOSScrollFix() {
  useEffect(() => {
    // Detecta se é um dispositivo iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // Aplica correções específicas para iOS
      const body = document.body;
      const originalOverflow = body.style.overflow;
      const originalWebkitOverflowScrolling = body.style.webkitOverflowScrolling;
      
      // Configura propriedades para melhor scroll em iOS
      body.style.webkitOverflowScrolling = 'touch';
      
      // Cleanup ao desmontar o componente
      return () => {
        body.style.overflow = originalOverflow;
        body.style.webkitOverflowScrolling = originalWebkitOverflowScrolling || '';
      };
    }
  }, []);

  // Retorna utilitários para componentes
  return {
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    getScrollClasses: () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      return isIOS 
        ? 'overflow-y-auto' 
        : 'overflow-y-auto';
    }
  };
}

/**
 * Função utilitária para aplicar estilos de scroll otimizados para móveis
 */
export function getOptimizedScrollStyles() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  return {
    overflowY: 'auto' as const,
    WebkitOverflowScrolling: isIOS ? 'touch' : undefined,
    transform: isIOS ? 'translateZ(0)' : undefined,
    willChange: isIOS ? 'scroll-position' : undefined,
  };
}
