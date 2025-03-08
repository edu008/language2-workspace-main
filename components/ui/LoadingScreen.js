import React, { useEffect, useState } from 'react';

// CSS-based German Flag Icon instead of Framer Motion
const GermanFlagIcon = ({ className }) => {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} animate-scale-in`}
    >
      <rect x="20" y="30" width="80" height="20" fill="#000000" className="animate-grow-x origin-left" style={{ animationDelay: '100ms' }} />
      <rect x="20" y="50" width="80" height="20" fill="#DD0000" className="animate-grow-x origin-left" style={{ animationDelay: '200ms' }} />
      <rect x="20" y="70" width="80" height="20" fill="#FFCE00" className="animate-grow-x origin-left" style={{ animationDelay: '300ms' }} />
      <path
        d="M20 30C20 24.4772 24.4772 20 30 20H90C95.5228 20 100 24.4772 100 30V90C100 95.5228 95.5228 100 90 100H30C24.4772 100 20 95.5228 20 90V30Z"
        stroke="rgba(220, 220, 220, 0.5)"
        strokeWidth="2.5"
        fill="none"
        className="animate-draw"
        style={{ animationDelay: '400ms' }}
      />
    </svg>
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
    <div className="fixed inset-0 bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center items-center p-6 z-50 animate-fade-in">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <div className="relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <GermanFlagIcon className="w-24 h-24" />
            <div className="absolute inset-0 animate-pulse-glow"></div>
          </div>
        </div>
        <div className="text-center space-y-4">
          <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="inline-block glass-morph px-2 py-0.5 text-xs font-medium text-deutsch-blue mb-2">
              Deutsch Lernen
            </div>
            <h1 className={`text-3xl font-bold ${isError ? 'text-deutsch-red' : 'text-gray-900'}`}>
              {currentWord.split('').map((letter, i) => (
                <span key={`${i}-${letter}`} className="animate-fade-up" style={{ animationDelay: `${i * 50 + 300}ms` }}>
                  {letter}
                </span>
              ))}
            </h1>
            {!isError && (
              <p className="text-gray-600 text-sm font-medium">Verbessere dein Deutsch jeden Tag</p>
            )}
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
            className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden animate-fade-in-up"
            style={{ animationDelay: '500ms' }}
          >
            <div 
              className="h-full bg-deutsch-blue rounded-full transition-all duration-200 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          {isError && (
            <button
              className="mt-6 px-6 py-3 bg-deutsch-blue text-white text-lg rounded hover:bg-sky-600 animate-fade-in-up"
              style={{ animationDelay: '600ms' }}
              onClick={() => window.location.reload()}
            >
              Erneut versuchen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
