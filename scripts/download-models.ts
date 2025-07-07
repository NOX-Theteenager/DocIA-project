import { pipeline } from "@xenova/transformers"
import { AVAILABLE_MODELS } from "../lib/model-manager"

async function downloadModel(modelKey: string) {
  const config = AVAILABLE_MODELS[modelKey]
  if (!config) {
    console.error(`Modèle non trouvé: ${modelKey}`)
    return
  }

  console.log(`Téléchargement du modèle: ${config.name}`)
  console.log(`Modèle: ${config.model}`)

  try {
    const startTime = Date.now()

    const model = await pipeline(config.task, config.model, {
      quantized: true,
      progress_callback: (progress: any) => {
        if (progress.status === "downloading") {
          const percent = Math.round(progress.progress)
          console.log(`📥 ${progress.name}: ${percent}%`)
        } else if (progress.status === "ready") {
          console.log(`✅ ${progress.name}: Prêt`)
        }
      },
    })

    const endTime = Date.now()
    const duration = Math.round((endTime - startTime) / 1000)

    console.log(`✅ Modèle ${config.name} téléchargé avec succès en ${duration}s`)

    // Test rapide du modèle
    console.log("🧪 Test du modèle...")
    const testResult = await model("Bonjour, je suis", { max_new_tokens: 20 })
    console.log("Test réussi:", testResult[0]?.generated_text?.substring(0, 100))
  } catch (error) {
    console.error(`❌ Erreur lors du téléchargement de ${config.name}:`, error)
  }
}

async function downloadAllModels() {
  console.log("🚀 Téléchargement de tous les modèles disponibles...")

  for (const modelKey of Object.keys(AVAILABLE_MODELS)) {
    await downloadModel(modelKey)
    console.log("---")
  }

  console.log("🎉 Tous les modèles ont été téléchargés!")
}

// Script principal
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log("Usage:")
    console.log("  npm run download-models all          # Télécharger tous les modèles")
    console.log("  npm run download-models gpt-neo-125m # Télécharger un modèle spécifique")
    console.log("\nModèles disponibles:")
    Object.entries(AVAILABLE_MODELS).forEach(([key, config]) => {
      console.log(`  - ${key}: ${config.name}`)
    })
    return
  }

  const command = args[0]

  if (command === "all") {
    await downloadAllModels()
  } else if (AVAILABLE_MODELS[command]) {
    await downloadModel(command)
  } else {
    console.error(`Commande ou modèle non reconnu: ${command}`)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { downloadModel, downloadAllModels }
