import { getPraepositionCount } from "../prisma/praeposition";
import { getPraeposition } from "../prisma/praeposition";
import { useSession, signOut } from "next-auth/react"
import Link from 'next/link';
import { debounce } from 'lodash';
import Image from 'next/image'
import { useState, useEffect } from "react"
import { getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes, faArrowLeft, faTrashRestore, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import Head from 'next/head';


export async function getServerSideProps(context) {
  const session = await getSession(context)
  if (session) {
    const praeposition = await getPraeposition();

    const kategorie = 'praeposition'

    const res = await fetch(`http://localhost:3000/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=${encodeURIComponent(kategorie)}`);
    const standingSums = await res.json();

    standingSums.trainedSum = standingSums.trainedSum ? standingSums.trainedSum : 0;
    standingSums.alltimeSum = standingSums.alltimeSum ? standingSums.alltimeSum : 0;

    const praepositionCount = await getPraepositionCount();

    const res2 = await fetch(`http://localhost:3000/api/standing?user=${encodeURIComponent(session.user.email)}`);
    const finished = await res2.json();

    const filteredPraeposition = praeposition.filter((praepositionObj) => {
      return !finished.some((finishedObj) => {
        return finishedObj.exercise === praepositionObj.id;
      });
    });

    const summary = standingSums.summary.map((standing) => {
      const matchingPraeposition = praeposition.find((praepositionObj) => {
        return standing.exercise === praepositionObj.id;
      });

      if (matchingPraeposition) {
        const date = new Date(matchingPraeposition.Datum);
        const formattedDate = date.toLocaleDateString();
        matchingPraeposition.Datum = formattedDate;
        return {
          summary: matchingPraeposition
        };
      } else {
        return {
          summary: null
        };
      }
    });

    if (filteredPraeposition.length === 0) {
      return {
        redirect: {
          destination: "/successPraeposition",
          permanent: false,
        },
      };
    } else {
      const randomIndex = Math.floor(Math.random() * filteredPraeposition.length);
      const randomPraeposition = filteredPraeposition[randomIndex];

      const date = new Date(randomPraeposition.Datum);
      const formattedDate = date.toLocaleDateString();
      randomPraeposition.Datum = formattedDate

      return {
        props: {
          praepositionCount,
          praeposition: randomPraeposition,
          standingSums,
          summary
        }
      }
    }
  } else {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
}

export default function Praeposition({ praepositionCount, praeposition, standingSums, summary }) {

  const { data: session } = useSession()
  const debouncedHandleClick = debounce((callback) => callback(), 500);
  const [standingExists, setStanding] = useState({})
  const [OKTrigger, setOKTrigger] = useState(0);
  const [NOKTrigger, setNOKTrigger] = useState(0);
  const router = useRouter();

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', (event) => {
      if (!event.persisted) {
        if (session) {
          const standingIN = session.user.email;
          const button = "trained";
          fetch('/api/standing', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ standingIN, button })
          })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error(error));
        }
      }
    });
  }

  const refreshPage = () => {
    router.replace(router.asPath, undefined, { scroll: false });
  };

  const handleOK = async () => {
    const response = await fetch(`/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(praeposition.id)}`)
    const data = await response.json()
    setStanding(data)
    setOKTrigger(prevTrigger => prevTrigger + 1)
  };

  useEffect(() => {
    if (OKTrigger > 0) {
      if (standingExists == null) {
        const user = session.user.email;
        const exercise = praeposition.id;
        const kategorie = 'praeposition'
        const button = 'OK';
        fetch('/api/standing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user, exercise, button, kategorie })
        })
          .then(response => response.json())
          .then(data => console.log(data))
          .catch(error => console.error(error));
      } else {
        const standingIN = standingExists.id;
        const button = "OK";
        fetch('/api/standing', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ standingIN, button })
        })
          .then(response => response.json())
          .then(data => console.log(data))
          .catch(error => console.error(error));
      }
      refreshPage()
    }
  }, [OKTrigger]);

  const handleNOK = async () => {
    const response = await fetch(`/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(praeposition.id)}`)
    const data = await response.json()
    setStanding(data)
    setNOKTrigger(prevTrigger => prevTrigger + 1)
  };

  useEffect(() => {
    if (NOKTrigger > 0) {
      if (standingExists == null) {
        const user = session.user.email;
        const exercise = praeposition.id;
        const kategorie = 'praeposition';
        const button = 'NOK';
        fetch('/api/standing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user, exercise, button, kategorie })
        })
          .then(response => response.json())
          .then(data => console.log(data))
          .catch(error => console.error(error));
      } else {
        const standingIN = standingExists.id;
        const button = "NOK";
        fetch('/api/standing', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ standingIN, button })
        })
          .then(response => response.json())
          .then(data => console.log(data))
          .catch(error => console.error(error));
      }
      refreshPage()
    }
  }, [NOKTrigger]);

  const handleREV = async () => {
    const user = session.user.email;
    const kategorie = 'praeposition'
    fetch('/api/standing', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user, kategorie })
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
      })
      .catch(error => console.error(error));
    refreshPage()
  };


  const Card = () => {
    const [showContent1, setShowContent1] = useState(true);

    const handleCardside = () => {
      setShowContent1(!showContent1);
    }

    const PraepositionenListe = ({ satz }) => {
      const satzTeile = satz.split('__');
      return (
        <div>
          {satzTeile[0]}
          {satzTeile.slice(1).map((teil, index) => (
            <div key={index} className="mb-2">
              __ {teil}
            </div>
          ))}
        </div>
      );
    };


    const PraepositionenMitLoesungen = ({ satz, loesung }) => {
      const satzTeile = satz.split("_"); // Satz am "_" trennen
    
      // Wenn es nur ein einzelnes Wort in der Lösung gibt, und der Satz mehrere Lücken hat, 
      // dann fülle alle Lücken mit dieser Lösung
      const loesungen = typeof loesung === "string" ? loesung.split(",") : loesung;
    
      // Wenn nur ein einziges Wort als Lösung existiert, und mehrere _ im Satz sind,
      // dann fülle alle _ mit dieser Lösung
      const gefuellteLoesungen =
        loesungen.length === 1 && satzTeile.length > 1
          ? Array(satzTeile.length - 1).fill(loesungen[0])
          : loesungen;
    
      return (
        <span>
          {satzTeile.map((teil, index) => (
            <span key={index}>
              {teil}
              {index < gefuellteLoesungen.length && (
                <strong> {gefuellteLoesungen[index].trim()} </strong>
              )}
            </span>
          ))}
        </span>
      );
    };
    
    
    
    
    const Content1 = () => {
      return (
        <div className="h-144 bg-white rounded-lg p-4 shadow-lg relative flex items-center">
          <div className="absolute top-0 bottom-0 left-0 right-0 bg-orange-200 opacity-50 z-10"></div>
          <div className="relative z-20 w-full max-w-full text-center">
            <div className="text-4xl mx-auto">
              <PraepositionenListe satz={praeposition.Satz} />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 mb-5 mr-5 text-right">
            <p className="text-sm">Quelle: {praeposition.Quelle}</p>
            <p className="text-sm">Hinzugefügt am: {praeposition.Datum}</p>
          </div>
        </div>
      );
    }
    
    const Content2 = () => {
      const satz = praeposition.Satz; // Beispiel: "Wir sterben _ Langeweile."
      const loesung = praeposition.Loesung; // Beispiel: "vor" oder "in, an, auf"
    
      return (
        <div className="h-144 bg-white rounded-lg p-4 shadow-lg relative flex items-center">
          <div className="absolute top-0 bottom-0 left-0 right-0 bg-orange-200 opacity-50 z-10"></div>
          <div className="relative z-20 w-full max-w-full text-center">
            <div className="text-4xl mx-auto">
              <PraepositionenMitLoesungen satz={satz} loesung={loesung} />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 mb-5 mr-5 text-right">
            <p className="text-sm">Quelle: {praeposition.Quelle}</p>
            <p className="text-sm">Hinzugefügt am: {praeposition.Datum}</p>
          </div>
        </div>
      );
    };
    
    
    return (
      <div onClick={handleCardside}>
        {showContent1
          ? <Content1 />
          : <Content2 />
        }
      </div>
    );
  }

  if (session) {
    return <>
      <Head>
        <title>Präpositionen</title>
      </Head>
      <div className="flex justify-between items-center bg-gray-100 p-4">
        <Link href="/" className="py-2 px-4 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold text-xm"><FontAwesomeIcon icon={faArrowLeft} className="mr-2 fa-lg fa-fw" />Übungsauswahl</Link>
        <div className="flex items-center">
          <Image
            src={session.user.image}
            alt={session.user.name}
            width={40}
            height={40}
            className="rounded-full mr-4"
          />
          <p className="text-gray-700 mr-4">{session.user.email}</p>
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-full" onClick={() => signOut()}>Abmelden</button>
        </div>
      </div>
      <div className="max-w-5xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold text-center mb-8">Präpositionen</h1>
        <Card />
        <div className="flex justify-between items-center mb-4 mt-4">
          <button className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded mr-4 text-2xl" onClick={() => debouncedHandleClick(handleOK)}>
            <FontAwesomeIcon icon={faCheck} className="mr-2 fa-lg fa-fw" />
          </button>
          <button className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded text-2xl" onClick={() => debouncedHandleClick(handleNOK)}>
            <FontAwesomeIcon icon={faTimes} className="mr-2 fa-lg fa-fw" />
          </button>
        </div>
        <div className="max-w-5xl mx-auto py-2 px-4 sm:px-6 lg:px-8 mt-4">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col items-center justify-center bg-gray-200 rounded-lg p-4">
              <p className="text-2xl font-bold">{praepositionCount}</p>
              <p className="text-xm font-medium text-gray-600 text-center">Erfasst</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-gray-200 rounded-lg p-4">
              <p className="text-2xl font-bold">{standingSums.finished}</p>
              <p className="text-xm font-medium text-gray-600 text-center">Vollständig erlernt</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-gray-200 rounded-lg p-4">
              <p className="text-2xl font-bold">{standingSums.trainedSum}</p>
              <p className="text-xm font-medium text-gray-600 text-center">Versuche der Session</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-gray-200 rounded-lg p-4">
              <p className="text-2xl font-bold">{standingSums.alltimeSum}</p>
              <p className="text-xm font-medium text-gray-600 text-center">Versuche gesamt</p>
            </div>
          </div>
          <div className=" flex justify-center mt-4">
          <button className="max-w flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded text-2xl" onClick={() => debouncedHandleClick(handleREV)}><FontAwesomeIcon icon={faTrashRestore} className="mr-2 fa-lg fa-fw" /></button>
        </div>
        </div>

        
        {summary.length > 0 && (
          <div>
            <h1 className="text-2xl font-bold mt-8 mb-4">Zusammenfassung der laufenden Übungssession</h1>
            <table className="table-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2">Satz</th>
                  <th className="px-4 py-2">Loesung</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((obj) => {
                  const praeposition = obj.summary;
                  return (
                    <tr>
                      <td className="border px-4 py-2">
                        <p className="normalp">{praeposition.Satz}</p>
                      </td>
                      <td className="border px-4 py-2">
                        <p className="normalp">{praeposition.Loesung}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div >)}
      </div>
    </>
  }
}