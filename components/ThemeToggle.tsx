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
    <div className="flex items-center space-x-2 bg-transparent">
      {themes.map(t => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center transition-all focus:outline-none
            ${theme === t.id 
              ? 'bg-ink text-background shadow-sm scale-110' 
              : 'text-ink/40 hover:text-ink/80 hover:bg-secondary/50'
            }
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
