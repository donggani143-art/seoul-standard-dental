'use client';
import { motion } from 'framer-motion';

export default function PageTransition({ children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 70, damping: 24, mass: 1.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
