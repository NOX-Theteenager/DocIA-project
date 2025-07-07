import { HfInference } from "@huggingface/inference"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY!)

// Configuration pour GPT-Neo
const MODEL_CONFIG = {
  model: "EleutherAI/gpt-neo-2.7B", // Modèle GPT-Neo gratuit
  parameters: {
    max_new_tokens: 512,
    temperature: 0.7,
    top_p: 0.95,
    repetition_penalty: 1.1,
    return_full_text: false,
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

async function callGPTNeoAPI(messages: any[]) {
  try {
    // Préparer le contexte de conversation
    const conversationHistory = messages.slice(-8) // Limiter pour éviter de dépasser la limite de tokens

    let prompt = SYSTEM_PROMPT + "\n\nConversation:\n"

    conversationHistory.forEach((msg) => {
      const role = msg.role === "user" ? "Patient" : "DocIA"
      prompt += `${role}: ${msg.content}\n`
    })

    prompt += "DocIA:"

    const response = await hf.textGeneration({
      model: MODEL_CONFIG.model,
      inputs: prompt,
      parameters: MODEL_CONFIG.parameters,
    })

    let generatedText = response.generated_text || ""

    // Nettoyer la réponse
    generatedText = generatedText.trim()

    // S'assurer que la réponse n'est pas vide
    if (!generatedText) {
      generatedText =
        "Je suis désolé, je n'ai pas pu générer une réponse appropriée. Veuillez reformuler votre question ou consulter directement un professionnel de santé."
    }

    return {
      success: true,
      message: generatedText,
      metadata: {
        model: MODEL_CONFIG.model,
        tokensUsed: prompt.length + generatedText.length,
        confidence: 80,
      },
    }
  } catch (error: any) {
    console.error("Erreur GPT-Neo API:", error)

    // Gestion spécifique des erreurs de quota
    if (error.message?.includes("quota") || error.message?.includes("429")) {
      return {
        success: false,
        error: "Quota API dépassé. Veuillez patienter quelques minutes avant de réessayer.",
        retryAfter: 60,
      }
    }

    // Autres erreurs
    return {
      success: false,
      error: error.message || "Erreur lors de la génération de la réponse",
      retryAfter: 10,
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

    // Appeler l'API GPT-Neo
    const result = await callGPTNeoAPI(messages)

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
