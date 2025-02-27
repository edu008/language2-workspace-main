import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import React from "react"; // Für React-Komponenten
import {
  Book,
  BookOpen,
  Quote,
  MessageSquare,
  ArrowDown,
} from "lucide-react"; // Importiere nur die Icons, die für die Karten benötigt werden
import { useRouter } from "next/router"; // Für Navigation im Header
import Header from "../components/deutsch/Header"; // Importiere die Header-Komponente aus components/deutsch/Header.js

// Einfache Utility-Funktion für Klassen
const cn = (...classes) => classes.filter(Boolean).join(" ");

// Einfache Card-Komponente direkt hier definieren, basierend auf .exercise-card
const Card = ({ children, className, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "exercise-card group text-left bg-card border border-border rounded-xl shadow-md p-6", // Erhöhtes Padding auf p-6 für größere Karten
      className
    )}
  >
    {children}
  </button>
);

// Dialog-Komponente direkt hier definieren
const Dialog = ({ children, open, onOpenChange }) => (
  <div className={cn("fixed inset-0 z-50", open ? "block" : "hidden")}>
    <div
      className="fixed inset-0 bg-black/50"
      onClick={() => onOpenChange(false)}
    />
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-popover p-6 rounded-lg shadow-lg w-[90%] max-w-md">
      {children}
    </div>
  </div>
);
const DialogTrigger = ({ children, onClick }) => (
  <button onClick={onClick} className="inline-flex items-center">
    {children}
  </button>
);
const DialogContent = ({ children }) => <>{children}</>;
const DialogHeader = ({ children }) => <div className="mb-4">{children}</div>;
const DialogTitle = ({ children }) => (
  <h3 className="text-lg font-bold mb-2 text-foreground">{children}</h3>
);
const DialogDescription = ({ children }) => (
  <p className="text-sm text-muted-foreground mb-4">{children}</p>
);
const DialogFooter = ({ children }) => <div className="mt-4">{children}</div>;

// Checkbox-Komponente direkt hier definieren
const Checkbox = ({ checked, onCheckedChange }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={(e) => onCheckedChange(e.target.checked)}
    className="w-4 h-4 mr-2"
  />
);

// Textarea-Komponente direkt hier definieren
const Textarea = ({ value, onChange, placeholder }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full p-2 border rounded mt-2 bg-background text-foreground border-border"
  />
);

export default function Component() {
  const { data: session } = useSession();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedExercises, setSelectedExercises] = React.useState([]); // Typen entfernt, reines JavaScript
  const router = useRouter(); // Für Navigation im Header

  const exercises = [
    {
      title: "Wortbedeutungen",
      description: "Lernen Sie die Bedeutung deutscher Wörter",
      icon: <Book className="h-8 w-8 text-primary" />, // Größere Icons (h-8 w-8 statt h-6 w-6)
      chip: "Vokabeln",
      link: "/deutsch",
    },
    {
      title: "Präpositionen",
      description: "Üben Sie den korrekten Gebrauch von Präpositionen",
      icon: <BookOpen className="h-8 w-8 text-primary" />, // Größere Icons
      chip: "Grammatik",
      link: "/praeposition",
    },
    {
      title: "Sprichwörter",
      description: "Entdecken Sie deutsche Sprichwörter",
      icon: <Quote className="h-8 w-8 text-primary" />, // Größere Icons
      chip: "Kultur",
      link: "/sprichwort",
    },
    {
      title: "Redewendungen",
      description: "Lernen Sie gebräuchliche Redewendungen",
      icon: <MessageSquare className="h-8 w-8 text-primary" />, // Größere Icons
      chip: "Idiome",
      link: "/redewendung",
    },
    {
      title: "Präpositionen & Verben",
      description: "Üben Sie Präpositionen mit den passenden Verben",
      icon: <Book className="h-8 w-8 text-primary" />, // Größere Icons
      chip: "Grammatik",
      link: "/praepverben",
    },
  ];

  if (session && session.user) {
    return (
      <div className="min-h-screen bg-background">
        <Head>
          <title>Deutsch lernen</title>
        </Head>

        {/* Header aus der Header-Komponente aus components/deutsch/Header */}
        <Header session={session} />

        {/* Main Content mit margin-top, um den festen Header zu berücksichtigen */}
        <main className="container mx-auto px-4 py-8 mt-20"> {/* Füge mt-20 hinzu, um den Inhalt unter dem Header (h-20) zu verschieben */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Übungen</h2>
            <p className="mt-2 text-muted-foreground">
              Wählen Sie eine Übung aus, um Ihr Deutsch zu verbessern
            </p>
          </div>

          {/* Übungskarten in 3 Spalten (responsiv: 2 Spalten bei kleineren Bildschirmen) */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {exercises.map((exercise, index) => (
              <Card
                key={index}
                onClick={() => router.push(exercise.link)} // Navigation zu der Übungsseite
                className="group text-left"
              >
                <div className="exercise-chip flex items-center justify-center">
                  {exercise.chip}
                </div>
                <div className="mb-4 flex justify-center">{exercise.icon}</div>
                <h3 className="exercise-title text-center">{exercise.title}</h3> {/* Zentriert den Titel */}
                <p className="mt-2 text-sm text-muted-foreground text-center">
                  {exercise.description}
                </p> {/* Zentriert die Beschreibung */}
              </Card>
            ))}
          </div>

          {/* Worterfassung-Button zentriert unten */}
          <div className="mt-12 text-center">
            <Link
              href="/Worterfassung"
              className="inline-flex flex-col items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <span className="text-lg font-medium">Worterfassung</span>
              <ArrowDown className="h-6 w-6 animate-bounce text-primary" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Deutsch lernen</title>
      </Head>

      {/* Header für nicht angemeldete Nutzer */}
      <Header session={session} />

      {/* Main Content mit margin-top für nicht angemeldete Nutzer */}
      <main className="container mx-auto px-4 py-8 mt-20"> {/* Füge mt-20 hinzu, um den Inhalt unter dem Header zu verschieben */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Melde dich an, damit Du Übungen durchführen oder neue erfassen kannst.
          </h2>
          <button
            className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
            onClick={() => signIn()}
          >
            Anmelden
          </button>
        </div>
      </main>
    </div>
  );
}