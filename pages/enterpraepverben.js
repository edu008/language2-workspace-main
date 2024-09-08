import { getPraepverbenCount } from "../prisma/praepverben";
import { getPraepverben } from "../prisma/praepverben";
import { useSession, signIn, signOut } from "next-auth/react"
import Link from 'next/link';
import Image from 'next/image'
import { useState } from "react"
import { getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Message from "./Message";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
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

export default function Praepverben() {

  const { data: session } = useSession()
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



  const addPraepverben = async () => {
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
  }

  if (session) {
    return <>
      <Head>
        <title>Präpositionen & Verben</title>
      </Head>
      <div className="flex justify-between items-center bg-gray-100 p-4">
        <Link href="/Worterfassung" className="py-2 px-4 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold text-xm"><FontAwesomeIcon icon={faArrowLeft} className="mr-2 fa-lg fa-fw" />Worterfassung</Link>
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
        
        <form className="my-4">
          <h1 className="text-2xl font-bold mb-4">Neu erfassen</h1>
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
        </form>
      </div>
    </>
  }
}