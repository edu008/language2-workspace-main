import { useSession, signIn, signOut } from "next-auth/react"
import Link from 'next/link';
import Image from 'next/image'
import Head from 'next/head';

export default function Component() {

  const { data: session } = useSession()
  if (session && session.user) {
    return <>
      <Head>
        <title>Deutsch lernen</title>
      </Head>
      <div className="flex justify-between items-center bg-gray-100 p-4">
        <div><h1 className="text-xm" >Deutsch lernen</h1></div>
        <div className="flex items-center">
          <Image
            src={session.user.image}
            alt={session.user.name}
            width={40}
            height={40}
            className="rounded-full mr-4"
          />
          <p className="text-gray-700 mr-4">{session.user.email}</p>
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-full" onClick={() => signOut()}>Abmelden</button>
        </div>
      </div>
      <h1 className="text-5xl font-bold text-center mb-8 pt-2">Wähle ein Übungsstapel aus...</h1>
      <div className="flex justify-center pb-4">
        <div className="grid grid-cols-2 gap-10">
          <Link href="/deutsch" className="bg-pink-300 hover:bg-pink-400 focus:bg-pink-400 active:bg-pink-500 text-white font-bold h-80 w-80 flex justify-center items-center rounded-lg text-3xl text-center">Wortbedeutungen</Link>
          <Link href="/praeposition" className="bg-orange-300 hover:bg-orange-400 focus:bg-orange-400 active:bg-orange-500 text-white font-bold h-80 w-80 flex justify-center items-center rounded-lg text-3xl text-center">Präpositionen</Link>
          <Link href="/praepverben" className="bg-blue-300 hover:bg-blue-400 focus:bg-blue-400 active:bg-blue-500 text-white font-bold h-80 w-80 flex justify-center items-center rounded-lg text-3xl text-center">Präpositionen & Verben</Link>
          <Link href="/sprichwort" className="bg-green-300 hover:bg-green-400 focus:bg-green-400 active:bg-green-500 text-white font-bold h-80 w-80 flex justify-center items-center rounded-lg text-3xl text-center">Sprichwörter</Link>
          <Link href="/redewendung" className="bg-purple-300 hover:bg-purple-500 focus:bg-purple-500 active:bg-purple-500 text-white font-bold h-80 w-80 flex justify-center items-center rounded-lg text-3xl text-center">Redewendung</Link>
        </div>
      </div>
      <h1 className="text-5xl font-bold text-center mb-2 mt-8">Erfasse neue Wörter</h1>
      <div className="flex justify-center pb-4">
        <div className="pt-5"> 
          <Link href="/Worterfassung" className="bg-gray-400 hover:bg-gray-500 focus:bg-gray-500 active:bg-gray-600 text-white font-bold h-80 w-96 flex justify-center items-center rounded-lg text-3xl text-center">Worterfassung</Link>
        </div>
      </div>
    </>
  }
  return <>
        <div className="flex justify-between items-center bg-gray-100 p-4">
        <div><h1 className="text-xm" >Deutsch lernen</h1></div>
        <div className="flex items-center">
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-full" onClick={() => signIn()}>Anmelden</button>
        </div>
      </div>
      <h1 className="text-5xl font-bold text-center mb-8 pt-2 items-center">Melde dich an, damit Du Übungen durchführen oder neue erfassen kannst.</h1>
  </>
}