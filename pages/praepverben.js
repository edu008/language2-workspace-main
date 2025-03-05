import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { debounce } from "lodash";
import Head from "next/head";
import Header from "../components/deutsch/Header";
import ActionButtons from "../components/deutsch/ActionButtons";
import Stats from "../components/deutsch/Stats";
import PraepverbenCard from "../components/deutsch/WordCardPraepverben"; // Neue Komponente
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashRestore } from "@fortawesome/free-solid-svg-icons";
import LoadingScreen from "../components/deutsch/LoadingScreen";
import { Button } from "@material-tailwind/react";
import { getPraepverbenCount, getPraepverben } from "../prisma/praepverben";

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  let praepverben = [];
  try {
    praepverben = await getPraepverben();
    if (!Array.isArray(praepverben)) {
      console.error("getPraepverben returned non-array:", praepverben);
      praepverben = [];
    }
    praepverben.forEach((document) => {
      if (document.Datum instanceof Date) {
        document.Datum = document.Datum.toISOString();
      }
    });
  } catch (error) {
    console.error("Fehler beim Abrufen von praepverben:", error);
    praepverben = [];
  }

  const praepverbenCount = await getPraepverbenCount().catch((error) => {
    console.error("Fehler beim Abrufen von praepverbenCount:", error);
    return 0;
  });

  return {
    props: {
      praepverbenCount,
      praepverben,
    },
  };
}

export default function Praepverben({ praepverbenCount, praepverben }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentPraepverben, setCurrentPraepverben] = useState(null);
  const [untrained, setUntrained] = useState(praepverben);
  const [repeatPool, setRepeatPool] = useState([]);
  const [trained, setTrained] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [standingSummary, setStandingSummary] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const kategorie = "praepverben";

  useEffect(() => {
    if (typeof window !== "undefined" && status === "authenticated" && !isDataLoaded) {
      loadStanding();
    }
  }, [status, isDataLoaded]);

  const debouncedHandleClick = debounce((callback) => {
    if (!isApplyingFilters) {
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
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to load standing: ${response.status} - ${await response.text()}`);
      }
      const data = await response.json();
      console.log("Standing Data Loaded (kategorie=praepverben):", data);

      if (!data.summary || !Array.isArray(data.summary)) {
        console.error("Keine oder ungültige summary-Daten erhalten:", data);
        resetState();
        setStandingSummary([]);
        setIsDataLoaded(true);
        return;
      }

      const praepverbenStandings = data.summary.filter((item) => item.kategorie === "praepverben");
      console.log("Filtered Standings (kategorie=praepverben):", praepverbenStandings);

      applyStandingToWords(praepverbenStandings);
      setStandingSummary(
        praepverbenStandings
          .map((item) => {
            const p = praepverben.find((pv) => pv.id === item.exercise);
            if (!p) return null;
            return {
              Satz: p.Satz || "",
              Verb: p.Verb || "",
              Loesung: p.Loesung || "",
              Beispiele: p.Beispiele || "",
              Erklaerung: p.Erklaerung || "",
              Quelle: p.quelle || "",
              Datum: p.Datum ? new Date(p.Datum).toLocaleDateString("de-DE") : "",
            };
          })
          .filter((item) => item !== null)
      );
      setLoadingError(null);
    } catch (error) {
      console.error("Fehler beim Laden des Standing:", error);
      setLoadingError(error.message);
      resetState();
      setStandingSummary([]);
      setIsDataLoaded(true);
    }
  };

  const applyStandingToWords = (standing) => {
    if (!standing || standing.length === 0) {
      console.log("Kein Spielstand vorhanden, initialisiere mit allen Präpverben.");
      resetState();
    } else {
      console.log("Spielstand vorhanden, initialisiere Pools basierend auf Standing-Daten:", standing);
      const learnedIds = standing.filter((s) => s.correct === 2).map((s) => s.exercise);
      const repeatIds = standing.filter((s) => s.correct === 1).map((s) => s.exercise);
      const nokIds = standing.filter((s) => s.correct === 0).map((s) => s.exercise);

      const untrainedWords = praepverben.filter(
        (word) => !learnedIds.includes(word.id) && !repeatIds.includes(word.id) && !nokIds.includes(word.id)
      );
      const repeatPoolWords = praepverben.filter((word) =>
        repeatIds.includes(word.id) || nokIds.includes(word.id)
      );

      setUntrained(untrainedWords);
      setRepeatPool(repeatPoolWords);
      const maxAttempts = standing.reduce((max, s) => Math.max(max, s.attempts || 0), 0);
      setAttempts(maxAttempts);
      setTrained(learnedIds.length);
    }
    setIsDataLoaded(true);
    applyNextPraepverben();
  };

  const resetState = () => {
    setUntrained(praepverben);
    setRepeatPool([]);
    setTrained(0);
    setAttempts(0);
    setStandingSummary([]);
    setCurrentPraepverben(null);
  };

  const saveToServer = async (action, exerciseData = {}) => {
    if (!session) return;
    const { exercise, standingId, correct, attempts } = exerciseData;
    const validatedCorrect = Number.isInteger(correct) && correct >= 0 && correct <= 2 ? correct : 0;

    try {
      let response;
      const payload = {
        user: session.user.email,
        exercise,
        button: action,
        kategorie: "praepverben",
        correct: validatedCorrect,
        attempts: attempts ?? 0,
      };
      console.log(`Saving to server (kategorie=praepverben): action=${action}, payload=`, payload);

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
            kategorie: "praepverben",
          }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server responded with ${response.status}: ${errorText}`);
        throw new Error(`Fehler bei ${action} Aktion: ${errorText}`);
      }
      const data = await response.json();
      console.log("Server response (kategorie=praepverben):", data);
      if (action === "REV") {
        setStandingSummary([]);
      } else if (action === "OK" || action === "NOK") {
        await loadStanding();
      }
      return data;
    } catch (error) {
      console.error(`Fehler beim Senden an Server (kategorie=praepverben, ${action}):`, error);
      throw error;
    }
  };

  const applyNextPraepverben = async () => {
    if (isApplyingFilters || (!Array.isArray(untrained) || !Array.isArray(repeatPool))) {
      console.error("Ungültige Pools (kategorie=praepverben):", { untrained, repeatPool });
      return;
    }
    setIsApplyingFilters(true);
    try {
      const randomCount = Math.floor(Math.random() * 8) + 3;
      const pool = attempts > 0 && randomCount === 10 && repeatPool.length > 0 ? repeatPool : untrained;

      if (pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        const randomPraepverben = { ...pool[randomIndex] };
        randomPraepverben.Datum = randomPraepverben.Datum
          ? new Date(randomPraepverben.Datum).toLocaleDateString("de-DE")
          : "";
        setCurrentPraepverben(randomPraepverben);
      } else {
        setCurrentPraepverben(null);
      }
    } finally {
      setIsApplyingFilters(false);
    }
  };

  useEffect(() => {
    if (isDataLoaded && !isApplyingFilters) {
      const timer = setTimeout(() => applyNextPraepverben(), 200);
      return () => clearTimeout(timer);
    }
  }, [untrained, repeatPool, attempts, isDataLoaded]);

  const handleOK = async () => {
    if (!currentPraepverben || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      const exercise = currentPraepverben.id;
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const standingResponse = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(exercise)}&kategorie=${kategorie}`
      );
      const standing = await standingResponse.json();

      const correct = standing && Object.keys(standing).length > 0 ? Math.min((standing.correct || 0) + 1, 2) : 1;

      await saveToServer("OK", {
        exercise,
        standingId: standing?.id,
        correct,
        attempts: newAttempts,
      });

      setUntrained((prev) => prev.filter((word) => word.id !== exercise));
      setRepeatPool((prev) => (correct < 2 ? [...prev, currentPraepverben] : prev));

      if (correct === 2) setTrained((prev) => prev + 1);

      const newEntry = {
        Satz: currentPraepverben.Satz,
        Verb: currentPraepverben.Verb,
        Loesung: currentPraepverben.Loesung,
        Beispiele: currentPraepverben.Beispiele,
        Erklaerung: currentPraepverben.Erklaerung,
        Quelle: currentPraepverben.quelle,
        Datum: currentPraepverben.Datum,
      };
      setStandingSummary((prev) => {
        if (!prev.some((entry) => entry.Satz === newEntry.Satz)) {
          return [...prev, newEntry];
        }
        return prev;
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
      await applyNextPraepverben();
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleNOK = async () => {
    if (!currentPraepverben || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      const exercise = currentPraepverben.id;
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const standingResponse = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(exercise)}&kategorie=${kategorie}`
      );
      const standing = await standingResponse.json();

      await saveToServer("NOK", {
        exercise,
        standingId: standing?.id,
        correct: 0,
        attempts: newAttempts,
      });

      setUntrained((prev) => [...prev, currentPraepverben]);
      setRepeatPool((prev) => prev.filter((word) => word.id !== exercise));

      const newEntry = {
        Satz: currentPraepverben.Satz,
        Verb: currentPraepverben.Verb,
        Loesung: currentPraepverben.Loesung,
        Beispiele: currentPraepverben.Beispiele,
        Erklaerung: currentPraepverben.Erklaerung,
        Quelle: currentPraepverben.quelle,
        Datum: currentPraepverben.Datum,
      };
      setStandingSummary((prev) => {
        if (!prev.some((entry) => entry.Satz === newEntry.Satz)) {
          return [...prev, newEntry];
        }
        return prev;
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
      await applyNextPraepverben();
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleREV = async () => {
    if (!session || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      console.log("Starting handleREV - deleting standings and resetting state (kategorie=praepverben)...");
      const response = await saveToServer("REV");
      console.log("Server response after DELETE (kategorie=praepverben):", response);

      await new Promise((resolve) => setTimeout(resolve, 2000));
      resetState();
      setIsDataLoaded(false);
      await loadStanding();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await applyNextPraepverben();
    } catch (error) {
      console.error("Fehler in handleREV (kategorie=praepverben):", error);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  useEffect(() => {
    if (router.query.redirected === "true" && !isDataLoaded && !isApplyingFilters) {
      setIsDataLoaded(false);
      loadStanding();
      resetState();
      router.replace("/praepverben", undefined, { shallow: true });
    }
  }, [router.query.redirected, isDataLoaded, isApplyingFilters]);

  if (!isDataLoaded) {
    if (loadingError) {
      return <LoadingScreen message={`Fehler beim Laden: ${loadingError}`} isError={true} />;
    }
    return <LoadingScreen message="Lade Spielstand..." />;
  }

  const progress = Math.round((trained / praepverbenCount) * 100) || 0;

  return (
    <>
      <Head>
        <title>Präpositionen & Verben</title>
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

          <div
            className="max-w-5xl mx-auto py-2 px-4 sm:px-6 lg:px-8"
            style={{ minHeight: "800px", display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {currentPraepverben ? (
              <PraepverbenCard
                wordData={{
                  satz: currentPraepverben.Satz,
                  verb: currentPraepverben.Verb,
                  loesung: currentPraepverben.Loesung,
                  beispiele: currentPraepverben.Beispiele,
                  erklaerung: currentPraepverben.Erklaerung,
                  quelle: currentPraepverben.quelle,
                  datum: currentPraepverben.Datum,
                }}
                showTranslation={showTranslation}
                onFlip={() => setShowTranslation(!showTranslation)}
              />
            ) : (
              <div>Keine Präpositionen & Verben verfügbar. Alle wurden gelernt!</div>
            )}
            <div className="mt-4" style={{ minHeight: "100px" }}>
              <ActionButtons
                onCorrect={() => debouncedHandleClick(handleOK)}
                onIncorrect={() => debouncedHandleClick(handleNOK)}
                isLoading={isApplyingFilters}
              />
            </div>
            <div className="mt-4" style={{ minHeight: "50px" }}>
              <Stats totalCount={praepverbenCount} trainedCount={trained} attempts={attempts} progress={progress} />
            </div>
            {standingSummary.length > 0 && (
              <table className="table-auto border-collapse border border-gray-300 mt-4 w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Satz</th>
                    <th className="border border-gray-300 p-2 text-left">Verb</th>
                    <th className="border border-gray-300 p-2 text-left">Lösung</th>
                  </tr>
                </thead>
                <tbody>
                  {standingSummary.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="border border-gray-300 p-2">{item.Satz}</td>
                      <td className="border border-gray-300 p-2">{item.Verb}</td>
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