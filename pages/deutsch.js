// pages/deutsch.js
import { useSession, getSession } from "next-auth/react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { debounce } from "lodash";
import useSWR, { mutate } from "swr";

// Importiere Prisma-Funktionen
import { getDeutsch, getDeutschCount } from "../prisma/deutsch";
import { getStandingSums } from "../prisma/standing";

// Importiere Komponenten
import Header from "../components/deutsch/Header";
import WordCard from "../components/deutsch/WordCard";
import Stats from "../components/deutsch/Stats";
import ActionButtons from "../components/deutsch/ActionButtons";

// Optionale Dialog-Komponenten
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// SWR fetcher function mit Credentials
const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json());

export default function Deutsch({ initialData = {} }) {
  const { data: session } = useSession();
  const router = useRouter();

  // Lokale States
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [showTranslation, setShowTranslation] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const { pathname, query } = router;

  const debouncedHandleClick = useMemo(() => debounce((callback) => callback(), 300), []);
  
  // SWR zur Abfrage der StandingSums
  const { data: standingSums, isValidating: isStandingSumsValidating } = useSWR(
    session
      ? `/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=deutsch`
      : null,
    fetcher,
    {
      fallbackData: initialData.standingSums || { finished: 0, trainedSum: 0 },
      revalidateOnFocus: false,
    }
  );

  // Effekt, um den Ladezustand basierend auf der Datenvalidierung zu verwalten
  useEffect(() => {
    // Check if all data fetching processes are complete
    const isDataFetchingComplete = !isStandingSumsValidating;
    setIsLoading(!isDataFetchingComplete);
  }, [isStandingSumsValidating]);

  // Button-Handler (OK/NOK)
  const handleAction = useCallback(async (action) => {
    if (!session?.user?.email) return;
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(initialData.deutsch.id)}`,
        { method: "GET", credentials: "include" }
      );
      const data = await response.json();
      const body = data
        ? { standingIN: data.id, button: action }
        : { user: session.user.email, exercise: initialData.deutsch.id, button: action, kategorie: "deutsch" };
  
      await fetch("/api/standing", {
        method: data ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include"
      });
      
      router.replace(
        { pathname, query: { ...query, refresh: Date.now() } },
        undefined,
        { scroll: false }
      );
    } catch (error) {
      console.error(`Error handling ${action}:`, error);
    } finally {
      setIsLoading(false);
      mutate(`/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=deutsch`);
    }
  }, [session, initialData, pathname, query, router]);

  if (!session) return null;

  const wordData = initialData.deutsch
    ? {
        article: initialData.deutsch.Artikel || "",
        word: initialData.deutsch.Word || "Wort nicht verfügbar",
        prefix: initialData.deutsch.Prefix || "",
        root: initialData.deutsch.Root || "",
        structure: initialData.deutsch.Structure || "",
        typeOfWord: initialData.deutsch.TypeOfWord?.map((type) => type.TypeOfWord) || [],
        examples: initialData.deutsch.Article?.map((article) => ({
          sentence: article.Sentence_D,
          source: article.Source,
        })) || [],
        translation: initialData.deutsch.Transl_F?.map((transl) => transl.Transl_F).join("; ") || "",
        definition: initialData.deutsch.Definition || "",
        dateEntryWord: initialData.deutsch.DateEntryWord || null,
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Wortbedeutungen | Deutsch Lernen</title>
      </Head>

      <Header session={session} />

      <div className="flex justify-between items-center w-full p-6">
        <div className="w-[300px] h-[150px] bg-gray-200 hover:bg-gray-300 rounded-lg mr-8 mt-4" />
        <h1 className="text-5xl font-bold text-center flex-1 ml-16">Wortbedeutungen</h1>
        <div className="flex flex-col gap-4 w-[300px]">
          <button
            onClick={() => setFilterOpen(true)}
            className="py-2 px-4 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm h-[48px]"
          >
            Filter
          </button>
          <button
            onClick={() => setSummaryOpen(true)}
            className="py-2 px-4 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm h-[48px]"
          >
            Zusammenfassung
          </button>
        </div>
      </div>

      <div className="py-8 px-4 sm:px-6 lg:px-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div>
          <div className="max-w-[300px] mx-auto mb-8">
            <WordCard
              wordData={wordData}
              showTranslation={showTranslation}
              onFlip={() => setShowTranslation(!showTranslation)}
            />
          </div>

          <div className="max-w-[300px] mx-auto mb-8">
            <ActionButtons
              onCorrect={() => debouncedHandleClick(() => handleAction("OK"))}
              onIncorrect={() => debouncedHandleClick(() => handleAction("NOK"))}
              isLoading={isLoading}
            />
          </div>

          <div className="max-w-[300px] mx-auto">
            <Stats
              totalCount={initialData.deutschCount}
              trainedCount={standingSums?.finished || 0}
              attempts={standingSums?.trainedSum || 0}
              progress={Math.round((standingSums?.finished / initialData.deutschCount) * 100)}
            />
          </div>
        </div>
      </div>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Filter</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Zusammenfassung der laufenden Übungssession</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            {/* Hier kannst du summary anzeigen */}
            {/* ... */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }

  const { query } = context;
  const searchInput = query.searchInput || "";
  const radioInput = query.radioInput || "";
  const isRootSearch = query.searchInput === "true";

  const serializeDate = (date) => {
    if (!date) return null;
    return new Date(date).toISOString();
  };

  const processDeutschObject = (deutschObj) => ({
    ...deutschObj,
    DateEntryWord: serializeDate(deutschObj.DateEntryWord),
    Article: deutschObj.Article.map((article) => ({
      ...article,
      DateSource: serializeDate(article.DateSource),
    })),
  });

  try {
    const [allDeutsch, deutschCount] = await Promise.all([
      getDeutsch(),
      getDeutschCount(),
    ]);

    const standingSums = await getStandingSums(session.user.email, "deutsch");

    const filteredDeutsch = allDeutsch.filter((deutschObj) => {
      return true;
    });

    if (filteredDeutsch.length === 0) {
      return { redirect: { destination: "/successDeutsch", permanent: false } };
    }

    const randomDeutsch = filteredDeutsch[Math.floor(Math.random() * filteredDeutsch.length)];
    const randomDeutschConverted = processDeutschObject(randomDeutsch);

    const summaryData = Array.isArray(standingSums.summary)
      ? standingSums.summary.map((standing) => {
          const matchingDeutsch = allDeutsch.find(
            (deutschObj) => standing.exercise === deutschObj.id
          );
          if (matchingDeutsch) {
            return {
              summary: processDeutschObject(matchingDeutsch),
            };
          }
          return { summary: null };
        })
      : [];

    return {
      props: {
        initialData: {
          deutschCount,
          deutsch: randomDeutschConverted,
          standingSums: standingSums || { finished: 0, trainedSum: 0 },
          summary: summaryData,
          filteredDeutsch: filteredDeutsch.map(processDeutschObject),
        },
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      props: {
        error: "Failed to load data",
      },
    };
  }
}