"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download, Trash2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface ModelConfig {
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

interface ModelInfo {
  available: Record<string, ModelConfig>
  current: ModelConfig
  status: string
}

export function ModelSelector() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>("")

  useEffect(() => {
    fetchModelInfo()
  }, [])

  const fetchModelInfo = async () => {
    try {
      const response = await fetch("/api/models")
      const data = await response.json()
      setModelInfo(data)

      // Trouver la clé du modèle actuel
      const currentKey =
        Object.entries(data.available).find(
          ([_, config]) => (config as ModelConfig).model === data.current.model,
        )?.[0] || ""

      setSelectedModel(currentKey)
    } catch (error) {
      toast.error("Erreur lors du chargement des informations des modèles")
    }
  }

  const switchModel = async (modelKey: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch", modelKey }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Modèle changé vers: ${data.current.name}`)
        await fetchModelInfo()
      } else {
        toast.error(data.error || "Erreur lors du changement de modèle")
      }
    } catch (error) {
      toast.error("Erreur lors du changement de modèle")
    } finally {
      setLoading(false)
    }
  }

  const preloadModels = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preload" }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Modèles préchargés avec succès")
      } else {
        toast.error(data.error || "Erreur lors du préchargement")
      }
    } catch (error) {
      toast.error("Erreur lors du préchargement des modèles")
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-cache" }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Cache vidé avec succès")
      } else {
        toast.error(data.error || "Erreur lors du vidage du cache")
      }
    } catch (error) {
      toast.error("Erreur lors du vidage du cache")
    } finally {
      setLoading(false)
    }
  }

  if (!modelInfo) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Chargement des modèles...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Gestionnaire de Modèles IA
        </CardTitle>
        <CardDescription>Gérez les modèles GPT-Neo locaux pour DocIA</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Modèle actuel */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Modèle actuel</label>
          <div className="flex items-center gap-2">
            <Badge variant="default">{modelInfo.current.name}</Badge>
            <Badge variant="outline">Local</Badge>
          </div>
        </div>

        {/* Sélecteur de modèle */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Changer de modèle</label>
          <div className="flex gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel} disabled={loading}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Sélectionner un modèle" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(modelInfo.available).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => switchModel(selectedModel)}
              disabled={
                loading ||
                !selectedModel ||
                selectedModel ===
                  Object.entries(modelInfo.available).find(
                    ([_, config]) => config.model === modelInfo.current.model,
                  )?.[0]
              }
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Changer"}
            </Button>
          </div>
        </div>

        {/* Informations du modèle */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Configuration actuelle</label>
          <div className="bg-muted p-3 rounded-md text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>Tokens max: {modelInfo.current.options.max_new_tokens}</div>
              <div>Température: {modelInfo.current.options.temperature}</div>
              <div>Top-p: {modelInfo.current.options.top_p}</div>
              <div>Répétition: {modelInfo.current.options.repetition_penalty}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={preloadModels} disabled={loading} className="flex-1 bg-transparent">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Précharger
          </Button>
          <Button variant="outline" onClick={clearCache} disabled={loading} className="flex-1 bg-transparent">
            <Trash2 className="h-4 w-4 mr-2" />
            Vider cache
          </Button>
        </div>

        {/* Liste des modèles disponibles */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Modèles disponibles</label>
          <div className="space-y-2">
            {Object.entries(modelInfo.available).map(([key, config]) => (
              <div key={key} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-medium">{config.name}</div>
                  <div className="text-sm text-muted-foreground">{config.model}</div>
                </div>
                <div className="flex gap-1">
                  {config.model === modelInfo.current.model && (
                    <Badge variant="default" className="text-xs">
                      Actuel
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {config.options.max_new_tokens} tokens
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
