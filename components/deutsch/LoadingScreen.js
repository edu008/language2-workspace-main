import React, { useEffect, useLayoutEffect } from 'react';

const LoadingScreen = ({ message = "Lade Spielstand...", isError = false }) => {
  useLayoutEffect(() => {
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
      loadingScreen.style.position = 'fixed';
      loadingScreen.style.inset = '0';
      loadingScreen.style.zIndex = '200';
      loadingScreen.style.background = 'rgba(255, 255, 255, 0.8)'; // Hintergrund auf weiß geändert
      loadingScreen.style.backdropFilter = 'blur(20px)'; // Stärkeren verschwommenen Effekt hinzugefügt
    }
  }, []);

  const styles = `
    .container {
      --uib-size: 80px;
      --uib-color: #007bff;
      --uib-speed: 1s;
      --uib-dot-size: calc(var(--uib-size) * 0.18);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      height: calc(var(--uib-size) * 0.5);
      width: var(--uib-size);
      margin-bottom: 2rem;
    }

    .dot {
      flex-shrink: 0;
      width: calc(var(--uib-size) * 0.17);
      height: calc(var(--uib-size) * 0.17);
      border-radius: 50%;
      background-color: var(--uib-color);
      transition: background-color 0.3s ease;
      opacity: 1;
    }

    .dot:nth-child(1) {
      animation: jump var(--uib-speed) ease-in-out calc(var(--uib-speed) * -0.45) infinite;
    }

    .dot:nth-child(2) {
      animation: jump var(--uib-speed) ease-in-out calc(var(--uib-speed) * -0.3) infinite;
    }

    .dot:nth-child(3) {
      animation: jump var(--uib-speed) ease-in-out calc(var(--uib-speed) * -0.15) infinite;
    }

    .dot:nth-child(4) {
      animation: jump var(--uib-speed) ease-in-out infinite;
    }

    @keyframes jump {
      0%,
      100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-200%);
      }
    }
  `;

  return (
    <div className="loading-screen fixed inset-0 flex justify-center items-center">
      <style>{styles}</style>
      <div className="flex flex-col items-center">
        <div className="container mb-8">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        <p className={`text-black text-2xl font-bold ${isError ? 'text-red-500' : ''}`}>
          {message}
        </p>
        {isError && (
          <button
            className="mt-6 px-6 py-3 bg-blue-500 text-white text-lg rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            Erneut versuchen
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
