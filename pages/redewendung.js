import { getRedewendungCount } from "../prisma/redewendung";
import { getRedewendung } from "../prisma/redewendung";
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
    const redewendung = await getRedewendung();

    const kategorie = 'redewendung'

    const res = await fetch(`http://localhost:3000/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=${encodeURIComponent(kategorie)}`);
    const standingSums = await res.json();

    standingSums.trainedSum = standingSums.trainedSum ? standingSums.trainedSum : 0;
    standingSums.alltimeSum = standingSums.alltimeSum ? standingSums.alltimeSum : 0;

    const redewendungCount = await getRedewendungCount();

    const res2 = await fetch(`http://localhost:3000/api/standing?user=${encodeURIComponent(session.user.email)}`);
    const finished = await res2.json();

    const filteredRedewendung = redewendung.filter((redewendungObj) => {
      return !finished.some((finishedObj) => {
        return finishedObj.exercise === redewendungObj.id;
      });
    });

    const summary = standingSums.summary.map((standing) => {
      const matchingRedewendung = redewendung.find((redewendungObj) => {
        return standing.exercise === redewendungObj.id;
      });

      if (matchingRedewendung) {
        const date = new Date(matchingRedewendung.Datum);
        const formattedDate = date.toLocaleDateString();
        matchingRedewendung.Datum = formattedDate;

        return {
          summary: matchingRedewendung
        };
      } else {
        return {
          summary: null
        };
      }
    });

    if (filteredRedewendung.length === 0) {
      return {
        redirect: {
          destination: "/successRedewendung",
          permanent: false,
        },
      };
    } else {
      const randomIndex = Math.floor(Math.random() * filteredRedewendung.length);
      const randomRedewendung = filteredRedewendung[randomIndex];

      const date = new Date(randomRedewendung.Datum);
      const formattedDate = date.toLocaleDateString();
      randomRedewendung.Datum = formattedDate
      return {
        props: {
          redewendungCount,
          redewendung: randomRedewendung,
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

export default function Redewendung({ redewendungCount, redewendung, standingSums, summary }) {

  const { data: session } = useSession()
  const debouncedHandleClick = debounce((callback) => callback(), 500);
  const [standingExists, setStanding] = useState({})
  const [OKTrigger, setOKTrigger] = useState(0);
  const [NOKTrigger, setNOKTrigger] = useState(0);
  const router = useRouter();
  const [newErklärung, setNewErklärung] = useState("");
  const [newBeispiel, setNewBeispiel] = useState("");
  const [newQuelle, setNewQuelle] = useState("");
  const [newWort, setNewWort] = useState("");
  const [newRedewendung, setNewRedewendung] = useState("");
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

  const handleOK = async () => {
    const response = await fetch(`/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(redewendung.id)}`)
    const data = await response.json()
    setStanding(data)
    setOKTrigger(prevTrigger => prevTrigger + 1)
  };

  useEffect(() => {
    if (OKTrigger > 0) {
      if (standingExists == null) {
        const user = session.user.email;
        const exercise = redewendung.id;
        const kategorie = 'redewendung'
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
    const response = await fetch(`/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(redewendung.id)}`)
    const data = await response.json()
    setStanding(data)
    setNOKTrigger(prevTrigger => prevTrigger + 1)
  };

  useEffect(() => {
    if (NOKTrigger > 0) {
      if (standingExists == null) {
        const user = session.user.email;
        const exercise = redewendung.id;
        const kategorie = 'redewendung';
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
    const kategorie = 'redewendung'
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



  const addRedewendung = async () => {
    if (newRedewendung === null || newRedewendung === '' || newWort === null || newWort === '' || newErklärung === null || newErklärung === '' || newBeispiel === null || newBeispiel === '' || newQuelle === null || newQuelle === '') {
      setMessage("Fülle bitte alle Felder aus!");
      setTimeout(() => {
        setMessage("");
      }, 10000);
    } else {

      await fetch('/api/redewendung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wort: newWort,
          redewendung: newRedewendung,
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
    setNewRedewendung('');
    setNewErklärung('');
    setNewWort('');
    setNewBeispiel('');
  }

  const Card = () => {
    const [showContent1, setShowContent1] = useState(true);

    const handleCardside = () => {
      setShowContent1(!showContent1);
    }
    const Content1 = () => {
      return (
        <div className="h-144 bg-white rounded-lg p-4 shadow-lg relative flex items-center">
          <div className="absolute top-0 bottom-0 left-0 right-0 bg-green-200 opacity-50 z-10"></div>
          <div className="relative z-20 w-full max-w-full text-center">
            <p className="text-2xl mx-auto font-medium">{redewendung.Redewendung}</p>
            <div className="text-left mt-28">
              <p className="text-xl mx-auto font-semibold">Hauptwort</p>
              <p className="text-xl mb-4 mx-auto">{redewendung.Wort}</p>
              {/*<p className="text-xl mx-auto font-semibold mt-5">Erklärung</p>*/} 
             <p className="mx-auto">{redewendung.Erklaerung}</p>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 mb-5 mr-5 text-right">
            <p className="text-sm">Quelle: {redewendung.Quelle}</p>
            <p className="text-sm">Hinzugefügt am: {redewendung.Datum}</p>
          </div>
        </div>
      );
    }

    const Content2 = () => {
      return (
        <div className="h-144 bg-white rounded-lg p-4 shadow-lg relative flex items-center">
          <div className="absolute top-0 bottom-0 left-0 right-0 bg-green-200 opacity-50 z-10"></div>
          <div className="relative z-20 w-full max-w-full text-center">
            <p className="text-2xl mx-auto font-medium">{redewendung.Beispiel}</p>
          </div>
          <div className="absolute bottom-0 right-0 mb-5 mr-5 text-right">
            <p className="text-sm">Quelle: {redewendung.Quelle}</p>
            <p className="text-sm">Hinzugefügt am: {redewendung.Datum}</p>
          </div>
        </div>
      );
    }


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
        <title>Redewendungen</title>
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
        <h1 className="text-5xl font-bold text-center mb-8">Redewendungen</h1>
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
              <p className="text-2xl font-bold">{redewendungCount}</p>
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


        
        {summary.length > 0 && (
          <div>
            <h1 className="text-2xl font-bold mt-8 mb-4">Zusammenfassung der laufenden Übungssession</h1>
            <table className="table-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2">Redewendung</th>
                  <th className="px-4 py-2">Erklärung</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((obj) => {
                  const redewendung = obj.summary;
                  return (
                    <tr>
                      <td className="border px-4 py-2">
                        <p className="normalp">{redewendung.Redewendung}</p>
                      </td>
                      <td className="border px-4 py-2">
                        <p className="normalp">{redewendung.Beispiel}</p>
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