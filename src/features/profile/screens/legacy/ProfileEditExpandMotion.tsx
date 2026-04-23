import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type ProfileEditExpandMotionProps = {
  open: boolean;
  children: React.ReactNode;
};

export default function ProfileEditExpandMotion({ open, children }: ProfileEditExpandMotionProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

