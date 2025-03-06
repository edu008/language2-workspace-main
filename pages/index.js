import { useSession, signIn } from "next-auth/react";
import React from "react";
import Head from "next/head";
import { 
  BookOpen, 
  MessageSquare, 
  GraduationCap, 
  CheckCircle,
} from "lucide-react";
import Header from "../components/layout/Header";
import ExerciseWorterfassungSwitch from "../components/layout/ExerciseWorterfassungSwitch"; // Neue Komponente importieren

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="flex flex-col p-6 rounded-xl border border-gray-100 hover:border-blue-500 hover:shadow-md transition-all">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

// Login Button Component
const LoginButton = ({ variant = "main", className = "" }) => {
  return (
    <button
      onClick={() => signIn()}
      className={`${variant === "main" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-white hover:bg-gray-100 text-blue-600 border border-blue-600"} font-medium rounded-lg px-6 py-3 text-lg transition-colors ${className}`}
    >
      Jetzt anmelden
    </button>
  );
};

export default function Home() {
  const { data: session, status } = useSession();

  // Features data (für nicht angemeldete Nutzer)
  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-blue-600" />,
      title: "Umfangreiche Übungen",
      description: "Über 500 interaktive Übungen für alle Sprachniveaus von A1 bis C2.",
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-blue-600" />,
      title: "Konversationspraxis",
      description: "Verbessere deine Sprechfähigkeiten mit KI-gestützten Dialogübungen.",
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-blue-600" />,
      title: "Zertifikatsvorbereitung",
      description: "Gezielte Vorbereitung auf offizielle Deutschprüfungen wie Goethe oder TestDaF.",
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-blue-600" />,
      title: "Persönlicher Fortschritt",
      description: "Verfolge deinen Lernfortschritt und erhalte maßgeschneiderte Empfehlungen.",
    },
  ];

  // Zeige Ladeindikator während die Session geladen wird
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (session && session.user) {
    // Angemeldete Ansicht mit der neuen Komponente
    return (
      <div className="min-h-screen bg-background">
        <Head>
          <title>Deutsch lernen</title>
        </Head>

        <Header session={session} />

        <main className="mt-20">
          <ExerciseWorterfassungSwitch session={session} />
        </main>
      </div>
    );
  }

  // Nicht angemeldete Ansicht (bleibt unverändert)
  return (
    <div className="min-h-screen flex flex-col bg-white animate-fade-in">
      <Head>
        <title>Deutsch lernen</title>
      </Head>

      <Header session={session} />
      
      <main className="flex-grow flex flex-col items-center px-4 py-12 mt-20">
        <div className="max-w-4xl w-full mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-6">
            Deutsch lernen leicht gemacht
          </h1>
          
          <p className="text-xl text-gray-700 mb-10 max-w-3xl mx-auto">
            Verbessere deine Deutschkenntnisse mit unserer interaktiven Lernplattform. 
            Für Anfänger und Fortgeschrittene.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 text-left">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title} 
                description={feature.description}
              />
            ))}
          </div>
          
          <div className="bg-gray-50 p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
              Bereit zum Lernen?
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Melde dich an, um sofort mit dem Lernen zu beginnen und auf alle Übungen zuzugreifen.
            </p>
            <LoginButton variant="main" className="mx-auto" />
          </div>
        </div>
      </main>
      
      <footer className="py-6 border-t border-gray-100 text-center text-sm text-gray-500">
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} Deutsch Lernen. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
}