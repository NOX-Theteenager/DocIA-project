"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button" // Pour un éventuel bouton "Retour"
import { Stethoscope, User, MessageCircle, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image" // Si le logo est utilisé

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

interface Conversation {
  id: string
  title: string
  created_at: string
  // On pourrait ajouter user_id si on voulait afficher qui a créé la conversation
}

export default function SharedChatPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.conversationId as string

  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (conversationId) {
      fetchConversationAndMessages()
    } else {
      setError("ID de conversation manquant.")
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchConversationAndMessages = async () => {
    setLoading(true)
    setError(null)

    try {
      // Récupérer les détails de la conversation (surtout le titre)
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select("id, title, created_at")
        .eq("id", conversationId)
        .single()

      if (convError) throw convError
      setConversation(convData)

      // Récupérer les messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (messagesError) throw messagesError
      setMessages(messagesData || [])

    } catch (e: any) {
      console.error("Erreur lors du chargement de la conversation partagée:", e)
      setError(e.message || "Impossible de charger la conversation.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Chargement de la conversation...</p></div>
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen p-4">
        <MessageCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Erreur</h1>
        <p className="text-red-600 text-center mb-4">{error}</p>
        <Button onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à l'accueil
        </Button>
      </div>
    )
  }

  if (!conversation) {
     return (
      <div className="flex flex-col justify-center items-center h-screen p-4">
        <MessageCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Conversation non trouvée</h1>
        <p className="text-gray-600 text-center mb-4">La conversation que vous essayez de voir n'existe pas ou n'est plus disponible.</p>
        <Button onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à l'accueil
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header simplifié */}
      <header className="bg-teal-700 dark:bg-gray-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image src="/images/logo.png" alt="DocIA Logo" width={32} height={32} className="rounded-full" />
            <h1 className="text-xl font-semibold truncate" title={conversation.title}>
              Conversation Partagée: {conversation.title}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/chat")} className="text-white border-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour au Chat
          </Button>
        </div>
      </header>

      {/* Zone des messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src="/images/logo.png" alt="Assistant Avatar" />
                  <AvatarFallback className="bg-teal-100 dark:bg-teal-800 text-teal-600 dark:text-teal-300">
                    <Stethoscope className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-2 shadow",
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200",
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={cn(
                    "text-xs mt-1 opacity-70",
                    message.role === "user" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.role === "user" && (
                 <Avatar className="h-8 w-8 flex-shrink-0">
                  {/* Idéalement, on aurait l'avatar de l'utilisateur qui a créé le message,
                      mais pour un partage simple, on peut mettre un avatar générique ou celui du créateur de la conv si disponible */}
                  <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
       <footer className="text-center p-4 border-t bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
        Ceci est une conversation partagée. Vous ne pouvez pas y répondre.
        <p>Partagée le: {new Date(conversation.created_at).toLocaleDateString()}</p>
      </footer>
    </div>
  )
}
