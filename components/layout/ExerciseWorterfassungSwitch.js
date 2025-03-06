import React, { useState } from "react";
import { useRouter } from "next/router";
import { 
  BookOpen, 
  MessageSquare, 
  Quote, 
  Text, 
  ArrowDown, 
  Book, 
  BarChart 
} from "lucide-react";

const ExerciseWorterfassungSwitch = ({ session }) => {
  const [showWorterfassung, setShowWorterfassung] = useState(false);
  const router = useRouter();

  const exercises = [
    {
      title: "Vokabeln",
      description: "Lernen Sie die Bedeutung deutscher Wörter",
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      chip: "Vokabeln",
      link: "/deutsch",
    },
    {
      title: "Präpositionen",
      description: "Üben Sie den korrekten Gebrauch von Präpositionen",
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      chip: "Grammatik",
      link: "/praeposition",
    },
    {
      title: "Sprichwörter",
      description: "Entdecken Sie deutsche Sprichwörter",
      icon: <Quote className="h-8 w-8 text-primary" />,
      chip: "Kultur",
      link: "/sprichwort",
    },
    {
      title: "Redewendungen",
      description: "Lernen Sie gebräuchliche Redewendungen",
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      chip: "Idiome",
      link: "/redewendung",
    },
    {
      title: "Präpositionen & Verben",
      description: "Üben Sie Präpositionen mit den passenden Verben",
      icon: <Text className="h-8 w-8 text-primary" />,
      chip: "Grammatik",
      link: "/praepverben",
    },
  ];

  const worterfassungExercises = [
    {
      title: "Wortbedeutungen",
      description: "Erfasse neue Wortbedeutungen",
      icon: <Book className="h-8 w-8 text-primary" />,
      chip: "Vokabeln",
      link: "/enterdeutsch",
    },
    {
      title: "Präpositionen",
      description: "Erfasse neue Präpositionen",
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      chip: "Grammatik",
      link: "/enterpraeposition",
    },
    {
      title: "Sprichwörter",
      description: "Erfasse neue Sprichwörter",
      icon: <Quote className="h-8 w-8 text-primary" />,
      chip: "Kultur",
      link: "/entersprichwort",
    },
    {
      title: "Redewendungen",
      description: "Erfasse neue Redewendungen",
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      chip: "Idiome",
      link: "/enterredewendung",
    },
    {
      title: "Präpositionen & Verben",
      description: "Erfasse neue Präpositionen & Verben",
      icon: <Book className="h-8 w-8 text-primary" />,
      chip: "Grammatik",
      link: "/enterpraepverben",
    },
    {
      title: "Statistiken",
      description: "Sieh dir deine Statistiken an",
      icon: <BarChart className="h-8 w-8 text-primary" />,
      chip: "Stats",
      link: "/statistics",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full">
      {/* Übungen */}
      <div
        className={`transition-all duration-500 ease-in-out w-full ${
          showWorterfassung ? "opacity-0 -translate-y-full absolute top-0 left-0 right-0" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Übungen</h2>
            <p className="mt-2 text-muted-foreground">
              Wählen Sie eine Übung aus, um Ihr Deutsch zu verbessern
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {exercises.map((exercise, index) => (
              <button
                key={index}
                onClick={() => router.push(exercise.link)}
                className="exercise-card group text-left bg-card border border-border rounded-xl shadow-md p-6"
              >
                <div className="exercise-chip flex items-center justify-center">
                  {exercise.chip}
                </div>
                <div className="mb-4 flex justify-center">{exercise.icon}</div>
                <h3 className="exercise-title text-center">{exercise.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground text-center">
                  {exercise.description}
                </p>
              </button>
            ))}
          </div>
          <div className="mt-12 text-center">
            <button
              onClick={() => setShowWorterfassung(true)}
              className="inline-flex flex-col items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <span className="text-lg font-medium">Worterfassung</span>
              <ArrowDown className="h-6 w-6 animate-bounce text-primary" />
            </button>
          </div>
        </div>
      </div>

      {/* Worterfassung */}
      <div
        className={`transition-all duration-500 ease-in-out w-full absolute top-0 left-0 right-0 ${
          showWorterfassung ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
        }`}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Worterfassung</h2>
            <p className="mt-2 text-muted-foreground">
              Wählen Sie eine Kategorie aus, um neue Wörter zu erfassen
            </p>
            <button
              onClick={() => setShowWorterfassung(false)}
              className="mt-4 text-primary hover:text-primary/80"
            >
              Zurück zu Übungen
            </button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {worterfassungExercises.map((exercise, index) => (
              <button
                key={index}
                onClick={() => router.push(exercise.link)}
                className="exercise-card group text-left bg-card border border-border rounded-xl shadow-md p-6"
              >
                <div className="exercise-chip flex items-center justify-center">
                  {exercise.chip}
                </div>
                <div className="mb-4 flex justify-center">{exercise.icon}</div>
                <h3 className="exercise-title text-center">{exercise.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground text-center">
                  {exercise.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseWorterfassungSwitch;