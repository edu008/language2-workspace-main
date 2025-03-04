import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { debounce } from "lodash";
import Image from "next/image";
import Router from "next/router";
import { useState } from "react";
import { getSession } from "next-auth/react";
import { getSprichwort } from "../prisma/sprichwort";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTrashRestore, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import Message from "./Message";
import Head from "next/head";

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const sprichwort = await getSprichwort();
  const res = await fetch(
    `http://localhost:3000/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=sprichwort`
  );
  const standingData = await res.json();
  const finished = standingData.summary || [];

  console.log("Sprichwort Daten:", sprichwort);
  console.log("Standing Data (kategorie=sprichwort):", standingData);
  console.log("Finished Einträge (kategorie=sprichwort):", finished);

  const filteredSprichwort = sprichwort.filter((sprichwortObj) => {
    return !finished.some(
      (finishedObj) => finishedObj.exercise === sprichwortObj.id && finishedObj.kategorie === "sprichwort"
    );
  });
  console.log("Filtered Sprichwort (nicht gemeistert):", filteredSprichwort);

  if (filteredSprichwort.length > 0) {
    return {
      redirect: {
        destination: "/sprichwort?redirected=true",
        permanent: false,
      },
    };
  } else {
    return {
      props: {},
    };
  }
}

export default function SuccessSprichwort() {
  const { data: session } = useSession();
  const debouncedHandleClick = debounce((callback) => callback(), 500);
  const [newWort, setNewWort] = useState("");
  const [newSprichwort, setNewSprichwort] = useState("");
  const [newErklaerung, setNewErklaerung] = useState("");
  const [newBeispiel, setNewBeispiel] = useState("");
  const [newQuelle, setNewQuelle] = useState("");
  const [message, setMessage] = useState("");

  const handleREV = async () => {
    const user = session.user.email;
    const kategorie = "sprichwort";
    fetch("/api/standing", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user, kategorie }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("REV Response (kategorie=sprichwort):", data);
      })
      .catch((error) => console.error("Fehler beim Zurücksetzen (kategorie=sprichwort):", error));
    Router.push("/sprichwort");
  };

  const addSprichwort = async () => {
    if (!newWort || !newSprichwort || !newErklaerung || !newBeispiel || !newQuelle) {
      setMessage("Fülle bitte alle Felder aus!");
      setTimeout(() => {
        setMessage("");
      }, 10000);
    } else {
      await fetch("/api/sprichwort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Wort: newWort,
          Sprichwort: newSprichwort,
          Erklaerung: newErklaerung,
          Beispiel: newBeispiel,
          Quelle: newQuelle,
          Datum: new Date(), // Aktuelles Datum automatisch hinzufügen, wie im Prisma-Skript
        }),
      }).then((res) => res.json());
      resetForm();
      setMessage("Erfolgreich hinzugefügt!");
      setTimeout(() => {
        setMessage("");
      }, 10000);
      Router.push("/sprichwort");
    }
  };

  const resetForm = () => {
    setNewWort("");
    setNewSprichwort("");
    setNewErklaerung("");
    setNewBeispiel("");
    setNewQuelle("");
  };

  if (session) {
    return (
      <>
        <Head>
          <title>Sprichwörter</title>
        </Head>
        <div className="flex justify-between items-center bg-gray-100 p-4">
          <Link
            href="/"
            className="py-2 px-4 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold text-xm"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2 fa-lg fa-fw" />
            Übungsauswahl
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
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-full"
              onClick={() => signOut()}
            >
              Abmelden
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold text-center mb-8">
            Du hast alle Sprichwörter gemeistert! Mit dem Button kannst du den Übungsfortschritt zurücksetzen oder im
            Formular neue Sprichwörter erfassen
          </h1>
          <div className="flex justify-center mt-4">
            <button
              className="max-w flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded text-2xl"
              onClick={() => debouncedHandleClick(handleREV)}
            >
              <FontAwesomeIcon icon={faTrashRestore} className="mr-2 fa-lg fa-fw" />
            </button>
          </div>
          <form className="my-4">
            <h1 className="text-2xl font-bold mb-4">Neues Sprichwort erfassen</h1>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-5">
                  <label htmlFor="wort" className="block text-md font-medium text-gray-700">
                    Hauptwort:
                  </label>
                  <input
                    id="wort"
                    type="text"
                    onChange={(e) => setNewWort(e.target.value)}
                    value={newWort}
                    className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                    style={{ height: "2.5rem" }}
                  />
                </div>
                <div className="mb-5">
                  <label htmlFor="sprichwort" className="block text-md font-medium text-gray-700">
                    Sprichwort:
                  </label>
                  <input
                    id="sprichwort"
                    type="text"
                    onChange={(e) => setNewSprichwort(e.target.value)}
                    value={newSprichwort}
                    className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                    style={{ height: "2.5rem" }}
                  />
                </div>
                <div className="mb-5">
                  <label htmlFor="erklaerung" className="block text-md font-medium text-gray-700">
                    Erklärung:
                  </label>
                  <input
                    id="erklaerung"
                    type="text"
                    onChange={(e) => setNewErklaerung(e.target.value)}
                    value={newErklaerung}
                    className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                    style={{ height: "2.5rem" }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-5">
                  <label htmlFor="beispiel" className="block text-md font-medium text-gray-700">
                    Beispiel:
                  </label>
                  <input
                    id="beispiel"
                    type="text"
                    onChange={(e) => setNewBeispiel(e.target.value)}
                    value={newBeispiel}
                    className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                    style={{ height: "2.5rem" }}
                  />
                </div>
                <div className="mb-5">
                  <label htmlFor="quelle" className="block text-md font-medium text-gray-700">
                    Quelle:
                  </label>
                  <input
                    id="quelle"
                    type="text"
                    onChange={(e) => setNewQuelle(e.target.value)}
                    value={newQuelle}
                    className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                    style={{ height: "2.5rem" }}
                  />
                </div>
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
    );
  }
}