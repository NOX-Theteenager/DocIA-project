import { type NextRequest, NextResponse } from "next/server"
import { modelManager } from "@/lib/model-manager"

export async function GET() {
  try {
    const availableModels = modelManager.getAvailableModels()
    const currentConfig = modelManager.getCurrentModelConfig()

    return NextResponse.json({
      available: availableModels,
      current: currentConfig,
      status: "ready",
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, modelKey } = body

    switch (action) {
      case "switch":
        if (!modelKey) {
          return NextResponse.json({ error: "modelKey requis pour changer de modèle" }, { status: 400 })
        }

        modelManager.setCurrentModel(modelKey)
        await modelManager.getCurrentModel() // Précharger le nouveau modèle

        return NextResponse.json({
          message: `Modèle changé vers: ${modelKey}`,
          current: modelManager.getCurrentModelConfig(),
        })

      case "preload":
        await modelManager.preloadModels()
        return NextResponse.json({
          message: "Modèles préchargés avec succès",
        })

      case "clear-cache":
        modelManager.clearCache()
        return NextResponse.json({
          message: "Cache vidé avec succès",
        })

      default:
        return NextResponse.json({ error: "Action non reconnue" }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
