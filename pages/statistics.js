import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import StatsCard from "@/components/ui/stats/StatsCard";
import CategoryDistribution from "@/components/ui/stats/CategoryDistribution";
import ProgressChart from "@/components/ui/stats/ProgressChart";
import AchievementCard from "@/components/ui/stats/AchievementCard";
import LeaderboardCard from "@/components/ui/stats/LeaderboardCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/stats/tabs";
import { Award, BookOpen, Zap, CheckSquare, Clock, Target } from "lucide-react";
import { useBaseContext } from "../contexts/AppContext";
import LoadingScreen from "@/components/ui/LoadingScreen";

const Statistics = () => {
  const { session } = useBaseContext();
  const [timeframe, setTimeframe] = useState("annual"); // Standard: jährlich
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    deutsch: [],
    praeposition: [],
    sprichwort: [],
    redewendung: [],
    praepverben: [],
  });
  const [standingSummary, setStandingSummary] = useState({
    deutsch: [],
    praeposition: [],
    sprichwort: [],
    redewendung: [],
    praepverben: [],
  });
  const [leaderboardUsers, setLeaderboardUsers] = useState([]);

  if (!session) return <LoadingScreen message="Authentifizierung läuft..." />;

  const userEmail = session.user?.email || "Unbekannt";

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      const features = ["deutsch", "praeposition", "sprichwort", "redewendung", "praepverben"];

      try {
        const dataPromises = features.map(async (feature) => {
          const res = await fetch(`/api/${feature}`, {
            headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
          });
          if (!res.ok) throw new Error(`Fehler beim Laden der ${feature} Daten`);
          const featureData = await res.json();
          return { feature, data: featureData };
        });

        const standingPromises = features.map(async (feature) => {
          const res = await fetch(
            `/api/standing?user=${encodeURIComponent(userEmail)}&kategorie=${feature}`,
            { headers: { "Cache-Control": "no-cache, no-store, must-revalidate" } }
          );
          if (!res.ok) throw new Error(`Fehler beim Laden des Standing für ${feature}`);
          const standingData = await res.json();
          return { feature, data: standingData.summary || [] };
        });

        const leaderboardRes = await fetch("/api/leaderboard", {
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        });
        if (!leaderboardRes.ok) throw new Error("Fehler beim Laden des Leaderboards");
        const leaderboardData = await leaderboardRes.json();
        setLeaderboardUsers(leaderboardData);

        const dataResults = await Promise.all(dataPromises);
        const standingResults = await Promise.all(standingPromises);

        const newData = dataResults.reduce((acc, { feature, data }) => {
          acc[feature] = data;
          return acc;
        }, {});
        setData(newData);

        const newStandingSummary = standingResults.reduce((acc, { feature, data }) => {
          acc[feature] = data.map((item) => ({
            ...item,
            exercise: item.exercise || item.id,
            correct: item.correct || 0,
            attempts: item.attempts || 0,
            duration: item.duration || 0,
            user: item.user || userEmail,
            updatedAt: item.updatedAt || Date.now(),
          }));
          return acc;
        }, {});
        setStandingSummary(newStandingSummary);

        setIsLoading(false);
      } catch (error) {
        console.error("Fehler beim Laden der Daten:", error);
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [userEmail]);

  const userStandingSummary = Object.keys(standingSummary).reduce((acc, key) => {
    acc[key] = standingSummary[key]?.filter((item) => item.user === userEmail) || [];
    return acc;
  }, {});

  if (isLoading) return <LoadingScreen message="Lade Statistiken..." />;

  // Filterfunktion für den Zeitrahmen
  const filterByTimeframe = (items) => {
    const now = new Date();
    return items.filter((item) => {
      const updatedAt = new Date(item.updatedAt);
      if (timeframe === "weekly") {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        return updatedAt >= oneWeekAgo;
      } else if (timeframe === "monthly") {
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return updatedAt >= oneMonthAgo;
      } else if (timeframe === "annual") {
        return updatedAt.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const calculateTotalDuration = () => {
    const allFeatures = ["deutsch", "praeposition", "sprichwort", "redewendung", "praepverben"];
    const filteredSummary = Object.keys(userStandingSummary).reduce((acc, key) => {
      acc[key] = filterByTimeframe(userStandingSummary[key]);
      return acc;
    }, {});

    const totalSeconds = allFeatures.reduce((sum, feature) => {
      return sum + (filteredSummary[feature]?.reduce((acc, item) => acc + (item.duration || 0), 0) || 0);
    }, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { totalSeconds, hours, minutes, seconds };
  };

  const { hours, minutes, seconds } = calculateTotalDuration();

  const totalLearnedWords = Object.values(userStandingSummary).reduce(
    (sum, category) => sum + filterByTimeframe(category).filter((item) => item.correct === 2).length,
    0
  );

  const calculateAccuracyRate = () => {
    const filteredSummary = Object.keys(userStandingSummary).reduce((acc, key) => {
      acc[key] = filterByTimeframe(userStandingSummary[key]);
      return acc;
    }, {});

    const correctAttempts = Object.values(filteredSummary).reduce((acc, category) => {
      return acc + category.filter((item) => item.correct === 1).reduce((sum, item) => sum + (item.attempts || 0), 0);
    }, 0);

    const totalRelevantAttempts = Object.values(filteredSummary).reduce((acc, category) => {
      return acc + category.filter((item) => item.correct === 0 || item.correct === 1).reduce((sum, item) => sum + (item.attempts || 0), 0);
    }, 0);

    return totalRelevantAttempts > 0 ? Math.round((correctAttempts / totalRelevantAttempts) * 100) : 0;
  };

  const accuracyRate = calculateAccuracyRate();

  const categoryData = [
    { name: "Vokabeln", value: filterByTimeframe(userStandingSummary.deutsch).filter((item) => item.correct === 2).length || 0, color: "#8c91b6" },
    { name: "Präpositionen", value: filterByTimeframe(userStandingSummary.praeposition).filter((item) => item.correct === 2).length || 0, color: "#585c82" },
    { name: "Sprichwörter", value: filterByTimeframe(userStandingSummary.sprichwort).filter((item) => item.correct === 2).length || 0, color: "#b3b7d0" },
    { name: "Präpositionalverben", value: filterByTimeframe(userStandingSummary.praepverben).filter((item) => item.correct === 2).length || 0, color: "#484b6a" },
    { name: "Redewendungen", value: filterByTimeframe(userStandingSummary.redewendung).filter((item) => item.correct === 2).length || 0, color: "#6e739e" },
  ];

  const getProgressData = () => {
    const now = new Date();
    let timeUnits = [];
    let dataPoints = [];

    if (timeframe === "weekly") {
      timeUnits = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - i));
        return date.toLocaleString("de-DE", { weekday: "short" });
      });
      dataPoints = timeUnits.map(() => 0);
    } else if (timeframe === "monthly") {
      timeUnits = Array.from({ length: 4 }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (27 - i * 7));
        return `W${i + 1}`;
      });
      dataPoints = timeUnits.map(() => 0);
    } else if (timeframe === "annual") {
      timeUnits = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
      dataPoints = timeUnits.map(() => 0);
    }

    Object.values(userStandingSummary).forEach((category) => {
      category?.forEach((item) => {
        const updatedAt = new Date(item.updatedAt);
        if (item.correct === 2) {
          if (timeframe === "weekly") {
            const diffDays = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < 7) {
              dataPoints[6 - diffDays]++;
            }
          } else if (timeframe === "monthly") {
            const diffDays = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < 28) {
              const weekIndex = Math.floor(diffDays / 7);
              dataPoints[3 - weekIndex]++;
            }
          } else if (timeframe === "annual" && updatedAt.getFullYear() === now.getFullYear()) {
            const monthIndex = updatedAt.getMonth();
            dataPoints[monthIndex]++;
          }
        }
      });
    });

    return timeUnits.map((unit, index) => ({ date: unit, value: dataPoints[index] }));
  };

  const getAccuracyData = () => {
    const now = new Date();
    let timeUnits = [];
    let correctData = [];
    let totalData = [];

    if (timeframe === "weekly") {
      timeUnits = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - i));
        return date.toLocaleString("de-DE", { weekday: "short" });
      });
      correctData = timeUnits.map(() => 0);
      totalData = timeUnits.map(() => 0);
    } else if (timeframe === "monthly") {
      timeUnits = Array.from({ length: 4 }, (_, i) => `W${i + 1}`);
      correctData = timeUnits.map(() => 0);
      totalData = timeUnits.map(() => 0);
    } else if (timeframe === "annual") {
      timeUnits = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
      correctData = timeUnits.map(() => 0);
      totalData = timeUnits.map(() => 0);
    }

    Object.values(userStandingSummary).forEach((category) => {
      category?.forEach((item) => {
        const updatedAt = new Date(item.updatedAt);
        if (timeframe === "weekly") {
          const diffDays = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 7) {
            const index = 6 - diffDays;
            if (item.correct === 1) correctData[index]++;
            if (item.correct === 0 || item.correct === 1) totalData[index]++;
          }
        } else if (timeframe === "monthly") {
          const diffDays = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 28) {
            const weekIndex = Math.floor(diffDays / 7);
            const index = 3 - weekIndex;
            if (item.correct === 1) correctData[index]++;
            if (item.correct === 0 || item.correct === 1) totalData[index]++;
          }
        } else if (timeframe === "annual" && updatedAt.getFullYear() === now.getFullYear()) {
          const monthIndex = updatedAt.getMonth();
          if (item.correct === 1) correctData[monthIndex]++;
          if (item.correct === 0 || item.correct === 1) totalData[monthIndex]++;
        }
      });
    });

    return timeUnits.map((unit, index) => ({
      date: unit,
      value: totalData[index] > 0 ? Math.round((correctData[index] / totalData[index]) * 100) : 0,
    }));
  };

  const achievements = [
    { title: "Vokabelmeister", description: "Lerne 1000 deutsche Vokabeln", progress: Math.min((totalLearnedWords / 1000) * 100, 100), icon: <BookOpen size={24} /> },
    { title: "Perfekte Serie", description: "Lerne an 30 aufeinanderfolgenden Tagen", progress: 0, icon: <Zap size={24} /> },
    { title: "Grammatik-Experte", description: "Meistere alle Präpositionsübungen", progress: Math.min((filterByTimeframe(userStandingSummary.praeposition).filter((item) => item.correct === 2).length / (data.praeposition?.length || 1)) * 100, 100), icon: <CheckSquare size={24} /> },
    { title: "Sprichwörtliche Weisheit", description: "Lerne 50 deutsche Sprichwörter", progress: Math.min((filterByTimeframe(userStandingSummary.sprichwort).filter((item) => item.correct === 2).length / 50) * 100, 100), icon: <Award size={24} /> },
  ];

  return (
    <div>
      <Header session={session} />
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-germanic-800 dark:text-white">Statistiken</h1>
              <p className="mt-1 text-germanic-500 dark:text-germanic-300">
                Verfolge deinen Fortschritt und Lernerfolge
              </p>
            </div>
            <Tabs defaultValue="annual" value={timeframe} onValueChange={setTimeframe} className="mt-4 md:mt-0">
              <TabsList>
                <TabsTrigger value="weekly">Wöchentlich</TabsTrigger>
                <TabsTrigger value="monthly">Monatlich</TabsTrigger>
                <TabsTrigger value="annual">Jährlich</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Gelernte Wörter"
              value={totalLearnedWords}
              description={`Im ${timeframe === "weekly" ? "letzten 7 Tagen" : timeframe === "monthly" ? "letzten Monat" : "diesen Jahr"}`}
              icon={<BookOpen className="h-4 w-4" />}
              trend="up"
              trendValue="+0"
            />
            <StatsCard
              title="Genauigkeitsrate"
              value={`${accuracyRate}%`}
              description="Durchschnittlich richtige Antworten"
              icon={<Target className="h-4 w-4" />}
              trend="up"
              trendValue="+0"
            />
            <StatsCard
              title="Lernserie"
              value="0 Tage"
              description="Aktuelle Serie"
              icon={<Zap className="h-4 w-4" />}
              trend="neutral"
              trendValue="Weiter so!"
            />
            <StatsCard
              title="Lernzeit"
              value={`${hours} Std ${minutes !== 0 ? `${minutes} Min` : ""} ${seconds !== 0 ? `${seconds} Sek` : ""}`.trim()}
              description={`Gesamte Lernzeit (${timeframe === "weekly" ? "Woche" : timeframe === "monthly" ? "Monat" : "Jahr"})`}
              icon={<Clock className="h-4 w-4" />}
              trend="up"
              trendValue="+0"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ProgressChart
              data={getProgressData()}
              title={`Gelernte Wörter (${timeframe === "weekly" ? "pro Tag" : timeframe === "monthly" ? "pro Woche" : "pro Monat"})`}
              color="#6e739e"
              gradientFrom="#6e739e"
              gradientTo="rgba(110, 115, 158, 0.1)"
              yAxisLabel="Wörter"
            />
            <ProgressChart
              data={getAccuracyData()}
              title={`Fortschritt der Genauigkeit (${timeframe === "weekly" ? "pro Tag" : timeframe === "monthly" ? "pro Woche" : "pro Monat"})`}
              color="#585c82"
              gradientFrom="#585c82"
              gradientTo="rgba(88, 92, 130, 0.1)"
              yAxisLabel="Prozent (%)"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <CategoryDistribution data={categoryData} title={`Gelernte Wörter nach Kategorie (${timeframe})`} />
            <LeaderboardCard users={leaderboardUsers} title="Top-Lernende" />
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-germanic-800 dark:text-white">Deine Erfolge</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <AchievementCard
                  key={index}
                  title={achievement.title}
                  description={achievement.description}
                  progress={achievement.progress}
                  icon={achievement.icon}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
