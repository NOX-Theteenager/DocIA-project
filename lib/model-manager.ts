import { pipeline, env } from "@xenova/transformers"
import path from "path"

// Configuration pour les modèles locaux
env.allowLocalModels = false
env.allowRemoteModels = true
env.cacheDir = path.join(process.cwd(), ".cache")

export interface ModelConfig {
  name: string
  model: string
  task: string
  options: {
    max_new_tokens: number
    temperature: number
    top_p: number
    repetition_penalty: number
    do_sample: boolean
    pad_token_id?: number
  }
}

export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  "gpt-neo-125m": {
    name: "GPT-Neo 125M (Rapide)",
    model: "Xenova/gpt-neo-125M",
    task: "text-generation",
    options: {
      max_new_tokens: 256,
      temperature: 0.7,
      top_p: 0.95,
      repetition_penalty: 1.1,
      do_sample: true,
      pad_token_id: 50256,
    },
  },
  "gpt-neo-1.3b": {
    name: "GPT-Neo 1.3B (Équilibré)",
    model: "Xenova/gpt-neo-1.3B",
    task: "text-generation",
    options: {
      max_new_tokens: 512,
      temperature: 0.7,
      top_p: 0.95,
      repetition_penalty: 1.1,
      do_sample: true,
      pad_token_id: 50256,
    },
  },
  distilgpt2: {
    name: "DistilGPT-2 (Très rapide)",
    model: "Xenova/distilgpt2",
    task: "text-generation",
    options: {
      max_new_tokens: 256,
      temperature: 0.8,
      top_p: 0.9,
      repetition_penalty: 1.2,
      do_sample: true,
      pad_token_id: 50256,
    },
  },
}

class ModelManager {
  private models: Map<string, any> = new Map()
  private currentModel = "gpt-neo-125m"

  async loadModel(modelKey: string): Promise<any> {
    if (this.models.has(modelKey)) {
      return this.models.get(modelKey)
    }

    const config = AVAILABLE_MODELS[modelKey]
    if (!config) {
      throw new Error(`Modèle non trouvé: ${modelKey}`)
    }

    console.log(`Chargement du modèle: ${config.name}`)

    try {
      const model = await pipeline(config.task, config.model, {
        quantized: true,
        progress_callback: (progress: any) => {
          if (progress.status === "downloading") {
            console.log(`Téléchargement ${config.name}: ${progress.name} - ${Math.round(progress.progress)}%`)
          }
        },
      })

      this.models.set(modelKey, model)
      console.log(`Modèle ${config.name} chargé avec succès`)

      return model
    } catch (error) {
      console.error(`Erreur lors du chargement du modèle ${config.name}:`, error)
      throw error
    }
  }

  async getCurrentModel(): Promise<any> {
    return this.loadModel(this.currentModel)
  }

  getCurrentModelConfig(): ModelConfig {
    return AVAILABLE_MODELS[this.currentModel]
  }

  setCurrentModel(modelKey: string): void {
    if (!AVAILABLE_MODELS[modelKey]) {
      throw new Error(`Modèle non disponible: ${modelKey}`)
    }
    this.currentModel = modelKey
  }

  getAvailableModels(): Record<string, ModelConfig> {
    return AVAILABLE_MODELS
  }

  async preloadModels(): Promise<void> {
    console.log("Préchargement des modèles...")

    // Précharger le modèle par défaut
    try {
      await this.loadModel(this.currentModel)
    } catch (error) {
      console.error("Erreur lors du préchargement:", error)
    }
  }

  clearCache(): void {
    this.models.clear()
    console.log("Cache des modèles vidé")
  }
}

export const modelManager = new ModelManager()
