import { getPraepositionCount } from "../prisma/praeposition";
import { getPraeposition } from "../prisma/praeposition";
import { useSession, signOut } from "next-auth/react"
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

export default function Praeposition() {

  const { data: session } = useSession()
  const router = useRouter();
  const [newSatz, setNewSatz] = useState("");
  const [newLoesung, setNewLoesung] = useState("");
  const [newQuelle, setNewQuelle] = useState("");
  const [message, setMessage] = useState("");

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

  


  const addPraeposition = async () => {
    if (newSatz === null || newSatz === '' || newLoesung === null || newLoesung === '' || newQuelle === null || newQuelle === '') {
      setMessage("Fülle bitte alle Felder aus!");
      setTimeout(() => {
        setMessage("");
      }, 10000);
    } else {

      await fetch('/api/praeposition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          satz: newSatz,
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
    setNewSatz('');
    setNewLoesung('');
    setNewQuelle('');
  }
  

  if (session) {
    return <>
      <Head>
        <title>Erfassen</title>
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
        <h1 className="text-5xl font-bold text-center mb-8">Präposition</h1>
        <form className="my-4">
          <h1 className="text-2xl font-bold mb-4">Neu erfassen</h1>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="satz" className="block text-md font-medium text-gray-700">
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
              <label htmlFor="loesung" className="block text-md font-medium text-gray-700">
                Loesung:
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
              <label htmlFor="quelle" className="block text-md font-medium text-gray-700">
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
              addPraeposition();
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