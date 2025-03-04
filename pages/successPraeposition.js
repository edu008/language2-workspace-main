import { useSession, signOut } from "next-auth/react";
import Link from 'next/link';
import { debounce } from 'lodash';
import Image from 'next/image';
import Router from "next/router";
import { useState } from "react";
import { getSession } from 'next-auth/react';
import { getPraeposition } from "../prisma/praeposition";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTrashRestore, faPaperPlane, faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import Message from "./Message";
import Head from 'next/head';

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (session) {
    const praeposition = await getPraeposition();

    const res2 = await fetch(`http://localhost:3000/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=praeposition`);
    const standingData = await res2.json();
    const finished = standingData.summary || []; // Extrahiere das Array aus summary

    console.log("Praeposition Daten:", praeposition);
    console.log("Standing Data (kategorie=praeposition):", standingData);
    console.log("Finished Einträge (kategorie=praeposition):", finished);

    const filteredPraeposition = praeposition.filter((praepositionObj) => {
      return !finished.some((finishedObj) => {
        return finishedObj.exercise === praepositionObj.id && finishedObj.kategorie === "praeposition";
      });
    });
    console.log("Filtered Praeposition (nicht gemeistert):", filteredPraeposition);

    if (filteredPraeposition.length > 0) {
      return {
        redirect: {
          destination: "/praeposition?redirected=true",
          permanent: false,
        },
      };
    } else {
      return {
        props: {}
      };
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

export default function SuccessPraeposition() {
  const { data: session } = useSession();
  const debouncedHandleClick = debounce((callback) => callback(), 500);
  const [newSatz, setNewSatz] = useState("");
  const [newLoesung, setNewLoesung] = useState("");
  const [newQuelle, setNewQuelle] = useState("");
  const [newDatum, setNewDatum] = useState("");
  const [message, setMessage] = useState("");

  const handleREV = async () => {
    const user = session.user.email;
    const kategorie = 'praeposition';
    fetch('/api/standing', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user, kategorie })
    })
      .then(response => response.json())
      .then(data => {
        console.log("REV Response (kategorie=praeposition):", data);
      })
      .catch(error => console.error("Fehler beim Zurücksetzen (kategorie=praeposition):", error));
    Router.push("/praeposition");
  };

  const addPraeposition = async () => {
    if (!newSatz || !newLoesung || !newQuelle || !newDatum) {
      setMessage("Fülle bitte alle Felder aus!");
      setTimeout(() => {
        setMessage("");
      }, 10000);
    } else {
      await fetch('/api/praeposition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Satz: newSatz,
          Loesung: newLoesung,
          Quelle: newQuelle,
          Datum: new Date(newDatum),
        })
      })
        .then(res => res.json());
      resetForm();
      setMessage("Erfolgreich hinzugefügt!");
      setTimeout(() => {
        setMessage("");
      }, 10000);
      Router.push("/praeposition");
    }
  };

  const resetForm = () => {
    setNewSatz('');
    setNewLoesung('');
    setNewQuelle('');
    setNewDatum('');
  };

  if (session) {
    return (
      <>
        <Head>
          <title>Präpositionen</title>
        </Head>
        <div className="flex justify-between items-center bg-gray-100 p-4">
          <Link href="/" className="py-2 px-4 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold text-xm">
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2 fa-lg fa-fw" />Übungsauswahl
          </Link>
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
          <h1 className="text-5xl font-bold text-center mb-8">
            Du hast alle Präpositionen gemeistert! Mit dem Button kannst du den Übungsfortschritt zurücksetzen oder im Formular neue Präpositionen erfassen
          </h1>
          <div className="flex justify-center mt-4">
            <button className="max-w flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded text-2xl" onClick={() => debouncedHandleClick(handleREV)}>
              <FontAwesomeIcon icon={faTrashRestore} className="mr-2 fa-lg fa-fw" />
            </button>
          </div>
          <form className="my-4">
            <h1 className="text-2xl font-bold mb-4">Neue Präposition erfassen</h1>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-5">
                  <label htmlFor="satz" className="block text-md font-medium text-gray-700">Satz:</label>
                  <input
                    id="satz"
                    type="text"
                    onChange={(e) => setNewSatz(e.target.value)}
                    value={newSatz}
                    className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                    style={{ height: '2.5rem' }}
                  />
                </div>
                <div className="mb-5">
                  <label htmlFor="loesung" className="block text-md font-medium text-gray-700">Lösung:</label>
                  <input
                    id="loesung"
                    type="text"
                    onChange={(e) => setNewLoesung(e.target.value)}
                    value={newLoesung}
                    className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                    style={{ height: '2.5rem' }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-5">
                  <label htmlFor="quelle" className="block text-md font-medium text-gray-700">Quelle:</label>
                  <input
                    id="quelle"
                    type="text"
                    onChange={(e) => setNewQuelle(e.target.value)}
                    value={newQuelle}
                    className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                    style={{ height: '2.5rem' }}
                  />
                </div>
                <div className="mb-5">
                  <label htmlFor="datum" className="block text-md font-medium text-gray-700">Datum:</label>
                  <input
                    id="datum"
                    type="date"
                    onChange={(e) => setNewDatum(e.target.value)}
                    value={newDatum}
                    className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                    style={{ height: '2.5rem' }}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
            {message && <Message message={message} />}
            <button
              onClick={(e) => { e.preventDefault(); addPraeposition(); }}
              className="mt-4 w-full px-4 py-2 rounded text-2xl font-semibold text-white bg-blue-600 hover:bg-blue-700"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="mr-2 fa-lg fa-fw" />
            </button>
          </form>
        </div>
      </>
    );
  }
}