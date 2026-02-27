import { useEffect, useRef } from 'react';
import { Dispatch } from 'react';
import { AppAction } from '../types';

/**
 * Client-side countdown timer that ticks every second.
 * Server-synced initial value comes from state.remainingTime.
 * Active only when pollStatus === 'active'.
 */
export function useTimer(
  pollStatus: 'idle' | 'active' | 'ended',
  remainingTime: number,
  dispatch: Dispatch<AppAction>
): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pollStatus !== 'active' || remainingTime <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pollStatus, dispatch]);

  // If remainingTime hits 0, clear the interval
  useEffect(() => {
    if (remainingTime <= 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [remainingTime]);
}
