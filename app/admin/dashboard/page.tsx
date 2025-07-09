"use client"

import AdminDashboard from "@/components/admin-dashboard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Simuler une vérification d'URL "secrète" ou un autre mécanisme léger
const ADMIN_SECRET_PATH = "/admin/dashboard"; // L'URL elle-même est le "secret"

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Vérifier si le chemin actuel correspond au chemin secret attendu.
    // Ceci est une vérification très basique. Dans une vraie application,
    // vous auriez une authentification robuste.
    if (window.location.pathname === ADMIN_SECRET_PATH) {
      // Potentiellement, vous pourriez ajouter une vérification supplémentaire ici,
      // par exemple, un mot de passe stocké localement ou une autre forme de "secret partagé"
      // si l'URL seule n'est pas considérée comme suffisante.
      // Pour cette tâche, nous considérons que l'URL est le secret.
      setIsAuthorized(true);
    } else {
      // Si l'URL ne correspond pas exactement (par exemple, si des paramètres sont ajoutés par erreur),
      // ou si quelqu'un essaie d'accéder d'une autre manière.
      router.push("/"); // Rediriger vers l'accueil
    }
  }, [router]);

  if (!isAuthorized) {
    // Afficher un loader ou null pendant la vérification ou avant la redirection
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Vérification de l'accès...</p>
      </div>
    );
  }

  return <AdminDashboard />;
}
