import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

const ThemeToggle: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const isDark = state.theme === 'dark';

  return (
    <button
      className="theme-toggle"
      onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;
