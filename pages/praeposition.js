import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { debounce } from "lodash";
import Head from "next/head";
import Header from "../components/deutsch/Header";
import ActionButtons from "../components/deutsch/ActionButtons";
import Stats from "../components/deutsch/Stats";
import PraepositionCard from "../components/deutsch/WordCardPraeposition";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashRestore } from "@fortawesome/free-solid-svg-icons";
import LoadingScreen from "../components/deutsch/LoadingScreen";
import { Button } from "@material-tailwind/react";
import { getPraepositionCount, getPraeposition } from "../prisma/praeposition";


export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  let praeposition = [];
  try {
    praeposition = await getPraeposition();
    if (!Array.isArray(praeposition)) {
      console.error("getPraeposition returned non-array:", praeposition);
      praeposition = [];
    }
    praeposition.forEach((document) => {
      if (document.Datum instanceof Date) {
        document.Datum = document.Datum.toISOString();
      }
    });
  } catch (error) {
    console.error("Fehler beim Abrufen von praeposition:", error);
    praeposition = [];
  }

  const praepositionCount = await getPraepositionCount().catch((error) => {
    console.error("Fehler beim Abrufen von praepositionCount:", error);
    return 0;
  });

  return {
    props: {
      praepositionCount,
      praeposition,
    },
  };
}

export default function Praeposition({ praepositionCount, praeposition }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentPraeposition, setCurrentPraeposition] = useState(null);
  const [untrained, setUntrained] = useState(praeposition);
  const [repeatPool, setRepeatPool] = useState([]);
  const [trained, setTrained] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [standingSummary, setStandingSummary] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const kategorie = "praeposition"; // Sicherstellen, dass die Kategorie korrekt ist

  useEffect(() => {
    if (typeof window !== 'undefined' && status === "authenticated" && !isDataLoaded) {
      loadStanding();
    }
  }, [status, isDataLoaded]);

  const debouncedHandleClick = debounce((callback) => {
    if (!isApplyingFilters) {
      console.log("Debounced handleREV called (kategorie=praeposition)");
      callback();
    }
  }, 1000);

  const loadStanding = async () => {
    if (!session || isDataLoaded) return;
    try {
      const response = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=${kategorie}`,
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to load standing: ${response.status} - ${await response.text()}`);
      }
      const data = await response.json();
      console.log("Standing Data Loaded (kategorie=praeposition):", data);

      if (!data.summary || !Array.isArray(data.summary)) {
        console.error("Keine oder ungültige summary-Daten erhalten (kategorie=praeposition):", data);
        resetState();
        setStandingSummary([]);
        setIsDataLoaded(true);
        return;
      }

      // Filtere explizit nur Einträge mit kategorie="praeposition"
      const praepositionStandings = data.summary.filter(item => item.kategorie === "praeposition");
      console.log("Filtered Standings (kategorie=praeposition):", praepositionStandings);

      applyStandingToWords(praepositionStandings);
      // Filtere standingSummary, um nur Einträge mit vorhandenen Präpositionen und kategorie="praeposition" anzuzeigen
      setStandingSummary(praepositionStandings
        .map(item => {
          const p = praeposition.find(p => p.id === item.exercise);
          console.log(`Mapping exercise ${item.exercise} (kategorie=praeposition): Found praeposition - ${p ? p.Satz : 'none'}`);
          if (!p) return null;
          return {
            Satz: p.Satz || "",
            Loesung: p.Loesung || "",
            Datum: p ? new Date(p.Datum).toLocaleDateString("de-DE") : "",
          };
        })
        .filter(item => item !== null)
      );
      setLoadingError(null);
    } catch (error) {
      console.error("Fehler beim Laden des Standing (kategorie=praeposition):", error);
      setLoadingError(error.message);
      resetState();
      setStandingSummary([]);
      setIsDataLoaded(true);
    }
  };

  const applyStandingToWords = (standing) => {
    if (!standing || standing.length === 0) {
      console.log("Kein Spielstand vorhanden, initialisiere mit allen Präpositionen (kategorie=praeposition).");
      resetState();
    } else {
      console.log("Spielstand vorhanden, initialisiere Pools basierend auf Standing-Daten (kategorie=praeposition):", standing);
      const learnedIds = standing.filter(s => s.correct === 2).map(s => s.exercise);
      const repeatIds = standing.filter(s => s.correct === 1).map(s => s.exercise);
      const nokIds = standing.filter(s => s.correct === 0).map(s => s.exercise);

      const untrainedWords = praeposition.filter(word => 
        !learnedIds.includes(word.id) && !repeatIds.includes(word.id) && !nokIds.includes(word.id)
      );
      const repeatPoolWords = praeposition.filter(word => 
        repeatIds.includes(word.id) || nokIds.includes(word.id)
      );

      console.log("Untrained Words (kategorie=praeposition):", untrainedWords.length, untrainedWords);
      console.log("RepeatPool Words (kategorie=praeposition):", repeatPoolWords.length, repeatPoolWords);
      console.log("Learned IDs (correct = 2, kategorie=praeposition):", learnedIds.length, learnedIds);
      console.log("Repeat IDs (correct = 1, kategorie=praeposition):", repeatIds.length, repeatIds);
      console.log("NOK IDs (correct = 0, kategorie=praeposition):", nokIds.length, nokIds);

      setUntrained(untrainedWords);
      setRepeatPool(repeatPoolWords);
      const maxAttempts = standing.reduce((max, s) => Math.max(max, s.attempts || 0), 0);
      setAttempts(maxAttempts);
      setTrained(learnedIds.length);
    }
    setIsDataLoaded(true);
    applyNextPraeposition();
  };

  const resetState = () => {
    setUntrained(praeposition);
    setRepeatPool([]);
    setTrained(0);
    setAttempts(0);
    setStandingSummary([]);
    setCurrentPraeposition(null);
  };

  const saveToServer = async (action, exerciseData = {}) => {
    if (!session) return;
    const { exercise, standingId, correct, attempts } = exerciseData;
    const validatedCorrect = Number.isInteger(correct) && correct >= 0 && correct <= 2 ? correct : 0;
    const payloadKategorie = "praeposition"; // Explizit "praeposition" setzen, um Fehler zu vermeiden

    try {
      let response;
      const payload = {
        user: session.user.email,
        exercise,
        button: action,
        kategorie: payloadKategorie, // Sicherstellen, dass kategorie="praeposition" ist
        correct: validatedCorrect,
        attempts: attempts ?? 0,
      };
      console.log(`Saving to server (kategorie=${payloadKategorie}): action=${action}, payload=`, payload);

      if (action === "OK" || action === "NOK") {
        if (standingId) {
          response = await fetch("/api/standing", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              standingIN: standingId,
              ...payload,
            }),
          });
        } else {
          response = await fetch("/api/standing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
      } else if (action === "REV") {
        response = await fetch("/api/standing", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: session.user.email,
            kategorie: payloadKategorie, // Sicherstellen, dass kategorie="praeposition" ist
          }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server responded with ${response.status}: ${errorText} (kategorie=${payloadKategorie})`);
        throw new Error(`Fehler bei ${action} Aktion: ${errorText}`);
      }
      const data = await response.json();
      console.log("Server response (kategorie=praeposition):", data);
      if (action === "REV") {
        setStandingSummary([]);
      } else if (action === "OK" || action === "NOK") {
        await loadStanding();
      }
      return data;
    } catch (error) {
      console.error(`Fehler beim Senden an Server (kategorie=${payloadKategorie}, ${action}):`, error);
      throw error;
    }
  };

  const applyNextPraeposition = async () => {
    if (isApplyingFilters || (!Array.isArray(untrained) || !Array.isArray(repeatPool))) {
      console.error("Ungültige Pools (kategorie=praeposition):", { untrained, repeatPool });
      return;
    }
    setIsApplyingFilters(true);
    try {
      const randomCount = Math.floor(Math.random() * 8) + 3;
      const pool = (attempts > 0 && randomCount === 10 && repeatPool.length > 0) ? repeatPool : untrained;

      if (pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        const randomPraeposition = { ...pool[randomIndex] };
        randomPraeposition.Datum = new Date(randomPraeposition.Datum).toLocaleDateString("de-DE");
        setCurrentPraeposition(randomPraeposition);
      } else {
        setCurrentPraeposition(null);
      }
    } finally {
      setIsApplyingFilters(false);
    }
  };

  useEffect(() => {
    if (isDataLoaded && !isApplyingFilters) {
      const timer = setTimeout(() => applyNextPraeposition(), 200);
      return () => clearTimeout(timer);
    }
  }, [untrained, repeatPool, attempts, isDataLoaded]);

  const handleOK = async () => {
    if (!currentPraeposition || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      const exercise = currentPraeposition.id;
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const standingResponse = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(exercise)}&kategorie=${kategorie}`
      );
      const standing = await standingResponse.json();
      console.log("Standing Response for OK (kategorie=praeposition):", standing);

      const correct = standing && Object.keys(standing).length > 0 ? Math.min((standing.correct || 0) + 1, 2) : 1;

      await saveToServer("OK", {
        exercise,
        standingId: standing?.id,
        correct,
        attempts: newAttempts,
      });

      setUntrained(prev => prev.filter(word => word.id !== exercise));
      setRepeatPool(prev => (correct < 2 ? [...prev, currentPraeposition] : prev));

      if (correct === 2) setTrained(prev => prev + 1);

      const newEntry = {
        Satz: currentPraeposition.Satz,
        Loesung: currentPraeposition.Loesung,
        Datum: currentPraeposition.Datum,
      };
      setStandingSummary(prev => {
        if (!prev.some(entry => entry.Satz === newEntry.Satz)) {
          return [...prev, newEntry];
        }
        return prev;
      });

      await new Promise(resolve => setTimeout(resolve, 300));
      await applyNextPraeposition();
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleNOK = async () => {
    if (!currentPraeposition || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      const exercise = currentPraeposition.id;
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const standingResponse = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(exercise)}&kategorie=${kategorie}`
      );
      const standing = await standingResponse.json();
      console.log("Standing Response for NOK (kategorie=praeposition):", standing);

      await saveToServer("NOK", {
        exercise,
        standingId: standing?.id,
        correct: 0,
        attempts: newAttempts,
      });

      setUntrained(prev => [...prev, currentPraeposition]);
      setRepeatPool(prev => prev.filter(word => word.id !== exercise));

      const newEntry = {
        Satz: currentPraeposition.Satz,
        Loesung: currentPraeposition.Loesung,
        Datum: currentPraeposition.Datum,
      };
      setStandingSummary(prev => {
        if (!prev.some(entry => entry.Satz === newEntry.Satz)) {
          return [...prev, newEntry];
        }
        return prev;
      });

      await new Promise(resolve => setTimeout(resolve, 300));
      await applyNextPraeposition();
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleREV = async () => {
    if (!session || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      console.log("Starting handleREV - deleting standings and resetting state (kategorie=praeposition)...");
      const response = await saveToServer("REV");
      console.log("Server response after DELETE (kategorie=praeposition):", response);
      console.log("Alle Standing-Einträge für den Benutzer (kategorie=praeposition) gelöscht und Score zurückgesetzt.");

      await new Promise(resolve => setTimeout(resolve, 2000));
      resetState();
      setIsDataLoaded(false);
      await loadStanding();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await applyNextPraeposition();
    } catch (error) {
      console.error("Fehler in handleREV (kategorie=praeposition):", error);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  // Handhabung des Redirects für den Spielstand
  useEffect(() => {
    if (router.query.redirected === "true" && !isDataLoaded && !isApplyingFilters) {
      setIsDataLoaded(false); // Sicherstellen, dass loadStanding erneut ausgeführt wird
      loadStanding();
      setErrorMessage(
        "Der Fortschritt wurde automatisch zurückgesetzt, da alle Präpositionen erlernt wurden!"
      );
      resetState();
      router.replace("/praeposition", undefined, { shallow: true });
    }
  }, [router.query.redirected, isDataLoaded, isApplyingFilters]);

  if (!session) return <div>Lade...</div>;
  if (!isDataLoaded) {
    if (loadingError) {
      return <LoadingScreen message={`Fehler beim Laden: ${loadingError}`} isError={true} />;
    }
    return <LoadingScreen message="Lade Spielstand..." />;
  }

  const progress = Math.round((trained / praepositionCount) * 100) || 0;

  return (
    <>
      <Head>
        <title>Präpositionen</title>
      </Head>
      {session && (
        <>
          <Header session={session} />
          <main className="flex justify-end items-start w-full p-6 z-0" style={{ marginTop: "96px" }}>
            <div className="flex gap-4">
              <Button
                onClick={handleREV}
                className="py-2 px-4 rounded-md bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faTrashRestore} />
                Alle Daten löschen
              </Button>
            </div>
          </main>

          <div className="max-w-5xl mx-auto py-2 px-4 sm:px-6 lg:px-8" style={{ minHeight: "800px", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {currentPraeposition ? (
              <PraepositionCard
                wordData={{
                  satz: currentPraeposition.Satz,
                  loesung: currentPraeposition.Loesung,
                  quelle: currentPraeposition.Quelle,
                  datum: currentPraeposition.Datum,
                }}
                showTranslation={showTranslation}
                onFlip={() => setShowTranslation(!showTranslation)}
              />
            ) : (
              <div>Keine Präpositionen verfügbar. Alle wurden gelernt!</div>
            )}
            <div className="mt-4" style={{ minHeight: "100px" }}>
              <ActionButtons
                onCorrect={() => debouncedHandleClick(handleOK)}
                onIncorrect={() => debouncedHandleClick(handleNOK)}
                isLoading={isApplyingFilters}
              />
            </div>
            <div className="mt-4" style={{ minHeight: "50px" }}>
              <Stats
                totalCount={praepositionCount}
                trainedCount={trained}
                attempts={attempts}
                progress={progress}
              />
            </div>
            {standingSummary.length > 0 && (
              <table className="table-auto border-collapse border border-gray-300 mt-4 w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Satz</th>
                    <th className="border border-gray-300 p-2 text-left">Lösung</th>
                  </tr>
                </thead>
                <tbody>
                  {standingSummary.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="border border-gray-300 p-2">{item.Satz}</td>
                      <td className="border border-gray-300 p-2">{item.Loesung}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  );
}