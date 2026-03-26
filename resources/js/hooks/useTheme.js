import { useEffect, useState } from 'react';

export function useTheme() {
    const [theme, setTheme] = useState(() => {
        try { return localStorage.getItem('theme') || 'light'; } catch { return 'light'; }
    });

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        try { localStorage.setItem('theme', theme); } catch {}
    }, [theme]);

    function toggleTheme() {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    }

    return { theme, toggleTheme, isDark: theme === 'dark' };
}
