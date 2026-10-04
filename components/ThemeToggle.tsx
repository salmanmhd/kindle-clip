'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[120px] h-8" />; // placeholder
  }

  const themes = [
    { id: 'paper', label: 'Aa' },
    { id: 'sepia', label: 'Aa' },
    { id: 'night', label: 'Aa' },
  ];

  return (
    <div className="flex items-center space-x-1 border border-border rounded-full p-1 bg-popover shadow-sm">
      {themes.map(t => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center font-serif text-sm transition-all
            ${theme === t.id ? 'ring-2 ring-ink ring-offset-1 ring-offset-background' : 'opacity-70 hover:opacity-100'}
            ${t.id === 'paper' ? 'bg-[#f7f5f0] text-[#3d3835]' : ''}
            ${t.id === 'sepia' ? 'bg-[#f4ecd8] text-[#5b4636]' : ''}
            ${t.id === 'night' ? 'bg-[#1a1b1e] text-[#d1d5db]' : ''}
          `}
          title={`${t.id.charAt(0).toUpperCase() + t.id.slice(1)} Mode`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
