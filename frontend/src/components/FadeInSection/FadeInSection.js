// src/components/FadeInSection/FadeInSection.js
import React from 'react';
import { useInView } from 'react-intersection-observer';
import './FadeInSection.css'; // Import the corresponding CSS

/**
 * A component that fades in its children when it becomes visible in the viewport.
 * Uses react-intersection-observer.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The content to be animated.
 * @param {number} [props.threshold=0.1] - Percentage of element visibility needed to trigger (0 to 1).
 * @param {boolean} [props.triggerOnce=true] - Whether the animation should only happen once.
 * @param {string} [props.className] - Optional additional CSS classes.
 * @returns {JSX.Element} The FadeInSection component.
 */
function FadeInSection({ children, threshold = 0.1, triggerOnce = true, className = '' }) {
  const { ref, inView } = useInView({
    threshold: threshold,
    triggerOnce: triggerOnce,
  });

  return (
    <div
      ref={ref}
      // Combine base class, visibility class, and any custom classes
      className={`fade-in-section ${inView ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export default FadeInSection;