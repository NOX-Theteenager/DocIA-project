import { pipeline, env } from "@xenova/transformers"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import path from "path"

// Configuration pour utiliser les modèles locaux
env.allowLocalModels = false
env.allowRemoteModels = true
env.cacheDir = path.join(process.cwd(), ".cache")

// Cache global pour le modèle
let modelCache: any = null

// Configuration pour GPT-Neo local
const MODEL_CONFIG = {
  model: "Xenova/gpt-neo-125M", // Version plus légère pour commencer
  task: "text-generation",
  options: {
    max_new_tokens: 512,
    temperature: 0.7,
    top_p: 0.95,
    repetition_penalty: 1.1,
    do_sample: true,
    pad_token_id: 50256, // Token de padding pour GPT-Neo
  },
}

const SYSTEM_PROMPT = `Tu es DocIA, un assistant médical intelligent du Douala General Hospital au Cameroun. 

INSTRUCTIONS IMPORTANTES :
- Tu fournis des informations médicales générales et éducatives
- Tu ne remplaces JAMAIS un médecin ou un diagnostic médical professionnel
- Tu recommandes toujours de consulter un professionnel de santé pour des problèmes sérieux
- Tu peux analyser des symptômes décrits et donner des conseils préventifs
- Tu réponds en français de manière claire et empathique
- Tu utilises tes connaissances médicales pour donner des conseils préventifs
- En cas d'urgence, tu recommandes immédiatement de contacter les services d'urgence

CONTEXTE MÉDICAL :
- Hôpital : Douala General Hospital, Cameroun
- Spécialités : Médecine générale, cardiologie, neurologie, pédiatrie
- Protocoles : Standards internationaux adaptés au contexte africain

Réponds de manière professionnelle, bienveillante et informative.

IMPORTANT: Termine toujours tes réponses par un rappel de consulter un professionnel de santé si nécessaire.`

async function initializeModel() {
  if (modelCache) {
    return modelCache
  }

  try {
    console.log("Initialisation du modèle GPT-Neo local...")

    // Créer le pipeline de génération de texte
    modelCache = await pipeline(MODEL_CONFIG.task, MODEL_CONFIG.model, {
      quantized: true, // Utiliser la version quantifiée pour économiser la mémoire
      progress_callback: (progress: any) => {
        if (progress.status === "downloading") {
          console.log(`Téléchargement: ${progress.name} - ${Math.round(progress.progress)}%`)
        }
      },
    })

    console.log("Modèle GPT-Neo initialisé avec succès")
    return modelCache
  } catch (error) {
    console.error("Erreur lors de l'initialisation du modèle:", error)
    throw error
  }
}

async function generateWithLocalGPTNeo(messages: any[]) {
  try {
    const model = await initializeModel()

    // Préparer le contexte de conversation
    const conversationHistory = messages.slice(-6) // Limiter pour éviter de dépasser la limite de tokens

    let prompt = SYSTEM_PROMPT + "\n\nConversation:\n"

    conversationHistory.forEach((msg) => {
      const role = msg.role === "user" ? "Patient" : "DocIA"
      prompt += `${role}: ${msg.content}\n`
    })

    prompt += "DocIA:"

    // Générer la réponse
    const result = await model(prompt, MODEL_CONFIG.options)

    let generatedText = ""
    if (Array.isArray(result) && result.length > 0) {
      generatedText = result[0].generated_text || ""
    } else if (result.generated_text) {
      generatedText = result.generated_text
    }

    // Nettoyer la réponse - enlever le prompt original
    if (generatedText.includes("DocIA:")) {
      const parts = generatedText.split("DocIA:")
      generatedText = parts[parts.length - 1].trim()
    }

    // Limiter la longueur de la réponse
    if (generatedText.length > 1000) {
      generatedText = generatedText.substring(0, 1000) + "..."
    }

    // S'assurer que la réponse n'est pas vide
    if (!generatedText || generatedText.length < 10) {
      generatedText =
        "Je suis désolé, je n'ai pas pu générer une réponse appropriée. Veuillez reformuler votre question ou consulter directement un professionnel de santé."
    }

    // Ajouter un rappel médical si pas déjà présent
    if (!generatedText.toLowerCase().includes("consulter") && !generatedText.toLowerCase().includes("médecin")) {
      generatedText += "\n\nN'oubliez pas de consulter un professionnel de santé pour un avis médical personnalisé."
    }

    return {
      success: true,
      message: generatedText,
      metadata: {
        model: MODEL_CONFIG.model,
        tokensUsed: prompt.length + generatedText.length,
        confidence: 75,
        local: true,
      },
    }
  } catch (error: any) {
    console.error("Erreur GPT-Neo local:", error)

    return {
      success: false,
      error: error.message || "Erreur lors de la génération de la réponse avec le modèle local",
      retryAfter: 5,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: { message: "Non autorisé" } }, { status: 401 })
    }

    // Traiter la requête JSON
    const body = await request.json()
    const messages = body.messages || []
    const conversationId = body.conversationId || ""

    if (!messages.length) {
      return NextResponse.json({ error: { message: "Messages requis" } }, { status: 400 })
    }

    // Générer la réponse avec GPT-Neo local
    const result = await generateWithLocalGPTNeo(messages)

    if (!result.success) {
      return NextResponse.json({ error: { message: result.error } }, { status: result.retryAfter ? 429 : 500 })
    }

    // Sauvegarder les messages en base de données
    if (conversationId) {
      try {
        // Sauvegarder le message utilisateur
        const userMessage = messages[messages.length - 1]
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: userMessage.role,
          content: userMessage.content,
          metadata: null,
        })

        // Sauvegarder la réponse de l'assistant
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: result.message,
          metadata: result.metadata,
        })

        // Mettre à jour la conversation
        await supabase
          .from("conversations")
          .update({
            updated_at: new Date().toISOString(),
            message_count: messages.length + 1,
          })
          .eq("id", conversationId)
      } catch (dbError) {
        console.error("Erreur sauvegarde DB:", dbError)
        // Continue même si la sauvegarde échoue
      }
    }

    return NextResponse.json({
      message: result.message,
      metadata: result.metadata,
    })
  } catch (error: any) {
    console.error("Erreur API chat:", error)
    return NextResponse.json({ error: { message: "Erreur interne du serveur" } }, { status: 500 })
  }
}
