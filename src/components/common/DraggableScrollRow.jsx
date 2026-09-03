import React, { useRef, useState, useEffect } from 'react';

export default function DraggableScrollRow({ children, className = '', showFade = true }) {
  const containerRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasScrolledRight, setHasScrolledRight] = useState(true);
  const isDraggingRef = useRef(false);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setHasScrolledRight(scrollLeft + clientWidth < scrollWidth - 8);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [children]);

  const handleMouseDown = (e) => {
    // Only engage drag on main left click
    if (e.button !== 0) return;
    setIsMouseDown(true);
    isDraggingRef.current = false;
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown) return;
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.6;
    if (Math.abs(x - startX) > 4) {
      isDraggingRef.current = true;
    }
    containerRef.current.scrollLeft = scrollLeft - walk;
    checkScroll();
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 60);
  };

  const handleWheel = (e) => {
    if (containerRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      containerRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  return (
    <div className="relative w-full overflow-hidden">
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onScroll={checkScroll}
        className={`flex items-center flex-nowrap overflow-x-auto no-scrollbar scrollbar-hide select-none cursor-grab active:cursor-grabbing ${className}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
          scrollBehavior: isMouseDown ? 'auto' : 'smooth'
        }}
        onClickCapture={(e) => {
          if (isDraggingRef.current) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        {children}
      </div>

      {showFade && hasScrolledRight && (
        <div 
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0e4a7b]/90 to-transparent transition-opacity duration-300" 
          aria-hidden="true"
        />
      )}
    </div>
  );
}
