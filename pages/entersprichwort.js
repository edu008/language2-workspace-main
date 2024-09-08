import { getSprichwortCount } from "../prisma/sprichwort";
import { getSprichwort } from "../prisma/sprichwort";
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
    const sprichwort = await getSprichwort();

    const kategorie = 'sprichwort'

    const res = await fetch(`http://localhost:3000/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=${encodeURIComponent(kategorie)}`);
    const standingSums = await res.json();

    standingSums.trainedSum = standingSums.trainedSum ? standingSums.trainedSum : 0;
    standingSums.alltimeSum = standingSums.alltimeSum ? standingSums.alltimeSum : 0;

    const sprichwortCount = await getSprichwortCount();

    const res2 = await fetch(`http://localhost:3000/api/standing?user=${encodeURIComponent(session.user.email)}`);
    const finished = await res2.json();

    const filteredSprichwort = sprichwort.filter((sprichwortObj) => {
      return !finished.some((finishedObj) => {
        return finishedObj.exercise === sprichwortObj.id;
      });
    });

    const summary = standingSums.summary.map((standing) => {
      const matchingSprichwort = sprichwort.find((sprichwortObj) => {
        return standing.exercise === sprichwortObj.id;
      });

      if (matchingSprichwort) {
        const date = new Date(matchingSprichwort.Datum);
        const formattedDate = date.toLocaleDateString();
        matchingSprichwort.Datum = formattedDate;

        return {
          summary: matchingSprichwort
        };
      } else {
        return {
          summary: null
        };
      }
    });

    if (filteredSprichwort.length === 0) {
      return {
        redirect: {
          destination: "/successSprichwort",
          permanent: false,
        },
      };
    } else {
      const randomIndex = Math.floor(Math.random() * filteredSprichwort.length);
      const randomSprichwort = filteredSprichwort[randomIndex];

      const date = new Date(randomSprichwort.Datum);
      const formattedDate = date.toLocaleDateString();
      randomSprichwort.Datum = formattedDate
      return {
        props: {
          sprichwortCount,
          sprichwort: randomSprichwort,
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

export default function Sprichwort() {

  const { data: session } = useSession()
  const router = useRouter();
  const [newErklärung, setNewErklärung] = useState("");
  const [newBeispiel, setNewBeispiel] = useState("");
  const [newQuelle, setNewQuelle] = useState("");
  const [newWort, setNewWort] = useState("");
  const [newSprichwort, setNewSprichwort] = useState("");
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

 
  const addSprichwort = async () => {
    if (newSprichwort === null || newSprichwort === '' || newWort === null || newWort === '' || newErklärung === null || newErklärung === '' || newBeispiel === null || newBeispiel === '' || newQuelle === null || newQuelle === '') {
      setMessage("Fülle bitte alle Felder aus!");
      setTimeout(() => {
        setMessage("");
      }, 10000);
    } else {

      await fetch('/api/sprichwort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wort: newWort,
          sprichwort: newSprichwort,
          erklärung: newErklärung,
          beispiel: newBeispiel,
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
    setNewSprichwort('');
    setNewErklärung('');
    setNewWort('');
    setNewBeispiel('');
  }

  if (session) {
    return <>
      <Head>
        <title>Sprichwörter</title>
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
        <h1 className="text-5xl font-bold text-center mb-8">Sprichwörter</h1>
        <form className="my-4">
          <h1 className="text-2xl font-bold mb-4">Neues Sprichwort erfassen</h1>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="wort" className="block text_md font-medium text-gray-700">
                Wort:
              </label>
              <input
                id="wort"
                type="text"
                onChange={(e) => setNewWort(e.target.value)}
                value={newWort}
                className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                style={{ height: '2.5rem' }}
              />
            </div>
            <div>
              <label htmlFor="sprichwort" className="block text_md font-medium text-gray-700">
                Sprichwort:
              </label>
              <input
                id="sprichwort"
                type="text"
                onChange={(e) => setNewSprichwort(e.target.value)}
                value={newSprichwort}
                className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                style={{ height: '2.5rem' }}
              />
            </div>
            <div>
              <label htmlFor="erklärung" className="block text_md font-medium text-gray-700">
                Erklärung:
              </label>
              <input
                id="erklärung"
                type="text"
                onChange={(e) => setNewErklärung(e.target.value)}
                value={newErklärung}
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
              addSprichwort();
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