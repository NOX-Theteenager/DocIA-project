# DocIA - Votre Assistant Santé Intelligent

DocIA est un assistant médical intelligent développé pour le Douala General Hospital dans le cadre du Hackathon de l'IA de la Santé. Il utilise l'intelligence artificielle pour fournir des informations médicales fiables et personnalisées aux patients.

## 🚀 Fonctionnalités

- **Interface conversationnelle intuitive** - Chat en temps réel avec l'assistant IA
- **Authentification sécurisée** - Connexion via Google OAuth ou email/mot de passe
- **Historique des conversations** - Sauvegarde et accès à toutes vos conversations
- **Réponses personnalisées** - Informations adaptées à vos questions de santé
- **Support multilingue** - Français et anglais
- **Sources fiables** - Intégration avec OpenFDA et bases de données médicales validées
- **Interface responsive** - Optimisée pour mobile et desktop
- **IA locale** - Modèles GPT-Neo intégrés directement dans l'application

## 🛠️ Technologies utilisées

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **IA**: GPT-Neo (local) via @xenova/transformers, OpenFDA API
- **Authentification**: Supabase Auth avec Google OAuth
- **Base de données**: PostgreSQL (Supabase)
- **Déploiement**: Vercel

## 🤖 Configuration et Utilisation des Modèles IA Locaux

### Modèles GPT-Neo Intégrés

DocIA utilise des modèles GPT-Neo qui s'exécutent directement dans votre application, sans dépendre d'APIs externes.

#### Modèles disponibles :

1. **GPT-Neo 125M** (Rapide) - Idéal pour les tests et développement
2. **GPT-Neo 1.3B** (Équilibré) - Meilleur compromis qualité/performance
3. **DistilGPT-2** (Très rapide) - Pour les réponses ultra-rapides

### Installation et Configuration

#### 1. Installation des dépendances

\`\`\`bash
npm install
\`\`\`

#### 2. Téléchargement des modèles

**Télécharger tous les modèles :**
\`\`\`bash
npm run preload-models
\`\`\`

**Télécharger un modèle spécifique :**
\`\`\`bash
npm run download-models gpt-neo-125m
\`\`\`

**Voir les modèles disponibles :**
\`\`\`bash
npm run download-models
\`\`\`

#### 3. Configuration des variables d'environnement

\`\`\`env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
MISTRAL_API_KEY=your_mistral_api_key  # Optionnel, pour fallback
\`\`\`

### Gestion des Modèles

#### Interface de Gestion

L'application inclut une interface de gestion des modèles accessible via le composant `ModelSelector` :

- **Changement de modèle** en temps réel
- **Préchargement** des modèles pour de meilleures performances
- **Vidage du cache** pour libérer la mémoire
- **Monitoring** des performances

#### API de Gestion

\`\`\`typescript
// Changer de modèle
fetch('/api/models', {
  method: 'POST',
  body: JSON.stringify({ action: 'switch', modelKey: 'gpt-neo-1.3b' })
})

// Précharger les modèles
fetch('/api/models', {
  method: 'POST',
  body: JSON.stringify({ action: 'preload' })
})

// Vider le cache
fetch('/api/models', {
  method: 'POST',
  body: JSON.stringify({ action: 'clear-cache' })
})
\`\`\`

### Entraînement et Fine-tuning

#### 1. Préparation des Données Médicales

Créez un dataset spécialisé pour le contexte camerounais :

\`\`\`typescript
// scripts/prepare-medical-data.ts
const medicalData = [
  {
    input: "Quels sont les symptômes du paludisme ?",
    output: "Les symptômes du paludisme incluent : fièvre, frissons, maux de tête, nausées, vomissements, douleurs musculaires. Au Cameroun, consultez immédiatement un médecin si vous présentez ces symptômes."
  },
  {
    input: "Comment prévenir la dengue ?",
    output: "Pour prévenir la dengue : éliminez les eaux stagnantes, utilisez des moustiquaires, portez des vêtements longs. La prévention est cruciale dans le climat tropical du Cameroun."
  }
  // Ajouter plus de données spécifiques au contexte local
]
\`\`\`

#### 2. Fine-tuning avec Transformers.js

\`\`\`typescript
// scripts/fine-tune-model.ts
import { AutoTokenizer, AutoModelForCausalLM } from '@xenova/transformers'

async function fineTuneModel() {
  // Charger le modèle de base
  const tokenizer = await AutoTokenizer.from_pretrained('Xenova/gpt-neo-125M')
  const model = await AutoModelForCausalLM.from_pretrained('Xenova/gpt-neo-125M')
  
  // Préparer les données d'entraînement
  const trainingData = prepareMedicalData()
  
  // Configuration d'entraînement
  const config = {
    learning_rate: 5e-5,
    num_epochs: 3,
    batch_size: 4,
    max_length: 512
  }
  
  // Entraînement (implémentation simplifiée)
  for (const epoch of Array(config.num_epochs).keys()) {
    console.log(`Époque ${epoch + 1}/${config.num_epochs}`)
    
    for (const batch of trainingData) {
      // Tokenisation
      const inputs = tokenizer(batch.input, { 
        return_tensors: 'pt',
        max_length: config.max_length,
        truncation: true,
        padding: true
      })
      
      // Forward pass et calcul de la perte
      // (Implémentation spécifique selon le framework)
    }
  }
  
  // Sauvegarder le modèle fine-tuné
  await model.save_pretrained('./models/docai-medical-gpt-neo')
  await tokenizer.save_pretrained('./models/docai-medical-gpt-neo')
}
\`\`\`

#### 3. Optimisation des Prompts

\`\`\`typescript
// lib/medical-prompts.ts
export const MEDICAL_PROMPTS = {
  general: `Tu es DocIA, un assistant médical du Douala General Hospital au Cameroun.
  
CONTEXTE MÉDICAL CAMEROUNAIS :
- Maladies tropicales courantes : paludisme, dengue, fièvre jaune
- Ressources limitées dans certaines régions
- Importance de la médecine préventive
- Respect des traditions médicales locales

INSTRUCTIONS :
- Fournis des informations médicales générales et éducatives
- Recommande toujours de consulter un professionnel de santé
- Adapte tes conseils au contexte camerounais
- Sois empathique et respectueux des croyances locales`,

  emergency: `URGENCE MÉDICALE - Protocole d'urgence pour le Cameroun :
1. Contacter immédiatement le 118 (SAMU Cameroun)
2. Se rendre à l'hôpital le plus proche
3. Douala General Hospital : +237 233 42 34 56`,

  prevention: `PRÉVENTION SANTÉ AU CAMEROUN :
- Vaccination selon le calendrier national
- Protection contre les moustiques (paludisme, dengue)
- Hygiène alimentaire et hydratation
- Suivi médical régulier`
}
\`\`\`

### Performance et Optimisation

#### Métriques de Performance

\`\`\`typescript
// lib/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  
  recordInference(modelKey: string, duration: number, tokenCount: number) {
    const key = `${modelKey}_inference`
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    this.metrics.get(key)!.push(duration)
    
    // Calculer les tokens par seconde
    const tokensPerSecond = tokenCount / (duration / 1000)
    console.log(`${modelKey}: ${tokensPerSecond.toFixed(2)} tokens/sec`)
  }
  
  getAverageInferenceTime(modelKey: string): number {
    const key = `${modelKey}_inference`
    const times = this.metrics.get(key) || []
    return times.reduce((a, b) => a + b, 0) / times.length
  }
}
\`\`\`

#### Optimisations Recommandées

1. **Quantification** : Utiliser des modèles quantifiés pour réduire la mémoire
2. **Cache intelligent** : Mettre en cache les réponses fréquentes
3. **Streaming** : Implémenter le streaming pour de meilleures UX
4. **Batch processing** : Traiter plusieurs requêtes simultanément

### Déploiement

#### Configuration pour la Production

\`\`\`typescript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@xenova/transformers']
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'sharp$': false,
      'onnxruntime-node$': false,
    }
    return config
  }
}

export default nextConfig
\`\`\`

#### Variables d'Environnement de Production

\`\`\`env
# Production
NODE_ENV=production
TRANSFORMERS_CACHE=/tmp/.cache
MAX_MODEL_MEMORY=2048  # MB
ENABLE_MODEL_QUANTIZATION=true
\`\`\`

### Monitoring et Maintenance

#### Logs et Métriques

\`\`\`typescript
// lib/model-logger.ts
export class ModelLogger {
  static logInference(modelKey: string, prompt: string, response: string, metadata: any) {
    console.log({
      timestamp: new Date().toISOString(),
      model: modelKey,
      promptLength: prompt.length,
      responseLength: response.length,
      tokensUsed: metadata.tokensUsed,
      confidence: metadata.confidence,
      duration: metadata.duration
    })
  }
  
  static logError(error: Error, context: any) {
    console.error({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      context
    })
  }
}
\`\`\`

## 📋 Prérequis

- Node.js 18+ 
- Compte Supabase
- Au moins 4GB de RAM libre pour les modèles
- Espace disque : 2-8GB selon les modèles choisis

## 🔧 Installation Complète

1. **Cloner le repository**
\`\`\`bash
git clone https://github.com/votre-username/docai.git
cd docai
\`\`\`

2. **Installer les dépendances**
\`\`\`bash
npm install
\`\`\`

3. **Télécharger les modèles IA**
\`\`\`bash
npm run preload-models
\`\`\`

4. **Configuration des variables d'environnement**
\`\`\`bash
cp .env.example .env.local
\`\`\`

5. **Configuration de la base de données**
- Exécuter les scripts SQL dans `scripts/`
- Configurer Google OAuth dans Supabase

6. **Lancer le serveur de développement**
\`\`\`bash
npm run dev
\`\`\`

## 🏗️ Architecture

\`\`\`
docai/
├── app/
│   ├── api/
│   │   ├── chat/enhanced/     # API IA avec modèles locaux
│   │   └── models/            # Gestion des modèles
│   ├── auth/                  # Authentification
│   └── chat/                  # Interface de chat
├── components/
│   ├── model-selector.tsx     # Sélecteur de modèles
│   └── ui/                    # Composants UI
├── lib/
│   ├── model-manager.ts       # Gestionnaire de modèles
│   └── medical-prompts.ts     # Prompts médicaux
├── scripts/
│   ├── download-models.ts     # Téléchargement des modèles
│   └── fine-tune-model.ts     # Fine-tuning
└── .cache/                    # Cache des modèles (auto-généré)
\`\`\`

## 🔒 Sécurité et Confidentialité

- **Traitement local** - Aucune donnée envoyée à des services externes
- **Chiffrement des données** - Communications sécurisées
- **Authentification robuste** - OAuth 2.0 et JWT
- **Isolation des données** - Row Level Security (RLS)
- **Avertissements médicaux** - Rappels constants sur les limites de l'IA

## ⚠️ Avertissements Importants

- DocIA ne remplace pas une consultation médicale professionnelle
- Toujours consulter un médecin pour un diagnostic ou traitement
- Les informations fournies sont à titre éducatif uniquement
- En cas d'urgence médicale, contacter immédiatement les services d'urgence

## 🤝 Contribution

Ce projet a été développé dans le cadre du Hackathon de l'IA de la Santé du Douala General Hospital en partenariat avec Data Science Without Borders (DSWB).

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou support technique, contactez l'équipe DocIA à l'adresse: support@docai.health

---

**Développé avec ❤️ pour améliorer l'accès aux soins de santé au Cameroun**
