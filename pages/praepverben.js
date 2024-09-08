import { getPraepverbenCount } from "../prisma/praepverben";
import { getPraepverben } from "../prisma/praepverben";
import { useSession, signIn, signOut } from "next-auth/react"
import Link from 'next/link';
import { debounce } from 'lodash';
import Image from 'next/image'
import { useState, useEffect } from "react"
import { getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Message from "./Message";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes, faArrowLeft, faTrashRestore, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import Head from 'next/head';

export async function getServerSideProps(context) {
  const session = await getSession(context)
  if (session) {
    const praepverben = await getPraepverben();

    const kategorie = 'praepverben'

    const res = await fetch(`http://localhost:3000/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=${encodeURIComponent(kategorie)}`);
    const standingSums = await res.json();

    standingSums.trainedSum = standingSums.trainedSum ? standingSums.trainedSum : 0;
    standingSums.alltimeSum = standingSums.alltimeSum ? standingSums.alltimeSum : 0;

    const praepverbenCount = await getPraepverbenCount();

    const res2 = await fetch(`http://localhost:3000/api/standing?user=${encodeURIComponent(session.user.email)}`);
    const finished = await res2.json();

    const filteredPraepverben = praepverben.filter((praepverbenObj) => {
      return !finished.some((finishedObj) => {
        return finishedObj.exercise === praepverbenObj.id;
      });
    });

    const summary = standingSums.summary.map((standing) => {
      const matchingPraepverben = praepverben.find((praepverbenObj) => {
        return standing.exercise === praepverbenObj.id;
      });

      if (matchingPraepverben) {
        const date = new Date(matchingPraepverben.Datum);
        const formattedDate = date.toLocaleDateString();
        matchingPraepverben.Datum = formattedDate;

        return {
          summary: matchingPraepverben
        };
      } else {
        return {
          summary: null
        };
      }
    });

    if (filteredPraepverben.length === 0) {
      return {
        redirect: {
          destination: "/successPraepverben",
          permanent: false,
        },
      };
    } else {
      const randomIndex = Math.floor(Math.random() * filteredPraepverben.length);
      const randomPraepverben = filteredPraepverben[randomIndex];

      const date = new Date(randomPraepverben.Datum);
      const formattedDate = date.toLocaleDateString();
      randomPraepverben.Datum = formattedDate
      return {
        props: {
          praepverbenCount,
          praepverben: randomPraepverben,
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

export default function Praepverben({ praepverbenCount, praepverben, standingSums, summary }) {

  const { data: session } = useSession()
  const debouncedHandleClick = debounce((callback) => callback(), 500);
  const [standingExists, setStanding] = useState({})
  const [OKTrigger, setOKTrigger] = useState(0);
  const [NOKTrigger, setNOKTrigger] = useState(0);
  const router = useRouter();
  const [newErklaerung, setNewErklaerung] = useState("");
  const [newBeispiel, setNewBeispiel] = useState("");
  const [newSatz, setNewSatz] = useState("");
  const [newVerb, setNewVerb] = useState("");
  const [newLoesung, setNewLoesung] = useState("");
  const [message, setMessage] = useState("");
  const [newQuelle, setNewQuelle] = useState("");

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
    const response = await fetch(`/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(praepverben.id)}`)
    const data = await response.json()
    setStanding(data)
    setOKTrigger(prevTrigger => prevTrigger + 1)
  };

  useEffect(() => {
    if (OKTrigger > 0) {
      if (standingExists == null) {
        const user = session.user.email;
        const exercise = praepverben.id;
        const kategorie = 'praepverben'
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
    const response = await fetch(`/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(praepverben.id)}`)
    const data = await response.json()
    setStanding(data)
    setNOKTrigger(prevTrigger => prevTrigger + 1)
  };

  useEffect(() => {
    if (NOKTrigger > 0) {
      if (standingExists == null) {
        const user = session.user.email;
        const exercise = praepverben.id;
        const kategorie = 'praepverben';
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
    const kategorie = 'praepverben'
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



  /* const addPraepverben = async () => {
    if (newSatz === null || newSatz === '' || newVerb === null || newVerb === '' || newErklaerung === null || newErklaerung === '' || newBeispiel === null || newBeispiel === '' || newLoesung === null || newLoesung === '' || newQuelle === null || newQuelle === '') {
      setMessage("Fülle bitte alle Felder aus!");
      setTimeout(() => {
        setMessage("");
      }, 10000);
    } else {

      await fetch('/api/praepverben', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          satz: newSatz,
          verb: newVerb,
          beispiel: newErklaerung,
          erklaerung: newBeispiel,
          loesung: newLoesung,
          quelle: newQuelle
        })
      })
        .then(res => res.json())
      resetForm();
      setMessage("Erfolgreich hinzugefügt!");
      setTimeout(() => {
        setMessage("");
      }, 10000);
      refreshPage()
    }
  }

  const resetForm = () => {
    setNewQuelle('');
    setNewSatz('');
    setNewVerb('');
    setNewBeispiel('');
    setNewErklaerung('');
    setNewLoesung('');
  } */

  const Card = () => {
    const [showContent1, setShowContent1] = useState(true);
  
    const handleCardside = () => {
      setShowContent1(!showContent1);
    }
  
    const splitVerbs = (verbText) => {
      return verbText ? verbText.split('\n').filter(v => v.trim() !== '') : [];
    }
  
    const splitText = (text) => {
      return text ? text.split('\n').filter(v => v.trim() !== '') : [];
    }
  
    const Content1 = () => {
      return (
        <div className="min-h-full bg-white rounded-lg p-4 shadow-lg relative flex items-center">
          <div className="absolute top-0 bottom-0 left-0 right-0 bg-blue-200 opacity-50 z-10"></div>
          <div className="relative z-20 w-full max-w-full text-center">
            <p className="text-2xl mx-auto font-medium mb-5">{praepverben.Satz}</p>
            <div className="text-left mb-5">
              {splitVerbs(praepverben.Verb).map((verb, index) => (
                <p key={index} className="text-xl mx-auto">
                  <span className="bullet-point"></span> {verb}
                </p>
              ))}
            </div>
            <div className="text-left mt-28">
              <p className="text-xl mx-auto font-semibold">Beispiele</p>
              <div className="mx-auto">
                {splitText(praepverben.Beispiele).map((beispiel, index) => (
                  <p key={index} className="text-sm mx-auto">
                    <span className="bullet-point"></span> {beispiel}
                  </p>
                ))}
              </div>
              <p className="text-xl mx-auto mt-5 font-semibold">Erklärung</p>
              <div className="mx-auto">
                {splitText(praepverben.Erklaerung).map((erklaerung, index) => (
                  <p key={index} className="text-sm mx-auto">
                    <span className="bullet-point"></span> {erklaerung}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 mb-5 mr-5 text-right">
            <p className="text-sm">Quelle: {praepverben.Quelle}</p>
            <p className="text-sm">Hinzugefügt am: {praepverben.Datum}</p>
          </div>
        </div>
      );
    }
  
    const Content2 = () => {
      return (
        <div className="h-144 bg-white rounded-lg p-4 shadow-lg relative flex items-center">
          <div className="absolute top-0 bottom-0 left-0 right-0 bg-blue-200 opacity-50 z-10"></div>
          <div className="relative z-20 w-full max-w-full text-center">
            <p className="text-2xl mx-auto font-medium">{praepverben.Loesung}</p>
          </div>
          <div className="absolute bottom-0 right-0 mb-5 mr-5 text-right">
            <p className="text-sm">Quelle: {praepverben.Quelle}</p>
            <p className="text-sm">Hinzugefügt am: {praepverben.Datum}</p>
          </div>
        </div>
      );
    }
  
    return (
      <div onClick={handleCardside}>
        {showContent1 ? <Content1 /> : <Content2 />}
      </div>
    );
  }
  

  if (session) {
    return <>
      <Head>
        <title>Präpositionen & Verben</title>
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
        <h1 className="text-5xl font-bold text-center mb-8">Präpositionen & Verben</h1>
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
              <p className="text-2xl font-bold">{praepverbenCount}</p>
              <p className="text-xm font-medium text-gray-600 text-center">Erfasst</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-gray-200 rounded-lg p-4">
              <p className="text-2xl font-bold">{standingSums.finished}</p>
              <p className="text-xm font-medium text-gray-600 text-center">Vollständig erlernt</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-gray-200 rounded-lg p-4">
              <p className="text-2xl font-bold">{standingSums.trainedSum}</p>
              <p className="text-xm font-medium text-gray-600 text-center">Versuche in der Session</p>
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

        
        {/* <form className="my-4">
          <h1 className="text-2xl font-bold mb-4">Neue Präposition & Verb erfassen</h1>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="satz" className="block text_md font-medium text-gray-700">
                Satz:
              </label>
              <input
                id="satz"
                type="text"
                onChange={(e) => setNewSatz(e.target.value)}
                value={newSatz}
                className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                style={{ height: '2.5rem' }}
              />
            </div>
            <div>
              <label htmlFor="verb" className="block text_md font-medium text-gray-700">
                Verb:
              </label>
              <input
                id="verb"
                type="text"
                onChange={(e) => setNewVerb(e.target.value)}
                value={newVerb}
                className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                style={{ height: '2.5rem' }}
              />
            </div>
            <div>
              <label htmlFor="erklaerung" className="block text_md font-medium text-gray-700">
                Erklärung:
              </label>
              <input
                id="erklaerung"
                type="text"
                onChange={(e) => setNewErklaerung(e.target.value)}
                value={newErklaerung}
                className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                style={{ height: '2.5rem' }}
              />
            </div>
            <div>
              <label htmlFor="beispiel" className="block text_md font-medium text-gray-700">
                Beispiele:
              </label>
              <input
                id="beispiel"
                type="text"
                onChange={(e) => setNewBeispiel(e.target.value)}
                value={newBeispiel}
                className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                style={{ height: '2.5rem' }}
              />
            </div>
            <div>
              <label htmlFor="loesung" className="block text_md font-medium text-gray-700">
                Lösung:
              </label>
              <input
                id="loesung"
                type="text"
                onChange={(e) => setNewLoesung(e.target.value)}
                value={newLoesung}
                className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                style={{ height: '2.5rem' }}
              />
            </div>
            <div>
              <label htmlFor="quelle" className="block text_md font-medium text-gray-700">
                Quelle:
              </label>
              <input
                id="quelle"
                type="text"
                onChange={(e) => setNewQuelle(e.target.value)}
                value={newQuelle}
                className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                style={{ height: '2.5rem' }}
              />
            </div>
          </div>
          {message && <Message message={message} />}
          <button
            onClick={(e) => {
              e.preventDefault();
              addPraepverben();
            }}
            className="mt-4 w-full px-4 py-2 rounded text-2xl font-semibold text-white bg-blue-600 hover:bg-blue-700"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="mr-2 fa-lg fa-fw" />
          </button>
        </form> */}
        
        {summary.length > 0 && (
          <div>
            <h1 className="text-2xl font-bold mt-8 mb-4">Zusammenfassung der laufenden Übungssession</h1>
            <table className="table-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2">Satz</th>
                  <th className="px-4 py-2">Lösung</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((obj) => {
                  const praepverben = obj.summary;
                  return (
                    <tr>
                      <td className="border px-4 py-2">
                        <p className="normalp">{praepverben.Satz}</p>
                      </td>
                      <td className="border px-4 py-2">
                        <p className="normalp">{praepverben.Loesung}</p>
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