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
} from "lucide-react"; // Importiere nur die Icons, die für die Karten benötigt werden, passend zu index.js
import { useRouter } from "next/router"; // Für Navigation im Header
import Header from "../components/deutsch/Header"; // Importiere die Header-Komponente aus components/deutsch/Header.js, wie in index.js

// Einfache Utility-Funktion für Klassen
const cn = (...classes) => classes.filter(Boolean).join(" ");

// Einfache Card-Komponente direkt hier definieren, basierend auf .exercise-card (wie in index.js)
const Card = ({ children, className, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "exercise-card group text-left bg-card border border-border rounded-xl shadow-md p-6", // Erhöhtes Padding auf p-6 für größere Karten, wie in index.js
      className
    )}
  >
    {children}
  </button>
);

export default function Worterfassung() {
  const { data: session } = useSession();
  const router = useRouter(); // Für Navigation im Header, wie in index.js

  const exercises = [
    {
      title: "Wortbedeutungen",
      description: "Erfasse neue Wortbedeutungen",
      icon: <Book className="h-8 w-8 text-primary" />, // Größere Icons, wie in index.js
      chip: "Vokabeln",
      link: "/enterdeutsch",
    },
    {
      title: "Präpositionen",
      description: "Erfasse neue Präpositionen",
      icon: <BookOpen className="h-8 w-8 text-primary" />, // Größere Icons
      chip: "Grammatik",
      link: "/enterpraeposition",
    },
    {
      title: "Sprichwörter",
      description: "Erfasse neue Sprichwörter",
      icon: <Quote className="h-8 w-8 text-primary" />, // Größere Icons
      chip: "Kultur",
      link: "/entersprichwort",
    },
    {
      title: "Redewendungen",
      description: "Erfasse neue Redewendungen",
      icon: <MessageSquare className="h-8 w-8 text-primary" />, // Größere Icons
      chip: "Idiome",
      link: "/enterredewendung",
    },
    {
      title: "Präpositionen & Verben",
      description: "Erfasse neue Präpositionen & Verben",
      icon: <Book className="h-8 w-8 text-primary" />, // Größere Icons
      chip: "Grammatik",
      link: "/enterpraepverben",
    },
  ];

  if (session && session.user) {
    return (
      <div className="min-h-screen bg-background">
        <Head>
          <title>Worterfassung</title>
        </Head>

        {/* Header aus der Header-Komponente, wie in index.js */}
        <Header session={session} />

        {/* Main Content mit margin-top, um den festen Header zu berücksichtigen, wie in index.js */}
        <main className="container mx-auto px-4 py-8 mt-20">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Worterfassung</h2>
            <p className="mt-2 text-muted-foreground">
              Wählen Sie eine Kategorie aus, um neue Wörter zu erfassen
            </p>
          </div>

          {/* Übungskarten in 3 Spalten (responsiv: 2 Spalten bei kleineren Bildschirmen), wie in index.js */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {exercises.map((exercise, index) => (
              <Card
                key={index}
                onClick={() => router.push(exercise.link)} // Navigation zu den Unterseiten, wie in index.js
                className="group text-left"
              >
                <div className="exercise-chip flex items-center justify-center">
                  {exercise.chip}
                </div>
                <div className="mb-4 flex justify-center">{exercise.icon}</div>
                <h3 className="exercise-title text-center">{exercise.title}</h3> {/* Zentriert den Titel, wie in index.js */}
                <p className="mt-2 text-sm text-muted-foreground text-center">
                  {exercise.description}
                </p> {/* Zentriert die Beschreibung, wie in index.js */}
              </Card>
            ))}
          </div>

          {/* Kein zusätzlicher Worterfassung-Button, da dies nicht in index.js vorhanden ist */}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Worterfassung</title>
      </Head>

      {/* Header für nicht angemeldete Nutzer, wie in index.js */}
      <Header session={session} />

      {/* Main Content mit margin-top für nicht angemeldete Nutzer, wie in index.js */}
      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Melde dich an, um Wörter zu erfassen.
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