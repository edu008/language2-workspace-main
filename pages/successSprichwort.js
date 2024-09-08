import { useSession, signOut } from "next-auth/react"
import Link from 'next/link';
import { debounce } from 'lodash';
import Image from 'next/image'
import Router from "next/router";
import { getSession } from 'next-auth/react'
import { getSprichwort } from "../prisma/sprichwort";
import { useState } from "react"
import Message from "./Message";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTrashRestore, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import Head from 'next/head';

export async function getServerSideProps(context) {
  const session = await getSession(context)
  if (session) {
    const sprichwort = await getSprichwort();

    const res2 = await fetch(`http://localhost:3000/api/standing?user=${encodeURIComponent(session.user.email)}`);
    const finished = await res2.json();

    const filteredSprichwort = sprichwort.filter((sprichwortObj) => {
      return !finished.some((finishedObj) => {
        return finishedObj.exercise === sprichwortObj.id;
      });
    });

    if (filteredSprichwort.length > 0) {
      return {
        redirect: {
          destination: "/sprichwort",
          permanent: false,
        },
      };
    } else {
      return {
        props: {
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


export default function Success() {

  const { data: session } = useSession()
  const debouncedHandleClick = debounce((callback) => callback(), 500);
  const [newErklärung, setNewErklärung] = useState("");
  const [newBeispiel, setNewBeispiel] = useState("");
  const [newQuelle, setNewQuelle] = useState("");
  const [newWort, setNewWort] = useState("");
  const [newSprichwort, setNewSprichwort] = useState("");
  const [message, setMessage] = useState("");

  const handleREV = async () => {
    const user = session.user.email;
    const kategorie = 'sprichwort'
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
    Router.push("/sprichwort")
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
      Router.push("/sprichwort")
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
      <div class="flex justify-between items-center bg-gray-100 p-4">
        <Link href="/" class="py-2 px-4 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold text-xm"><FontAwesomeIcon icon={faArrowLeft} className="mr-2 fa-lg fa-fw" />Übungsauswahl</Link>
        <div class="flex items-center">
          <Image
            src={session.user.image}
            alt={session.user.name}
            width={40}
            height={40}
            className="rounded-full mr-4"
          />
          <p class="text-gray-700 mr-4">{session.user.email}</p>
          <button class="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-full" onClick={() => signOut()}>Abmelden</button>
        </div>
      </div>
      <div class="max-w-5xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
        <h1 class="text-5xl font-bold text-center mb-8">Du hast alle Sprichwörter gemeistert! Mit dem Button kannst du den Übungsfortschritt zurücksetzen</h1>
      <div class=" flex justify-center mt-4">
          <button class="max-w flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded text-2xl" onClick={() => debouncedHandleClick(handleREV)}><FontAwesomeIcon icon={faTrashRestore} className="mr-2 fa-lg fa-fw" /></button>
        </div>
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