"use client"

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-teal-600 hover:text-teal-800 font-medium">
            &larr; Retour à l'accueil
          </Link>
        </div>
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Politique de Confidentialité
            </h1>
            <div className="prose prose-lg text-gray-700 mx-auto">
              <p>
                Le contenu de cette page est en cours de rédaction et sera bientôt disponible.
              </p>
              <p>
                Merci de votre compréhension.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
