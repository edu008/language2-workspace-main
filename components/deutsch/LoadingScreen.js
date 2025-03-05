import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const GermanFlagIcon = ({ className }) => {
  return (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.rect x="20" y="30" width="80" height="20" fill="#000000" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: 0.1 }} />
      <motion.rect x="20" y="50" width="80" height="20" fill="#DD0000" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: 0.2 }} />
      <motion.rect x="20" y="70" width="80" height="20" fill="#FFCE00" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: 0.3 }} />
      <motion.path
        d="M20 30C20 24.4772 24.4772 20 30 20H90C95.5228 20 100 24.4772 100 30V90C100 95.5228 95.5228 100 90 100H30C24.4772 100 20 95.5228 20 90V30Z"
        stroke="rgba(220, 220, 220, 0.5)"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
      />
    </motion.svg>
  );
};

const LoadingScreen = ({ isError = false }) => {
  const [progress, setProgress] = useState(0);
  const germanWords = ["Deutsch", "Lernen", "Sprache", "Wissen"];
  const [currentWord, setCurrentWord] = useState(germanWords[0]);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 150);

    const wordInterval = setInterval(() => {
      setCurrentWord((prev) => {
        const currentIndex = germanWords.indexOf(prev);
        return germanWords[(currentIndex + 1) % germanWords.length];
      });
    }, 1200);

    return () => {
      clearInterval(progressInterval);
      clearInterval(wordInterval);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center items-center p-6 z-50"
    >
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative">
            <GermanFlagIcon className="w-24 h-24" />
            <motion.div
              className="absolute inset-0"
              animate={{ boxShadow: ["0px 0px 0px rgba(59, 130, 246, 0)", "0px 0px 30px rgba(59, 130, 246, 0.5)", "0px 0px 0px rgba(59, 130, 246, 0)"] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
            />
          </motion.div>
        </div>
        <div className="text-center space-y-4">
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }} className="space-y-2">
            <div className="inline-block glass-morph px-2 py-0.5 text-xs font-medium text-deutsch-blue mb-2">
              Deutsch Lernen
            </div>
            <h1 className={`text-3xl font-bold ${isError ? 'text-deutsch-red' : 'text-gray-900'}`}>
              {currentWord.split('').map((letter, i) => (
                <motion.span key={`${i}-${letter}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  {letter}
                </motion.span>
              ))}
            </h1>
            {!isError && (
              <p className="text-gray-600 text-sm font-medium">Verbessere dein Deutsch jeden Tag</p>
            )}
          </motion.div>
          <motion.div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"
          >
            <motion.div className="h-full bg-deutsch-blue rounded-full" initial={{ width: "0%" }} animate={{ width: `${progress}%` }} transition={{ duration: 0.2 }} />
          </motion.div>
          {isError && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-6 px-6 py-3 bg-deutsch-blue text-white text-lg rounded hover:bg-sky-600"
              onClick={() => window.location.reload()}
            >
              Erneut versuchen
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;