import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '../utils/css';

const DraggableImage = ({ id, image, alt }) => {
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

  // Ensure a smooth default transition if the library doesn't provide one
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
    willChange: 'transform',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative group bg-white rounded-lg shadow-lg overflow-hidden 
        cursor-grab active:cursor-grabbing touch-manipulation transform transition-all duration-300
        hover:shadow-xl hover:-translate-y-1 border border-gray-200
        ${isDragging ? 'opacity-50 scale-105 shadow-2xl' : ''}
      `}
    >
      {/* Image container */}
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={alt}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          draggable={false}
        />
        
        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Drag indicator */}
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
      </div>
      
      {/* Text container */}
      <div className="p-4 bg-white">
        <p className="text-sm text-gray-700 font-medium text-center leading-relaxed font-['Inter']">
          {alt}
        </p>
      </div>
      
      {/* Dragging state overlay */}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm rounded-lg">
          <div className="w-8 h-8 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      )}
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-300 pointer-events-none"></div>
    </div>
  );
};

export default DraggableImage;
