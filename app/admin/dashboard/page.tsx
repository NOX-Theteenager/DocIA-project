"use client"

import AdminDashboard from "@/components/admin-dashboard";
import { useAuth } from "@/components/auth-provider"; // Importer useAuth
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminDashboardPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si le chargement est terminé et que l'utilisateur n'est pas admin (ou pas de profil/rôle)
    // ou si l'utilisateur n'est pas connecté du tout.
    if (!loading) {
      if (!user || !userProfile || userProfile.role !== 'admin') {
        router.push("/"); // Rediriger vers l'accueil ou une page d'accès refusé
      }
    }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Chargement des informations utilisateur...</p>
      </div>
    );
  }

  // Vérification supplémentaire au cas où la redirection n'aurait pas encore eu lieu
  if (!user || !userProfile || userProfile.role !== 'admin') {
    // Affiche null ou un message pendant que la redirection via useEffect se produit
    return (
        <div className="flex justify-center items-center h-screen">
            <p>Accès non autorisé. Redirection...</p>
        </div>
    );
  }

  // Si l'utilisateur est admin, afficher le dashboard
  return <AdminDashboard />;
}
