"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

// Définition du type pour le profil utilisateur
export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null; // Ajout du rôle
  preferred_language?: string | null;
  // Ajoutez d'autres champs de user_profiles que vous souhaitez rendre accessibles
}

interface AuthContextType {
  user: User | null; // Utilisateur Supabase Auth
  userProfile: UserProfile | null; // Profil de la table user_profiles
  loading: boolean; // Chargement initial de la session et du profil
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (userId: string) => {
    if (!userId) {
      setUserProfile(null)
      return
    }
    try {
      const { data, error } = await supabase
        .from("user_profiles") // Assurez-vous que le nom de la table est correct
        .select("*") // Récupère toutes les colonnes, y compris 'role'
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Erreur lors de la récupération du profil utilisateur:", error.message)
        setUserProfile(null)
        return
      }
      setUserProfile(data as UserProfile)
    } catch (e) {
      console.error("Exception lors de la récupération du profil:", e)
      setUserProfile(null)
    }
  }

  useEffect(() => {
    const processSession = async (sessionUser: User | null) => {
      setUser(sessionUser)
      if (sessionUser) {
        await fetchUserProfile(sessionUser.id)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    }

    // Obtenir la session initiale
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await processSession(session?.user ?? null)
    })

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await processSession(session?.user ?? null)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    // Redirection gérée par le middleware ou les pages elles-mêmes
  };


  return <AuthContext.Provider value={{ user, userProfile, loading, signOut }}>{children}</AuthContext.Provider>
}
