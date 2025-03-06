import { useRouter } from 'next/router';
import Image from 'next/image';
import { signIn, signOut, useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';

export default function Header({ session }) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleUebungsauswahlClick = () => {
    // Set navigating state to true to prevent UI flashing
    setIsNavigating(true);
    
    // Special case for enterdeutsch page - redirect to Worterfassung
    if (router.pathname === '/enterdeutsch' || router.pathname === '/enterpraeposition' || router.pathname === '/enterpraepverben' || router.pathname === '/enterredewendung' || router.pathname === '/entersprichwort' || router.pathname === '/statistics' ) {
      router.push('/Worterfassung').then(() => {
        // Reset navigating state after navigation completes
        setIsNavigating(false);
      });
    } else {
      router.push('/').then(() => {
        // Reset navigating state after navigation completes
        setIsNavigating(false);
      });
    }
  };

  const pageTitles = {
    '/deutsch': 'Vokabeln',
    '/': 'Deutsch Lernen',
    '/Worterfassung': 'Worterfassung',
    '/praeposition': 'Präpositionen',
    '/sprichwort': 'Sprichwörter',
    '/redewendung': 'Redewendung',
    '/praepverben': 'Präpositionen & Verben',
    '/enterdeutsch': 'Bearbeitung Wortbedeutungen',
    '/enterpraeposition': 'Bearbeitung Präpositionen',
    '/entersprichwort': 'Bearbeitung Sprichwörter',
    '/enterredewendung': 'Bearbeitung Redewendung',
    '/enterpraepverben': 'Bearbeitung Präpositionen & Verben',
    '/statistics': 'Statistik',

  };

  const pageTitle = pageTitles[router.pathname] || 'Not Found';

  // Disable the button during navigation
  const buttonDisabled = isNavigating;

  return (
    <header className="bg-white/80 backdrop-blur-sm fixed top-0 w-full z-200 h-20 border-b border-gray-200 shadow-md flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-full py-2">
          {/* Linke Seite: Zurück-Button und Titel */}
          <div className="flex items-center gap-6">
            {router.pathname !== '/' && ( // Zeige den Zurück-Button nur, wenn nicht auf der exakten Route "/"
              <button
                onClick={handleUebungsauswahlClick}
                disabled={buttonDisabled}
                className={`p-2 rounded-md ${buttonDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'} transition-colors`}
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600" style={{ height: '24px', width: '24px' }} />
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              {pageTitle}
            </h1>
          </div>

          {/* Rechte Seite: Profilbild/Benutzername und Anmelden/Abmelden */}
          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <p className="text-gray-700 text-lg font-medium">
                  {session.user?.name || 'Gast'}
                </p>
                <button
                  className="text-red-600 hover:bg-gray-100 hover:text-black font-semibold text-lg flex items-center px-4 py-2 rounded-md transition-colors"
                  onClick={() => {
                    setIsNavigating(true);
                    signOut({ callbackUrl: '/' });
                  }}
                  disabled={buttonDisabled}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-log-out header-icon"
                    style={{ marginRight: '6px' }}
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" x2="9" y1="12" y2="12"></line>
                  </svg>
                  Abmelden
                </button>
              </div>
            ) : (
              <button
                className="bg-blue-500 text-white hover:bg-blue-600 font-semibold text-lg px-4 py-2 rounded-md transition-colors"
                onClick={() => signIn()}
                disabled={buttonDisabled}
              >
                Anmelden
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}