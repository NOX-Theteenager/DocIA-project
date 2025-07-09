"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Send,
  Plus,
  MessageCircle,
  User,
  LogOut,
  Menu,
  X,
  Heart,
  Brain,
  Pill,
  Activity,
  Shield,
  Thermometer,
  Stethoscope,
  FileText,
  Trash2,
  Settings,
  Edit,
  Share2,
  Search, // Ajout de l'icône Search
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { VoiceInput, TextToSpeech, FileUploadButton } from "@/components/voice-input"
import { TypingMarkdown } from "@/components/typing-effect"
import { AlertCircle } from "lucide-react"
import { useTheme } from "@/lib/theme-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
  has_files?: boolean
  metadata?: any
}

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count?: number
}

export default function ChatPage() {
  const { t } = useTheme()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [files, setFiles] = useState<File[]>([])
  const [showWelcome, setShowWelcome] = useState(true)
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [newFullName, setNewFullName] = useState("")
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("")
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Update health suggestions to use translations
  const healthSuggestions = [
    {
      icon: Heart,
      title: t.cardiology,
      question: t.cardiovascularPrevention,
      color: "bg-red-3000",
      textColor: "text-red-600",
    },
    {
      icon: Brain,
      title: t.neurology,
      question: t.strokeSigns,
      color: "bg-purple-500",
      textColor: "text-purple-600",
    },
    {
      icon: Pill,
      title: t.medications,
      question: t.antibioticsUsage,
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      icon: Activity,
      title: t.diabetes,
      question: t.glucoseControl,
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      icon: Shield,
      title: t.prevention,
      question: t.immuneSystem,
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
    },
    {
      icon: Thermometer,
      title: t.symptoms,
      question: t.persistentFever,
      color: "bg-orange-500",
      textColor: "text-orange-600",
    },
  ]

  useEffect(() => {
    checkUser()
    loadConversations()

    // Charger les voix pour la synthèse vocale
    const loadAndSetVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("fr"))
        setAvailableVoices(voices)
        const storedVoiceURI = localStorage.getItem("selectedVoiceURI")
        if (storedVoiceURI && voices.some(v => v.voiceURI === storedVoiceURI)) {
          setSelectedVoiceURI(storedVoiceURI)
        } else if (voices.length > 0) {
          // Sélectionner la première voix française par défaut si aucune n'est stockée ou si la stockée n'est plus valide
          // setSelectedVoiceURI(voices[0].voiceURI) // Optionnel: auto-sélectionner
        }
      }
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = loadAndSetVoices
      } else {
        loadAndSetVoices()
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    setShowWelcome(messages.length === 0)
  }, [messages])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth")
      return
    }
    setUser(user)
    setNewFullName(user.user_metadata?.full_name || "")
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadConversations = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    if (data && !error) {
      setConversations(data)
    }
  }

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (data && !error) {
      setMessages(data)
    }
  }

  const createNewConversation = async () => {
    if (!user) return

    const title = `Nouvelle conversation ${new Date().toLocaleDateString("fr-FR")}`

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title,
        message_count: 0,
      })
      .select()
      .single()

    if (data && !error) {
      setCurrentConversation(data.id)
      setMessages([])
      setFiles([])
      loadConversations()
      return data.id
    }
    return null
  }

  const selectConversation = (conversationId: string) => {
    setCurrentConversation(conversationId)
    setFiles([])
    loadMessages(conversationId)
  }

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    const { error } = await supabase.from("conversations").delete().eq("id", conversationId)

    if (!error) {
      if (currentConversation === conversationId) {
        setCurrentConversation(null)
        setMessages([])
      }
      loadConversations()
    }
  }

  const updateProfile = async () => {
    if (!user || !newFullName.trim()) return

    setProfileLoading(true)
    setProfileError(null)
    setProfileSuccess(null)

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: newFullName.trim(),
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(newFullName.trim())}&background=0d9488&color=fff`,
        },
      })

      if (error) {
        setProfileError(error.message)
        return
      }

      setProfileSuccess("Profil mis à jour avec succès !")
      setEditingProfile(false)

      // Recharger les données utilisateur
      setTimeout(() => {
        checkUser()
        setProfileSuccess(null)
      }, 2000)
    } catch (error: any) {
      setProfileError("Erreur lors de la mise à jour du profil")
    } finally {
      setProfileLoading(false)
    }
  }

  const deleteAccount = async () => {
    if (!user) return

    setProfileLoading(true)
    setProfileError(null)

    try {
      // Supprimer toutes les conversations de l'utilisateur
      await supabase.from("conversations").delete().eq("user_id", user.id)

      // Note: La suppression du compte utilisateur nécessite des privilèges admin
      // Pour l'instant, on déconnecte l'utilisateur
      await supabase.auth.signOut()
      router.push("/")
    } catch (error: any) {
      setProfileError("Erreur lors de la suppression du compte")
      setProfileLoading(false)
    }
  }

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || input
    if ((!content.trim() && files.length === 0) || loading) return

    let conversationId = currentConversation

    // Créer une nouvelle conversation si nécessaire
    if (!conversationId) {
      conversationId = await createNewConversation()
      if (!conversationId) return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content || "Fichier(s) envoyé(s)",
      created_at: new Date().toISOString(),
      has_files: files.length > 0,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)
    setShowWelcome(false)

    // Créer un message assistant temporaire pour l'effet de frappe
    const tempAssistantId = (Date.now() + 1).toString()
    setTypingMessageId(tempAssistantId)

    try {
      // Préparer FormData pour l'envoi avec fichiers
      const formData = new FormData()
      formData.append(
        "messages",
        JSON.stringify(
          [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ),
      )
      formData.append("conversationId", conversationId)

      // Ajouter les fichiers
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file)
      })

      const response = await fetch("/api/chat/enhanced", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        const assistantMessage: Message = {
          id: tempAssistantId,
          role: "assistant",
          content: data.message,
          created_at: new Date().toISOString(),
          metadata: data.metadata,
        }

        setMessages((prev) => [...prev, assistantMessage])
        loadConversations()
      } else {
        throw new Error(data.error?.message || "Erreur lors de l'envoi du message")
      }
    } catch (error) {
      console.error("Erreur:", error)
      const errorMessage: Message = {
        id: tempAssistantId,
        role: "assistant",
        content: "Désolé, une erreur s'est produite. Veuillez réessayer dans quelques instants.",
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
      setFiles([])
      setTypingMessageId(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  const handleSuggestionClick = (question: string) => {
    sendMessage(question)
  }

  const handleVoiceTranscript = (transcript: string) => {
    setInput((prev) => prev + (prev ? " " : "") + transcript)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const startEdit = (conversation: Conversation) => {
    setEditingConversationId(conversation.id)
    setEditingTitle(conversation.title)
  }

  const cancelEdit = () => {
    setEditingConversationId(null)
    setEditingTitle("")
  }

  const handleRenameConversation = async (conversationId: string) => {
    if (!editingTitle.trim() || editingTitle === conversations.find(c => c.id === conversationId)?.title) {
      cancelEdit()
      return
    }

    const { error } = await supabase
      .from("conversations")
      .update({ title: editingTitle.trim(), updated_at: new Date().toISOString() })
      .eq("id", conversationId)

    if (!error) {
      loadConversations() // Recharger pour voir le titre mis à jour
    } else {
      console.error("Erreur lors du renommage:", error)
      // Gérer l'erreur (par exemple, afficher un toast)
    }
    cancelEdit()
  }

  const handleShareConversation = (conversationId: string) => {
    const shareUrl = `${window.location.origin}/chat/${conversationId}/share`
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        alert("Lien de partage copié dans le presse-papiers !") // Remplacer par un toast plus tard
      })
      .catch(err => {
        console.error("Erreur lors de la copie du lien : ", err)
        alert("Erreur lors de la copie du lien.")
      })
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-r border-teal-200 dark:border-gray-700 transition-all duration-300 flex flex-col shadow-lg z-50",
          "fixed lg:relative inset-y-0 left-0",
          sidebarOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full lg:translate-x-0 overflow-hidden",
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 sm:p-6 border-b border-teal-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Image src="/images/logo.png" alt="DocIA" width={40} height={40} className="rounded-full" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
              <div>
                <span className="font-bold text-black dark:text-teal-100 text-lg">DocIA</span>
                <p className="text-xs text-black dark:text-teal-400">Assistant Santé</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <LanguageToggle />
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="lg:hidden">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={createNewConversation}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t.newConversation}
          </Button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-teal-100 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Rechercher conversation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-white/50 dark:bg-gray-800/50 border-teal-200 dark:border-gray-700 focus:border-teal-400 dark:focus:border-teal-500"
            />
          </div>
        </div>

        {/* Rest of sidebar content */}
        <ScrollArea className="flex-1 p-2 sm:p-4">
          <div className="space-y-2">
            {conversations
              .filter((conv) => conv.title.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group relative rounded-xl transition-all",
                  currentConversation === conversation.id
                    ? "bg-teal-100 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 shadow-sm"
                    : "hover:bg-teal-50 dark:hover:bg-gray-800/50",
                )}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-3 rounded-xl"
                  onClick={() => selectConversation(conversation.id)}
                >
                  <MessageCircle className="h-4 w-4 mr-3 flex-shrink-0 text-teal-600 dark:text-teal-400" />
                  <div className="flex-1 min-w-0">
                    {editingConversationId === conversation.id ? (
                      <div className="flex items-center space-x-1">
                        <Input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameConversation(conversation.id)
                            if (e.key === "Escape") cancelEdit()
                          }}
                          className="h-8 text-sm flex-grow"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-green-600 hover:bg-green-100"
                          onClick={() => handleRenameConversation(conversation.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-600 hover:bg-red-100"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="truncate font-medium text-sm text-black dark:text-gray-200">{conversation.title}</div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-xs text-black dark:text-gray-400">
                        {new Date(conversation.updated_at).toLocaleDateString()}
                      </div>
                      {conversation.message_count && (
                        <Badge variant="secondary" className="text-xs">
                          {conversation.message_count} msg
                        </Badge>
                      )}
                    </div>
                  </div>
                </Button>
                {/* Container for Edit and Delete buttons, only shown if not currently editing this item */}
                {editingConversationId !== conversation.id && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(conversation);
                      }}
                      className="h-6 w-6 p-0 text-gray-500 dark:text-gray-400 hover:text-blue-500"
                      title="Renommer"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareConversation(conversation.id);
                      }}
                      className="h-6 w-6 p-0 text-gray-500 dark:text-gray-400 hover:text-green-500"
                      title="Partager"
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => deleteConversation(conversation.id, e)}
                      className="h-6 w-6 p-0 text-gray-500 dark:text-gray-400 hover:text-red-500"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* User Profile */}
        <div className="p-4 border-t border-teal-100 dark:border-gray-700 bg-teal-50/50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 border-2 border-teal-200 dark:border-teal-700">
                <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-black dark:text-teal-100">
                  {user?.user_metadata?.full_name || user?.email}
                </div>
                <div className="text-xs text-black dark:text-teal-400">{t.patient}</div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-black dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
                  <User className="h-4 w-4 mr-2" />
                  {t.editProfile}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteAccountDialogOpen(true)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t.deleteAccount}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-teal-100 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Stethoscope className="h-6 sm:h-8 w-6 sm:w-8 text-teal-600 dark:text-teal-400" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-black dark:text-teal-100 text-lg">DocIA Assistant</h1>
                  <p className="text-sm text-black dark:text-teal-400">Douala General Hospital • {t.online}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-green-100 dark:bg-green-900/30 text-black dark:text-green-300 border-green-200 dark:border-green-700 hidden sm:inline-flex"
              >
                ✓ {t.secured}
              </Badge>
              <Badge
                variant="outline"
                className="bg-blue-50 dark:bg-blue-900/30 text-black dark:text-blue-300 border-blue-200 dark:border-blue-700 hidden sm:inline-flex"
              >
                GPT-Neo AI
              </Badge>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="container-responsive py-4 sm:py-6">
            {showWelcome ? (
              /* Welcome Screen */
              <div className="text-center py-8 sm:py-12 space-y-6 sm:space-y-8">
                {/* Logo and main title */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full animate-pulse opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-teal-500 to-blue-600 rounded-full p-4 sm:p-6 shadow-lg">
                      <Stethoscope className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                    </div>
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-3">
                      {t.welcomeTitle}
                    </h1>
                    <p className="text-black dark:text-gray-300 text-base sm:text-lg max-w-2xl mx-auto px-4">
                      {t.welcomeDescription}
                    </p>
                  </div>
                </div>

                {/* Main input area */}
                <div className="max-w-3xl mx-auto space-y-4 px-4">
                  <form onSubmit={handleSubmit} className="relative">
                    <div className="relative">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t.inputPlaceholder}
                        className="w-full h-14 sm:h-16 pl-4 sm:pl-6 pr-28 sm:pr-32 text-base sm:text-lg border-2 border-teal-200 dark:border-teal-700 rounded-2xl focus:border-teal-400 dark:focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:focus:ring-teal-900/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg"
                        disabled={loading}
                      />

                      {/* Buttons in input */}
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 sm:space-x-2">
                        <FileUploadButton onFilesChange={setFiles} disabled={loading} />
                        <VoiceInput onTranscript={handleVoiceTranscript} disabled={loading} />
                        <Button
                          type="submit"
                          disabled={(!input.trim() && files.length === 0) || loading}
                          className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-full shadow-md"
                        >
                          <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Character counter */}
                    <div className="flex justify-between items-center mt-3 px-2 text-xs sm:text-sm">
                      <p className="text-black dark:text-gray-400">
                        DocIA peut analyser vos documents médicaux et images. Parlez ou tapez votre question.
                      </p>
                      <span className="text-black dark:text-gray-500">{input.length}/1000</span>
                    </div>
                  </form>
                </div>

                {/* Health suggestions */}
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-black dark:text-gray-200">
                    {t.popularSuggestions}
                  </h3>
                  <div className="grid-responsive max-w-6xl mx-auto px-4">
                    {healthSuggestions.map((suggestion, index) => {
                      const Icon = suggestion.icon
                      return (
                        <Card
                          key={index}
                          className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 border-transparent hover:border-teal-200 dark:hover:border-teal-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm animate-fade-in"
                          onClick={() => handleSuggestionClick(suggestion.question)}
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <CardContent className="card-responsive">
                            <div className="flex items-start space-x-4">
                              <div
                                className={cn(
                                  "p-3 rounded-xl shadow-sm group-hover:shadow-md transition-all",
                                  suggestion.color.replace("bg-", "bg-").replace("-500", "-100"),
                                  "dark:" + suggestion.color.replace("bg-", "bg-").replace("-500", "-900/30"),
                                )}
                              >
                                <Icon
                                  className={cn(
                                    "h-5 w-5 sm:h-6 sm:w-6",
                                    suggestion.textColor,
                                    "dark:" + suggestion.textColor.replace("text-", "text-").replace("-600", "-400"),
                                  )}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-black dark:text-gray-400 mb-2 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors text-sm sm:text-base">
                                  {suggestion.title}
                                </h4>
                                <p className="text-xs sm:text-sm text-black dark:text-gray-400 leading-relaxed">
                                  {suggestion.question}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700 mt-8 sm:mt-12">
                  <p className="text-xs sm:text-sm text-black dark:text-gray-400 px-4">{t.copyright}</p>
                </div>
              </div>
            ) : (
              /* Messages conversation */
              <div className="space-y-4 sm:space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 sm:gap-4 animate-fade-in",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-teal-200 dark:border-teal-700">
                        <AvatarImage src="/images/logo.png" />
                        <AvatarFallback className="bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300">
                          <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={cn(
                        "max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-md",
                        message.role === "user"
                          ? "bg-gradient-to-r from-teal-500 to-blue-600 text-white"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                      )}
                    >
                      {message.role === "assistant" && typingMessageId === message.id ? (
                        <TypingMarkdown
                          text={message.content}
                          speed={20}
                          onComplete={() => setTypingMessageId(null)}
                          className="text-sm leading-relaxed text-black dark:text-gray-200"
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-black dark:text-gray-200">
                          {message.content}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "text-xs opacity-70",
                              message.role === "user" ? "text-teal-100" : "text-black dark:text-gray-400",
                            )}
                          >
                            {new Date(message.created_at).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          {message.has_files && (
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {t.filesAttached}
                            </Badge>
                          )}
                          {message.metadata?.confidence && (
                            <Badge variant="outline" className="text-xs">
                              {message.metadata.confidence}% {t.confidence}
                            </Badge>
                          )}
                        </div>
                        {message.role === "assistant" && <TextToSpeech text={message.content} />}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-blue-200 dark:border-blue-700">
                        <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                          <User className="h-4 w-4 sm:h-5 sm:w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3 sm:gap-4 justify-start animate-fade-in">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-teal-200 dark:border-teal-700">
                      <AvatarImage src="/images/logo.png" />
                      <AvatarFallback className="bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300">
                        <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-md">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area (visible only when there are messages) */}
        {!showWelcome && (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-teal-100 dark:border-gray-700 p-4 shadow-lg">
            <form onSubmit={handleSubmit} className="container-responsive">
              <div className="relative flex items-center space-x-2 sm:space-x-3">
                <div className="flex-1 relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t.continuePlaceholder}
                    className="pr-20 sm:pr-24 py-2 sm:py-3 text-sm sm:text-base border-2 border-teal-200 dark:border-teal-700 focus:border-teal-400 dark:focus:border-teal-500 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <FileUploadButton onFilesChange={setFiles} disabled={loading} />
                    <VoiceInput onTranscript={handleVoiceTranscript} disabled={loading} />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={(!input.trim() && files.length === 0) || loading}
                  className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-2xl px-4 sm:px-6 py-2 sm:py-3 shadow-md"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-gray-200">{t.modifyProfile}</DialogTitle>
            <DialogDescription className="text-black dark:text-gray-400">Modifiez vos informations personnelles</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {profileError && (
              <Alert className="border-red-200 dark:border-red-800 bg-red-300 dark:bg-red-900/20">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-200">{profileError}</AlertDescription>
              </Alert>
            )}

            {profileSuccess && (
              <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">{profileSuccess}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 text-lg">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-black dark:text-gray-400">{t.profilePhoto}</p>
                <p className="text-xs text-black dark:text-gray-500">{t.autoGenerated}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="email" className="text-black dark:text-gray-200">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-gray-200 dark:bg-gray-800"
              />
              <p className="text-xs text-black dark:text-gray-400">{t.emailCannotChange}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-black dark:text-gray-400">{t.fullName}</Label>
              <div className="flex space-x-2">
                <Input
                  id="fullName"
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  disabled={!editingProfile || profileLoading}
                  placeholder="Votre nom complet"
                />
                {!editingProfile ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingProfile(true)}
                    disabled={profileLoading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex space-x-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={updateProfile}
                      disabled={profileLoading || !newFullName.trim()}
                    >
                      {profileLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingProfile(false)
                        setNewFullName(user?.user_metadata?.full_name || "")
                        setProfileError(null)
                      }}
                      disabled={profileLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="voiceSelect" className="text-black dark:text-gray-200">Voix de l'IA</Label>
              <select
                id="voiceSelect"
                value={selectedVoiceURI}
                onChange={(e) => {
                  const uri = e.target.value
                  setSelectedVoiceURI(uri)
                  localStorage.setItem("selectedVoiceURI", uri)
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-black dark:text-gray-200 focus:ring-teal-500 focus:border-teal-500"
                disabled={availableVoices.length === 0}
              >
                <option value="">Voix par défaut du navigateur</option>
                {availableVoices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
              {availableVoices.length === 0 && (
                <p className="text-xs text-black dark:text-gray-400">Chargement des voix...</p>
              )}
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">{t.deleteAccountTitle}</DialogTitle>
            <DialogDescription className="text-black dark:text-gray-400">{t.deleteAccountDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {profileError && (
              <Alert className="border-red-200 dark:border-red-800 bg-red-300 dark:bg-red-900/20">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-200">{profileError}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center space-x-3 p-4 bg-red-300 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Attention</p>
                <p className="text-xs text-red-700 dark:text-red-300">{t.deleteAccountWarning}</p>
              </div>
            </div>

            <div className="flex space-x-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteAccountDialogOpen(false)} disabled={profileLoading}>
                {t.cancel}
              </Button>
              <Button variant="destructive" onClick={deleteAccount} disabled={profileLoading}>
                {profileLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {t.deleteAccountConfirm}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}