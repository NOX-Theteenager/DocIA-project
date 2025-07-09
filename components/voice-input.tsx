"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Volume2, VolumeX, Paperclip, Camera, FileText, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceInputProps {
  onTranscript: (transcript: string) => void
  disabled?: boolean
  className?: string
}

interface FileUploadProps {
  onFilesChange: (files: File[]) => void
  disabled?: boolean
}

interface TextToSpeechProps {
  text: string
  className?: string
}

// Composant de reconnaissance vocale
export function VoiceInput({ onTranscript, disabled = false, className }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState("")
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Vérifier le support de la reconnaissance vocale
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      setIsSupported(!!SpeechRecognition)

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "fr-FR"

        recognitionRef.current.onstart = () => {
          setIsListening(true)
        }

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          setTranscript(interimTranscript)

          if (finalTranscript) {
            onTranscript(finalTranscript)
            setTranscript("")
          }
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
          setTranscript("")
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Erreur reconnaissance vocale:", event.error)
          setIsListening(false)
          setTranscript("")
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscript])

  const toggleListening = () => {
    if (!isSupported || disabled) return

    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      recognitionRef.current?.start()
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleListening}
        disabled={disabled}
        className={cn(
          "h-8 w-8 p-0 rounded-full transition-all",
          isListening
            ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse"
            : "text-gray-400 hover:text-teal-600 hover:bg-teal-50",
        )}
        title={isListening ? "Arrêter l'enregistrement" : "Commencer l'enregistrement vocal"}
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>

      {transcript && (
        <div className="absolute bottom-full right-0 mb-2 p-2 bg-black/80 text-white text-xs rounded max-w-xs">
          {transcript}
        </div>
      )}
    </div>
  )
}

// Composant de synthèse vocale
export function TextToSpeech({ text, className }: TextToSpeechProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null)

  useEffect(() => {
    const supported = typeof window !== "undefined" && "speechSynthesis" in window
    setIsSupported(supported)
    if (supported) {
      const storedVoiceURI = localStorage.getItem("selectedVoiceURI")
      if (storedVoiceURI) {
        setSelectedVoiceURI(storedVoiceURI)
      }

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0 && storedVoiceURI) {
           // Vérifier si la voix stockée est toujours valide
           const voiceExists = voices.some(v => v.voiceURI === storedVoiceURI)
           if (!voiceExists) {
             localStorage.removeItem("selectedVoiceURI")
             setSelectedVoiceURI(null)
           }
        }
      }
      // Les voix peuvent ne pas être chargées immédiatement
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      } else {
        loadVoices()
      }
    }
  }, [])

  const speak = () => {
    if (!isSupported || !text) return

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    // Nettoyer le texte du markdown
    const cleanText = text
      .replace(/[#*`_~]/g, "")
      .replace(/\[([^\]]+)\]$$[^)]+$$/g, "$1")
      .replace(/\n+/g, " ")
      .trim()

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = "fr-FR" // On garde fr-FR comme langue principale pour le filtrage initial des voix
    utterance.rate = 0.9
    utterance.pitch = 1

    const voices = window.speechSynthesis.getVoices()
    const currentSelectedVoiceURI = localStorage.getItem("selectedVoiceURI") // Lire la valeur la plus récente

    if (currentSelectedVoiceURI) {
      const voice = voices.find((v) => v.voiceURI === currentSelectedVoiceURI)
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang // Utiliser la langue de la voix sélectionnée
      } else {
        // La voix stockée n'existe plus, supprimer la préférence
        localStorage.removeItem("selectedVoiceURI")
      }
    } else {
       // Si aucune voix n'est sélectionnée ou si la voix stockée n'est plus valide,
       // essayer de trouver une voix française par défaut de haute qualité.
       const frenchVoice = voices.find(v => v.lang === "fr-FR" && v.localService) || voices.find(v => v.lang === "fr-FR");
       if (frenchVoice) {
         utterance.voice = frenchVoice;
       }
       // Sinon, la voix par défaut du navigateur pour fr-FR sera utilisée
    }


    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = (event) => {
      console.error("SpeechSynthesis Error:", event)
      setIsSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  if (!isSupported) {
    return null
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={speak}
      className={cn(
        "h-6 w-6 p-0 rounded-full",
        isSpeaking ? "text-blue-600 animate-pulse" : "text-gray-400 hover:text-blue-600",
        className,
      )}
      title={isSpeaking ? "Arrêter la lecture" : "Lire le message"}
    >
      {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
    </Button>
  )
}

// Composant d'upload de fichiers avec bouton trombone
export function FileUploadButton({ onFilesChange, disabled = false }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (newFiles: FileList | null, type?: string) => {
    if (!newFiles) return

    const fileArray = Array.from(newFiles)
    const validFiles: File[] = []

    fileArray.forEach((file) => {
      // Validation basique
      if (file.size <= 10 * 1024 * 1024) {
        // 10MB max
        validFiles.push(file)
      }
    })

    const updatedFiles = [...files, ...validFiles]
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
    setIsOpen(false)
  }

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }

  const uploadOptions = [
    {
      icon: Camera,
      label: "Photo/Image",
      accept: "image/*",
      ref: imageInputRef,
      color: "text-green-600",
    },
    {
      icon: FileText,
      label: "Document",
      accept: ".pdf,.doc,.docx,.txt",
      ref: documentInputRef,
      color: "text-blue-600",
    },
    {
      icon: Upload,
      label: "Tous fichiers",
      accept: "*/*",
      ref: fileInputRef,
      color: "text-purple-600",
    },
  ]

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              "h-8 w-8 p-0 rounded-full transition-all relative",
              files.length > 0
                ? "text-teal-600 bg-teal-50 hover:bg-teal-100"
                : "text-gray-400 hover:text-teal-600 hover:bg-teal-50",
            )}
            title="Joindre des fichiers"
          >
            <Paperclip className="h-4 w-4" />
            {files.length > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-teal-600 text-white"
              >
                {files.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-64 p-3" align="end">
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-900 mb-3">Joindre des fichiers</h4>

            {uploadOptions.map((option, index) => {
              const Icon = option.icon
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 hover:bg-gray-50"
                  onClick={() => option.ref.current?.click()}
                  disabled={disabled}
                >
                  <Icon className={cn("h-5 w-5 mr-3", option.color)} />
                  <div className="text-left">
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-gray-500">Max 10MB</div>
                  </div>
                </Button>
              )
            })}

            {files.length > 0 && (
              <div className="border-t pt-3 mt-3">
                <p className="text-xs text-gray-600 mb-2">Fichiers sélectionnés:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                      <span className="truncate flex-1">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-4 w-4 p-0 ml-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Inputs cachés */}
      {uploadOptions.map((option, index) => (
        <input
          key={index}
          ref={option.ref}
          type="file"
          multiple
          accept={option.accept}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
      ))}
    </div>
  )
}
