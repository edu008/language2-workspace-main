// components/deutsch/header.js
import { useRouter } from "next/router";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function Header({ session }) {
  const router = useRouter();

  const handleUebungsauswahlClick = () => {
    router.push("/");
  };

  return (
    <div className="flex justify-between items-center bg-gray-100 p-4">
      {/* Button mit Pfeil-Icon und onClick-Handler */}
      <button
        onClick={handleUebungsauswahlClick}
        className="flex items-center py-2 px-4 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold text-sm"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Übungsauswahl
      </button>

      <div className="flex items-center">
        <Image
          src={session.user.image}
          alt={session.user.name}
          width={40}
          height={40}
          className="rounded-full mr-4"
        />
        <p className="text-gray-700 mr-4">{session.user.email}</p>
        <button
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-full"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Abmelden
        </button>
      </div>
    </div>
  );
}
