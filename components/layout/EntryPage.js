import { useState } from "react";
import Head from "next/head";
import Header from "./Header";
import { useSession } from "next-auth/react";
import LoadingScreen from "../ui/LoadingScreen";
import MessageToast from "../WordGarden/MessageToast";
import { useBaseContext } from "../../contexts/AppContext";

/**
 * Unified EntryPage component that can be used for all data entry pages
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {React.ReactNode} props.children - The form content to render
 * @param {string} props.message - Message to display in toast
 * @param {string} props.messageType - Type of message (success, error, info)
 * @param {Function} props.setMessage - Function to set message
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 */
export default function EntryPage({
  title,
  children,
  message,
  messageType = "success",
  setMessage,
  requireAuth = true
}) {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const { isDataLoaded } = useBaseContext();

  // Show loading screen if authentication is in progress
  if (requireAuth && loading) {
    return <LoadingScreen message="Authentifizierung läuft..." />;
  }

  // Redirect is handled in _app.js, so we don't need to handle it here

  return (
    <div className="min-h-screen bg-wg-neutral-50">
      {/* Head with page title */}
      <Head>
        <title>{title}</title>
      </Head>

      {/* Header */}
      <Header session={session} />

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-wg-neutral-200 p-6 mb-8 mt-24">
          {children}
        </div>
      </main>

      {/* Toast Message */}
      {message && (
        <MessageToast
          message={message}
          type={messageType}
          onClose={() => setMessage('')}
        />
      )}
    </div>
  );
}
