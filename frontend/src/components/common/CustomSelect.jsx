import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ options, value, onChange, placeholder, name, id }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref} id={id}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 bg-white border ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-[#E5E7EB] hover:border-primary/50'} rounded-xl text-sm cursor-pointer flex justify-between items-center transition-all`}
      >
        <span className={selected ? 'text-black font-medium' : 'text-[#6B7280]'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute z-[150] w-full mt-1.5 bg-white border border-[#E5E7EB] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto custom-scrollbar py-1.5">
            {options.map((opt) => {
              const isSelected = String(value) === String(opt.value);
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange({ target: { name, value: opt.value, type: 'select-one' } });
                    setIsOpen(false);
                  }}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center ${
                    isSelected 
                      ? 'bg-[#E9FFEA] text-[#127C2F] font-bold' 
                      : 'text-black hover:bg-gray-50 font-medium'
                  }`}
                >
                  {opt.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
