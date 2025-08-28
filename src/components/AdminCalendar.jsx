import React, { useState } from 'react';

export default function AdminCalendar({ puzzles, onEditPuzzle, onDeletePuzzle, onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const getMonthData = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Calculate days to display from previous month to start the calendar on Sunday
    const daysFromPrevMonth = firstDay.getDay();
    // Calculate total days in grid (ensure we have complete weeks)
    const totalDays = daysFromPrevMonth + lastDay.getDate();
    const totalWeeks = Math.ceil(totalDays / 7);
    
    return { 
      year, 
      month, 
      firstDay, 
      lastDay, 
      daysFromPrevMonth, 
      totalWeeks,
      daysInMonth: lastDay.getDate()
    };
  };
  
  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const monthData = getMonthData(currentMonth);
  
  // Group puzzles by date
  const puzzlesByDate = puzzles.reduce((acc, puzzle) => {
    acc[puzzle.date] = puzzle;
    return acc;
  }, {});
  
  const isToday = (year, month, day) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year;
  };
  
  const formatDateString = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };
  
  const renderCalendar = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    const renderDay = (day, weekIndex, dayIndex) => {
      // Check if it's a valid day for the current month
      if (day <= 0 || day > monthData.daysInMonth) {
        return (
          <div key={`empty-${weekIndex}-${dayIndex}`} 
               className="h-24 border border-slate-200 bg-slate-50/50 p-1">
          </div>
        );
      }
      
      const dateStr = formatDateString(monthData.year, monthData.month, day);
      const puzzle = puzzlesByDate[dateStr];
      const hasMovie = !!puzzle;
      const todayClass = isToday(monthData.year, monthData.month, day) ? 
                         'bg-blue-50 border-blue-300' : 
                         'hover:bg-slate-50';
      
      return (
        <div 
          key={`day-${day}`} 
          className={`min-h-24 border border-slate-200 p-1 ${todayClass} ${hasMovie ? 'cursor-pointer' : ''}`}
          onClick={() => onDateSelect(dateStr)}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium ${isToday(monthData.year, monthData.month, day) ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
              {day}
            </span>
            {hasMovie && (
              <div className="flex gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEditPuzzle(puzzle); }}
                  className="text-xs bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeletePuzzle(puzzle.id); }}
                  className="text-xs bg-red-500 text-white p-1 rounded hover:bg-red-600"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          {hasMovie && (
            <div className="mt-1 p-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded truncate">
              {puzzle.title}
            </div>
          )}
        </div>
      );
    };
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 border border-slate-200">
        {/* Calendar header */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={goToPrevMonth} className="p-1 rounded-full hover:bg-slate-100">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-xl font-semibold text-slate-800">
            {monthNames[monthData.month]} {monthData.year}
          </h3>
          
          <button onClick={goToNextMonth} className="p-1 rounded-full hover:bg-slate-100">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map(day => (
            <div key={day} className="text-center py-1 text-sm font-medium text-slate-600">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* First week with potential empty days */}
          {[...Array(monthData.daysFromPrevMonth)].map((_, i) => (
            <div key={`empty-prev-${i}`} className="h-24 border border-slate-200 bg-slate-50/50 p-1"></div>
          ))}
          
          {/* Actual days of the month */}
          {[...Array(monthData.daysInMonth)].map((_, i) => {
            const day = i + 1;
            const weekIndex = Math.floor((monthData.daysFromPrevMonth + i) / 7);
            const dayIndex = (monthData.daysFromPrevMonth + i) % 7;
            
            return renderDay(day, weekIndex, dayIndex);
          })}
          
          {/* Remaining days to complete the grid */}
          {[...Array(7 * monthData.totalWeeks - (monthData.daysFromPrevMonth + monthData.daysInMonth))].map((_, i) => (
            <div key={`empty-next-${i}`} className="h-24 border border-slate-200 bg-slate-50/50 p-1"></div>
          ))}
        </div>
        
        <div className="mt-4 text-xs text-slate-500">
          * Click on a date to plan a new puzzle
        </div>
      </div>
    );
  };
  
  return renderCalendar();
}