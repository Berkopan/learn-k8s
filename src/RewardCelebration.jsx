import React, {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import './styles/celebration.css';

// Progress is saved by App immediately; only its presentation waits for this beat.
export const REWARD_REVEAL_DELAY = 900;
export const CONFETTI_LIFETIME = 4200;
const motionQuery = '(prefers-reduced-motion: reduce)';
const prefersReducedMotion = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.(motionQuery).matches);

function useReducedMotion(preference) {
  const [systemReduced, setSystemReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const media = window.matchMedia?.(motionQuery);
    if (!media) return;
    const update = () => setSystemReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return Boolean(preference || systemReduced);
}

export function useCompletionReward({levelId, visible, blocked, reduced}) {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const reducedMotion = useReducedMotion(reduced);
  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = null;
    setOpen(false);
  }, []);

  // A queued result must never follow the learner into another screen or dialog.
  useEffect(() => {
    dismiss();
    return () => clearTimeout(timer.current);
  }, [levelId, visible, blocked, dismiss]);

  useEffect(() => {
    if (reducedMotion && timer.current !== null && visible && !blocked) {
      clearTimeout(timer.current);
      timer.current = null;
      setOpen(true);
    }
  }, [reducedMotion, visible, blocked]);

  const queue = useCallback(() => {
    dismiss();
    if (!visible || blocked) return;
    if (reducedMotion || prefersReducedMotion()) {
      setOpen(true);
      return;
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      setOpen(true);
    }, REWARD_REVEAL_DELAY);
  }, [dismiss, visible, blocked, reducedMotion]);

  return {open: open && visible && !blocked, queue, dismiss, reducedMotion};
}

// Deterministic spacing keeps the shower sparse, repeatable, and inexpensive.
// Mobile CSS shows only the first fourteen pieces. No canvas or animation dependency.
const pieces = Array.from({length: 22}, (_, i) => ({
  left: `${3 + (i * 43) % 94}%`,
  size: `${i % 3 === 0 ? 6 : 4}px`,
  drift: `${((i * 17) % 49) - 24}px`,
  delay: `${(i * 97) % 650}ms`,
  duration: `${2600 + (i * 113) % 750}ms`,
}));

export function PixelConfetti({reduced = false}) {
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    // Enabling reduced motion during a celebration ends it, rather than pausing it.
    if (reduced) {
      setFinished(true);
      return;
    }
    const timer = setTimeout(() => setFinished(true), CONFETTI_LIFETIME);
    return () => clearTimeout(timer);
  }, [reduced]);
  if (reduced || finished) return null;
  return createPortal(
    <div className="pixel-confetti" aria-hidden="true">
      {pieces.map((piece, i) => <i key={i} className={`pixel-confetti-piece pixel-confetti-tone-${i % 3}`} style={{
        '--confetti-left': piece.left,
        '--confetti-size': piece.size,
        '--confetti-drift': piece.drift,
        '--confetti-delay': piece.delay,
        '--confetti-duration': piece.duration,
      }}/>) }
    </div>, document.body
  );
}
