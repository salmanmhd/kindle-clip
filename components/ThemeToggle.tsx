'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Coffee, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[120px] h-10" />; // placeholder
  }

  const themes = [
    { id: 'paper', icon: Sun, label: 'Paper' },
    { id: 'sepia', icon: Coffee, label: 'Sepia' },
    { id: 'night', icon: Moon, label: 'Night' },
  ];

  return (
    <div className="flex items-center space-x-1 border border-border rounded-full p-1 bg-popover shadow-sm">
      {themes.map(t => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`
            w-9 h-9 rounded-full flex items-center justify-center transition-all
            ${theme === t.id ? 'ring-2 ring-ink ring-offset-1 ring-offset-background' : 'opacity-70 hover:opacity-100'}
            ${t.id === 'paper' ? 'bg-[#f7f5f0] text-[#3d3835]' : ''}
            ${t.id === 'sepia' ? 'bg-[#f4ecd8] text-[#5b4636]' : ''}
            ${t.id === 'night' ? 'bg-[#1a1b1e] text-[#d1d5db]' : ''}
          `}
          title={`${t.label} Mode`}
          aria-label={`${t.label} Mode`}
        >
          <t.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
