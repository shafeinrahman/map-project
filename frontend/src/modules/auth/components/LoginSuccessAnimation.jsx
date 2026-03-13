import { motion, AnimatePresence } from 'framer-motion'

export function LoginSuccessAnimation({ isAnimating }) {
  const cardVariants = {
    initial: { opacity: 1, scale: 1, rotate: 0 },
    exit: {
      opacity: 0,
      scale: 0.3,
      rotate: 360,
      x: 200,
      transition: { duration: 0.8, ease: 'easeInOut' },
    },
  }

  // Animation for splash logo swirling in
  const logoVariants = {
    hidden: {
      opacity: 0,
      scale: 0,
      rotate: -360,
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { duration: 0.9, ease: 'easeOut', delay: 0.3 },
    },
    hold: {
      opacity: 1,
      scale: 1,
      rotate: 0,
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.6, ease: 'easeInOut' },
    },
  }

  // Background overlay
  const overlayVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  }

  return (
    <AnimatePresence mode="wait">
      {isAnimating && (
        <motion.div
          className="login-success-overlay"
          variants={overlayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          key="success-overlay"
        >
          {/* Login card exit animation */}
          <motion.div
            className="login-success-exit-card"
            variants={cardVariants}
            initial="initial"
            animate="exit"
          />

          {/* Splash screen with logo */}
          <motion.div className="login-success-splash" layout>
            {/* Animated checkmark / logo */}
            <motion.div
              className="login-success-logo"
              variants={logoVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Circular background */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="55"
                  stroke="#00A86B"
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeInOut' }}
                />

                {/* Checkmark */}
                <motion.path
                  d="M 40 60 L 55 75 L 85 40"
                  stroke="#00A86B"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
                />
              </motion.svg>
            </motion.div>

            {/* App name */}
            <motion.h1
              className="login-success-app-name"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2, ease: 'easeOut' }}
              exit={{ opacity: 0 }}
            >
              Pathfinder
            </motion.h1>

            {/* Loading text */}
            <motion.p
              className="login-success-loading-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.4 }}
              exit={{ opacity: 0 }}
            >
              Loading your dashboard...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
