import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPosition;
  className?: string;
  widthClass?: string;
}

/**
 * Componente de Tooltip que utiliza React Portal para ser renderizado no document.body.
 * Tema Pure White de alta nítidez com fundo branco puro, bordas marcadas e sombras elegantes.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  widthClass = 'w-72 max-w-sm',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    if (position === 'top') {
      top = rect.top - 10;
      left = rect.left + rect.width / 2;
    } else if (position === 'bottom') {
      top = rect.bottom + 10;
      left = rect.left + rect.width / 2;
    } else if (position === 'left') {
      top = rect.top + rect.height / 2;
      left = rect.left - 10;
    } else if (position === 'right') {
      top = rect.top + rect.height / 2;
      left = rect.right + 10;
    }

    const viewportWidth = window.innerWidth;
    if (left + 160 > viewportWidth) {
      left = viewportWidth - 170;
    } else if (left - 160 < 0) {
      left = 170;
    }

    setCoords({ top, left });
  };

  const handleMouseEnter = () => {
    updateCoords();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
      return () => {
        window.removeEventListener('scroll', updateCoords, true);
        window.removeEventListener('resize', updateCoords);
      };
    }
  }, [isVisible]);

  return (
    <div
      ref={triggerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {isVisible &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform:
                position === 'top'
                  ? 'translate(-50%, -100%)'
                  : position === 'bottom'
                  ? 'translate(-50%, 0)'
                  : position === 'left'
                  ? 'translate(-100%, -50%)'
                  : 'translate(0, -50%)',
            }}
            className={`z-[99999] ${widthClass} p-4 bg-white text-black text-xs font-bold rounded-2xl shadow-2xl border border-slate-300 leading-relaxed pointer-events-none animate-fade-in-up`}
          >
            {content}
          </div>,
          document.body
        )}
    </div>
  );
};

interface FieldTooltipProps {
  content: string;
  position?: TooltipPosition;
}

/**
 * Ícone de ajuda com alto contraste (Preto Nítido / Teal) e tooltip via Portal.
 */
export const FieldTooltip: React.FC<FieldTooltipProps> = ({
  content,
  position = 'top',
}) => (
  <Tooltip content={content} position={position}>
    <span
      className="w-4 h-4 rounded-full bg-slate-100 hover:bg-teal-600 text-black hover:text-white border border-slate-400 hover:border-teal-600 transition-all duration-150 flex items-center justify-center text-[11px] font-bold cursor-help select-none shrink-0 shadow-sm"
      aria-label={`Ajuda: ${content}`}
    >
      ?
    </span>
  </Tooltip>
);
