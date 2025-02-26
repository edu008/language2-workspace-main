// components/LoadingScreen.js
import React, { useEffect, useLayoutEffect } from 'react';

const LoadingScreen = ({ message = "Lade Spielstand...", isError = false }) => {
  // Hydration-Fehler vermeiden, indem wir die Positionierung und Hintergrund nach Client-Rendering anpassen
  useLayoutEffect(() => {
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
      loadingScreen.style.position = 'fixed';
      loadingScreen.style.inset = '0';
      loadingScreen.style.zIndex = '100'; // Erhöht, um sicherzustellen, dass es oben liegt
      loadingScreen.style.background = 'transparent'; // Explizit transparent setzen
    }
  }, []);

  // CSS für die springenden Punkte (inline, oder in einer separaten CSS-Datei)
  const styles = `
    .container {
      --uib-size: 80px; /* Größere Größe für die Animation */
      --uib-color: #007bff; /* Blaue Farbe für die Punkte */
      --uib-speed: 1s;
      --uib-dot-size: calc(var(--uib-size) * 0.18);
      display: flex;
      align-items: flex-end;
      justify-content: center; /* Geändert auf center für bessere Zentrierung */
      height: calc(var(--uib-size) * 0.5);
      width: var(--uib-size);
      margin-bottom: 2rem; /* Mehr Abstand mit Tailwind mb-8 */
    }

    .dot {
      flex-shrink: 0;
      width: calc(var(--uib-size) * 0.17);
      height: calc(var(--uib-size) * 0.17);
      border-radius: 50%;
      background-color: var(--uib-color);
      transition: background-color 0.3s ease;
      opacity: 1; /* Volle Deckkraft für die Punkte, um Sichtbarkeit zu gewährleisten */
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
    <div className="loading-screen fixed inset-0 bg-transparent opacity-0 z-100 flex justify-center items-center">
      {/* Integriere die CSS-Styles als Style-Tag oder in einer separaten CSS-Datei */}
      <style>{styles}</style>
      {/* Container für die springenden Punkte, zentriert und größer */}
      <div className="flex flex-col items-center">
        <div className="container mb-8"> {/* Mehr Abstand unten mit mb-8 */}
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        {/* Nachricht oder Fehlermeldung, größer und zentriert, mit voller Opacity */}
        <p className={`text-gray-700 text-2xl font-bold opacity-100 ${isError ? 'text-red-500' : ''}`}>
          {message}
        </p>
        {/* Optional: Button zum Wiederholen bei Fehler, größer und zentriert, mit voller Opacity */}
        {isError && (
          <button
            className="mt-6 px-6 py-3 bg-blue-500 text-white text-lg rounded hover:bg-blue-600 opacity-100"
            onClick={() => window.location.reload()} // Beispiel: Seite neu laden, kann angepasst werden
          >
            Erneut versuchen
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;