import React, { useEffect, useRef } from 'react';

export default ({ children }) => {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        bubbles: true,
        cancelable: true,
      });
      console.log(element);
      element.dispatchEvent(mouseEvent);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(mouseEvent);
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const mouseEventUp = new MouseEvent('mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(mouseEventUp);
      const mouseEventClick = new MouseEvent('click', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(mouseEventClick);
    };

    const handleTouchCancel = (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const mouseEvent = new MouseEvent('mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(mouseEvent);
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [elementRef]);

  return (
    <div ref={elementRef}>{children}</div>
  );
}