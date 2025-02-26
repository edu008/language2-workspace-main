import { useRouter } from 'next/router';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function Header({ session }) {
  const router = useRouter();

  const handleUebungsauswahlClick = () => {
    router.push('/');
  };

  const pageTitles = {
    '/deutsch': 'Wortbedeutungen',
    '/grammatik': 'Grammatik',
    '/synonyme': 'Synonyme',
  };

  const pageTitle = pageTitles[router.pathname] || 'Not Found';

  return (
    <header className="bg-white/80 backdrop-blur-sm fixed top-0 w-full z-200 h-20 border-b border-gray-200 shadow-md flex items-center">
      <div className="max-w-6xl mx-auto px-8 sm:px-10 lg:px-12 w-full">
        <div className="flex justify-between items-center h-full py-4">
          {/* Linke Seite: Zurück-Button und Titel */}
          <div className="flex items-center" style={{ gap: '40px' }}> {/* Inline-Style zum Testen */}
            <button
              onClick={handleUebungsauswahlClick}
              className="p-4 rounded-md hover:bg-gray-100 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600" style={{ height: '36px', width: '36px' }} /> {/* Inline-Style zum Testen */}
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
          </div>

          {/* Rechte Seite: Profilbild, Benutzername und Abmelden */}
          <div className="flex items-center" style={{ gap: '40px' }}> {/* Inline-Style zum Testen */}
            <div className="flex items-center" style={{ gap: '24px' }}>
              {session?.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              )}
              <p className="text-gray-700 text-xl font-medium">{session?.user?.name || 'Gast'}</p>
            </div>
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-md text-xl"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}