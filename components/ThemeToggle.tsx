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

  const currentIndex = themes.findIndex(t => t.id === theme);
  const currentTheme = themes[currentIndex !== -1 ? currentIndex : 0];

  const cycleTheme = () => {
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].id);
  };

  return (
    <button
      onClick={cycleTheme}
      className="w-8 h-8 flex items-center justify-center rounded-full text-ink/70 hover:text-ink hover:bg-secondary/50 transition-all focus:outline-none"
      title={`Current: ${currentTheme.label} Mode (Click to cycle)`}
      aria-label="Toggle reading theme"
    >
      <currentTheme.icon className="w-4 h-4" />
    </button>
  );
}
