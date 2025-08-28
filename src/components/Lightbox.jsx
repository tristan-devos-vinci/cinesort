// filepath: c:\repos\disorder\src\components\DraggableImage.jsx
import React, { useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '../utils/css';

export default function Lightbox({ open, url, alt, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-[95vw] max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
        />
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 bg-white/90 rounded-full p-2 shadow"
        >
          <svg className="w-4 h-4 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const DraggableImage = ({ id, image, alt, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    // always animate layout changes for smooth swapping (you can customize to skip when dragging)
    animateLayoutChanges: ({ isDragging: dragging }) => !dragging,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      // don't open lightbox while dragging
      onClick={() => { if (!isDragging && typeof onClick === 'function') onClick(); }}
      className={`
        relative group bg-white rounded-lg shadow-lg overflow-hidden 
        cursor-grab active:cursor-grabbing touch-manipulation transform transition-all duration-300
        hover:shadow-xl hover:-translate-y-1 border border-gray-200
        ${isDragging ? 'opacity-50 scale-105 shadow-2xl' : ''}
      `}
    >
      <img
        src={image}
        alt={alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
};