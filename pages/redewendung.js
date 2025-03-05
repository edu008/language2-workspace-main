import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { debounce } from "lodash";
import Head from "next/head";
import Header from "../components/deutsch/Header";
import ActionButtons from "../components/deutsch/ActionButtons";
import Stats from "../components/deutsch/Stats";
import RedewendungCard from "../components/deutsch/WordCardRedewendung"; // Neue Komponente für die Darstellung
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashRestore } from "@fortawesome/free-solid-svg-icons";
import LoadingScreen from "../components/deutsch/LoadingScreen";
import { Button } from "@material-tailwind/react";
import { getRedewendungCount, getRedewendung } from "../prisma/redewendung";

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  let redewendung = [];
  try {
    redewendung = await getRedewendung();
    if (!Array.isArray(redewendung)) {
      console.error("getRedewendung returned non-array:", redewendung);
      redewendung = [];
    }
    redewendung.forEach((document) => {
      if (document.Datum instanceof Date) {
        document.Datum = document.Datum.toISOString();
      }
    });
  } catch (error) {
    console.error("Fehler beim Abrufen von redewendung:", error);
    redewendung = [];
  }

  const redewendungCount = await getRedewendungCount().catch((error) => {
    console.error("Fehler beim Abrufen von redewendungCount:", error);
    return 0;
  });

  return {
    props: {
      redewendungCount,
      redewendung,
    },
  };
}

export default function Redewendung({ redewendungCount, redewendung }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentRedewendung, setCurrentRedewendung] = useState(null);
  const [untrained, setUntrained] = useState(redewendung);
  const [repeatPool, setRepeatPool] = useState([]);
  const [trained, setTrained] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [standingSummary, setStandingSummary] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const kategorie = "redewendung";

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
      console.log("Standing Data Loaded (kategorie=redewendung):", data);

      if (!data.summary || !Array.isArray(data.summary)) {
        console.error("Keine oder ungültige summary-Daten erhalten:", data);
        resetState();
        setStandingSummary([]);
        setIsDataLoaded(true);
        return;
      }

      const redewendungStandings = data.summary.filter((item) => item.kategorie === "redewendung");
      console.log("Filtered Standings (kategorie=redewendung):", redewendungStandings);

      applyStandingToWords(redewendungStandings);
      setStandingSummary(
        redewendungStandings
          .map((item) => {
            const r = redewendung.find((red) => red.id === item.exercise);
            if (!r) return null;
            return {
              Redewendung: r.Redewendung || "",
              Wort: r.Wort || "",
              Erklaerung: r.Erklaerung || "",
              Beispiel: r.Beispiel || "",
              Quelle: r.Quelle || "",
              Datum: r.Datum ? new Date(r.Datum).toLocaleDateString("de-DE") : "",
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
      console.log("Kein Spielstand vorhanden, initialisiere mit allen Redewendungen.");
      resetState();
    } else {
      console.log("Spielstand vorhanden, initialisiere Pools basierend auf Standing-Daten:", standing);
      const learnedIds = standing.filter((s) => s.correct === 2).map((s) => s.exercise);
      const repeatIds = standing.filter((s) => s.correct === 1).map((s) => s.exercise);
      const nokIds = standing.filter((s) => s.correct === 0).map((s) => s.exercise);

      const untrainedWords = redewendung.filter(
        (word) => !learnedIds.includes(word.id) && !repeatIds.includes(word.id) && !nokIds.includes(word.id)
      );
      const repeatPoolWords = redewendung.filter((word) =>
        repeatIds.includes(word.id) || nokIds.includes(word.id)
      );

      setUntrained(untrainedWords);
      setRepeatPool(repeatPoolWords);
      const maxAttempts = standing.reduce((max, s) => Math.max(max, s.attempts || 0), 0);
      setAttempts(maxAttempts);
      setTrained(learnedIds.length);
    }
    setIsDataLoaded(true);
    applyNextRedewendung();
  };

  const resetState = () => {
    setUntrained(redewendung);
    setRepeatPool([]);
    setTrained(0);
    setAttempts(0);
    setStandingSummary([]);
    setCurrentRedewendung(null);
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
        kategorie: "redewendung",
        correct: validatedCorrect,
        attempts: attempts ?? 0,
      };
      console.log(`Saving to server (kategorie=redewendung): action=${action}, payload=`, payload);

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
            kategorie: "redewendung",
          }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server responded with ${response.status}: ${errorText}`);
        throw new Error(`Fehler bei ${action} Aktion: ${errorText}`);
      }
      const data = await response.json();
      console.log("Server response (kategorie=redewendung):", data);
      if (action === "REV") {
        setStandingSummary([]);
      } else if (action === "OK" || action === "NOK") {
        await loadStanding();
      }
      return data;
    } catch (error) {
      console.error(`Fehler beim Senden an Server (kategorie=redewendung, ${action}):`, error);
      throw error;
    }
  };

  const applyNextRedewendung = async () => {
    if (isApplyingFilters || (!Array.isArray(untrained) || !Array.isArray(repeatPool))) {
      console.error("Ungültige Pools (kategorie=redewendung):", { untrained, repeatPool });
      return;
    }
    setIsApplyingFilters(true);
    try {
      const randomCount = Math.floor(Math.random() * 8) + 3;
      const pool = attempts > 0 && randomCount === 10 && repeatPool.length > 0 ? repeatPool : untrained;

      if (pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        const randomRedewendung = { ...pool[randomIndex] };
        randomRedewendung.Datum = randomRedewendung.Datum
          ? new Date(randomRedewendung.Datum).toLocaleDateString("de-DE")
          : "";
        setCurrentRedewendung(randomRedewendung);
      } else {
        setCurrentRedewendung(null);
      }
    } finally {
      setIsApplyingFilters(false);
    }
  };

  useEffect(() => {
    if (isDataLoaded && !isApplyingFilters) {
      const timer = setTimeout(() => applyNextRedewendung(), 200);
      return () => clearTimeout(timer);
    }
  }, [untrained, repeatPool, attempts, isDataLoaded]);

  const handleOK = async () => {
    if (!currentRedewendung || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      const exercise = currentRedewendung.id;
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
      setRepeatPool((prev) => (correct < 2 ? [...prev, currentRedewendung] : prev));

      if (correct === 2) setTrained((prev) => prev + 1);

      const newEntry = {
        Redewendung: currentRedewendung.Redewendung,
        Wort: currentRedewendung.Wort,
        Erklaerung: currentRedewendung.Erklaerung,
        Beispiel: currentRedewendung.Beispiel,
        Quelle: currentRedewendung.Quelle,
        Datum: currentRedewendung.Datum,
      };
      setStandingSummary((prev) => {
        if (!prev.some((entry) => entry.Redewendung === newEntry.Redewendung)) {
          return [...prev, newEntry];
        }
        return prev;
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
      await applyNextRedewendung();
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleNOK = async () => {
    if (!currentRedewendung || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      const exercise = currentRedewendung.id;
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

      setUntrained((prev) => [...prev, currentRedewendung]);
      setRepeatPool((prev) => prev.filter((word) => word.id !== exercise));

      const newEntry = {
        Redewendung: currentRedewendung.Redewendung,
        Wort: currentRedewendung.Wort,
        Erklaerung: currentRedewendung.Erklaerung,
        Beispiel: currentRedewendung.Beispiel,
        Quelle: currentRedewendung.Quelle,
        Datum: currentRedewendung.Datum,
      };
      setStandingSummary((prev) => {
        if (!prev.some((entry) => entry.Redewendung === newEntry.Redewendung)) {
          return [...prev, newEntry];
        }
        return prev;
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
      await applyNextRedewendung();
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleREV = async () => {
    if (!session || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      console.log("Starting handleREV - deleting standings and resetting state (kategorie=redewendung)...");
      const response = await saveToServer("REV");
      console.log("Server response after DELETE (kategorie=redewendung):", response);

      await new Promise((resolve) => setTimeout(resolve, 2000));
      resetState();
      setIsDataLoaded(false);
      await loadStanding();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await applyNextRedewendung();
    } catch (error) {
      console.error("Fehler in handleREV (kategorie=redewendung):", error);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  useEffect(() => {
    if (router.query.redirected === "true" && !isDataLoaded && !isApplyingFilters) {
      setIsDataLoaded(false);
      loadStanding();
      resetState();
      router.replace("/redewendung", undefined, { shallow: true });
    }
  }, [router.query.redirected, isDataLoaded, isApplyingFilters]);

  if (!isDataLoaded) {
    if (loadingError) {
      return <LoadingScreen message={`Fehler beim Laden: ${loadingError}`} isError={true} />;
    }
    return <LoadingScreen message="Lade Spielstand..." />;
  }

  const progress = Math.round((trained / redewendungCount) * 100) || 0;

  return (
    <>
      <Head>
        <title>Redewendungen</title>
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
            {currentRedewendung ? (
              <RedewendungCard
                wordData={{
                  redewendung: currentRedewendung.Redewendung,
                  wort: currentRedewendung.Wort,
                  erklaerung: currentRedewendung.Erklaerung,
                  beispiel: currentRedewendung.Beispiel,
                  quelle: currentRedewendung.Quelle,
                  datum: currentRedewendung.Datum,
                }}
                showTranslation={showTranslation}
                onFlip={() => setShowTranslation(!showTranslation)}
              />
            ) : (
              <div>Keine Redewendungen verfügbar. Alle wurden gelernt!</div>
            )}
            <div className="mt-4" style={{ minHeight: "100px" }}>
              <ActionButtons
                onCorrect={() => debouncedHandleClick(handleOK)}
                onIncorrect={() => debouncedHandleClick(handleNOK)}
                isLoading={isApplyingFilters}
              />
            </div>
            <div className="mt-4" style={{ minHeight: "50px" }}>
              <Stats totalCount={redewendungCount} trainedCount={trained} attempts={attempts} progress={progress} />
            </div>
            {standingSummary.length > 0 && (
              <table className="table-auto border-collapse border border-gray-300 mt-4 w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Redewendung</th>
                    <th className="border border-gray-300 p-2 text-left">Hauptwort</th>
                    <th className="border border-gray-300 p-2 text-left">Erklärung</th>
                    <th className="border border-gray-300 p-2 text-left">Beispiel</th>
                  </tr>
                </thead>
                <tbody>
                  {standingSummary.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="border border-gray-300 p-2">{item.Redewendung}</td>
                      <td className="border border-gray-300 p-2">{item.Wort}</td>
                      <td className="border border-gray-300 p-2">{item.Erklaerung}</td>
                      <td className="border border-gray-300 p-2">{item.Beispiel}</td>
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