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

## 🛠️ Technologies utilisées

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **IA**: GPT-Neo 2.7B (Hugging Face), OpenFDA API
- **Authentification**: Supabase Auth avec Google OAuth
- **Base de données**: PostgreSQL (Supabase)
- **Déploiement**: Vercel

## 🤖 Configuration et Entraînement du Modèle IA

### Modèle utilisé : GPT-Neo 2.7B

DocIA utilise GPT-Neo, un modèle de langage open-source développé par EleutherAI, spécialement configuré pour les applications médicales.

### Configuration des variables d'environnement

Ajouter dans `.env.local`:
\`\`\`env
HUGGINGFACE_API_KEY=your_huggingface_api_key
\`\`\`

### Obtenir une clé API Hugging Face

1. Créer un compte sur [Hugging Face](https://huggingface.co/)
2. Aller dans Settings > Access Tokens
3. Créer un nouveau token avec les permissions de lecture
4. Copier le token dans votre fichier `.env.local`

### Entraînement et Optimisation pour le Domaine Médical

#### 1. Fine-tuning du modèle (Optionnel - Avancé)

Pour optimiser GPT-Neo spécifiquement pour les questions médicales camerounaises :

**Prérequis :**
- Python 3.8+
- GPU avec au moins 8GB de VRAM (recommandé)
- Transformers library

**Installation des dépendances :**
\`\`\`bash
pip install transformers torch datasets accelerate
\`\`\`

**Script d'entraînement :**
\`\`\`python
# scripts/train_medical_model.py
from transformers import (
    GPTNeoForCausalLM, 
    GPT2Tokenizer, 
    TrainingArguments, 
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
import torch

# Charger le modèle pré-entraîné
model_name = "EleutherAI/gpt-neo-2.7B"
model = GPTNeoForCausalLM.from_pretrained(model_name)
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token

# Données d'entraînement médicales (exemple)
medical_data = [
    {
        "input": "Quels sont les symptômes du paludisme ?",
        "output": "Les symptômes du paludisme incluent : fièvre, frissons, maux de tête, nausées, vomissements, douleurs musculaires. Au Cameroun, consultez immédiatement un médecin si vous présentez ces symptômes."
    },
    {
        "input": "Comment prévenir la dengue ?",
        "output": "Pour prévenir la dengue : éliminez les eaux stagnantes, utilisez des moustiquaires, portez des vêtements longs. La prévention est cruciale dans le climat tropical du Cameroun."
    }
    # Ajouter plus de données médicales spécifiques au contexte camerounais
]

def prepare_dataset(data):
    def tokenize_function(examples):
        inputs = [f"Question: {q}\nRéponse: {r}" for q, r in zip(examples['input'], examples['output'])]
        return tokenizer(inputs, truncation=True, padding=True, max_length=512)
    
    dataset = Dataset.from_list(data)
    tokenized_dataset = dataset.map(tokenize_function, batched=True)
    return tokenized_dataset

# Préparer les données
train_dataset = prepare_dataset(medical_data)

# Configuration d'entraînement
training_args = TrainingArguments(
    output_dir="./medical-gpt-neo",
    overwrite_output_dir=True,
    num_train_epochs=3,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    warmup_steps=100,
    logging_steps=10,
    save_steps=500,
    learning_rate=5e-5,
    fp16=True,  # Pour économiser la mémoire GPU
)

# Data collator
data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False,
)

# Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    data_collator=data_collator,
    train_dataset=train_dataset,
)

# Entraînement
trainer.train()

# Sauvegarder le modèle
model.save_pretrained("./medical-gpt-neo-finetuned")
tokenizer.save_pretrained("./medical-gpt-neo-finetuned")
\`\`\`

#### 2. Optimisation des Prompts

Le système utilise des prompts spécialement conçus pour le contexte médical camerounais :

**Prompt System optimisé :**
- Contexte hospitalier spécifique (Douala General Hospital)
- Adaptation aux maladies tropicales courantes
- Prise en compte des ressources médicales locales
- Recommandations culturellement appropriées

#### 3. Base de Données de Connaissances Médicales

**Créer une base de données spécialisée :**
\`\`\`sql
-- Ajouter des données médicales spécifiques au Cameroun
INSERT INTO medical_knowledge (category, question, answer, context) VALUES
('Paludisme', 'Symptômes du paludisme', 'Fièvre, frissons, maux de tête...', 'Cameroun'),
('Dengue', 'Prévention dengue', 'Éliminer eaux stagnantes...', 'Climat tropical'),
('Nutrition', 'Malnutrition infantile', 'Signes et prévention...', 'Contexte local');
\`\`\`

#### 4. Évaluation et Métriques

**Métriques de performance à surveiller :**
- Précision des réponses médicales
- Pertinence contextuelle (Cameroun)
- Sécurité des recommandations
- Temps de réponse

**Script d'évaluation :**
\`\`\`python
# scripts/evaluate_model.py
def evaluate_medical_responses(model, test_questions):
    scores = {
        'accuracy': 0,
        'safety': 0,
        'relevance': 0
    }
    
    for question in test_questions:
        response = model.generate(question)
        # Évaluer la réponse selon les critères médicaux
        scores['accuracy'] += evaluate_accuracy(response)
        scores['safety'] += evaluate_safety(response)
        scores['relevance'] += evaluate_relevance(response)
    
    return scores
\`\`\`

#### 5. Déploiement du Modèle Fine-tuné

**Option 1 : Hugging Face Hub**
\`\`\`python
# Publier le modèle fine-tuné
model.push_to_hub("your-username/docai-medical-gpt-neo")
\`\`\`

**Option 2 : Déploiement local**
\`\`\`javascript
// Modifier la configuration dans enhanced/route.ts
const MODEL_CONFIG = {
  model: "your-username/docai-medical-gpt-neo", // Votre modèle fine-tuné
  parameters: {
    max_new_tokens: 512,
    temperature: 0.7,
    top_p: 0.95,
    repetition_penalty: 1.1,
  }
}
\`\`\`

### Bonnes Pratiques pour l'Optimisation

1. **Collecte de Données** : Rassemblez des conversations médicales réelles (anonymisées)
2. **Validation Médicale** : Faites valider les réponses par des professionnels de santé
3. **Tests Continus** : Évaluez régulièrement la qualité des réponses
4. **Mise à Jour** : Actualisez le modèle avec de nouvelles données médicales
5. **Monitoring** : Surveillez les performances en production

### Ressources Recommandées

- [Documentation Hugging Face Transformers](https://huggingface.co/docs/transformers)
- [Guide Fine-tuning GPT-Neo](https://huggingface.co/EleutherAI/gpt-neo-2.7B)
- [Datasets médicaux open-source](https://huggingface.co/datasets?search=medical)
- [Éthique IA en santé](https://www.who.int/publications/i/item/ethics-and-governance-of-artificial-intelligence-for-health)

## 📋 Prérequis

- Node.js 18+ 
- Compte Supabase
- Clé API Mistral AI
- Configuration Google OAuth

## 🔧 Installation

1. **Cloner le repository**
\`\`\`bash
git clone https://github.com/votre-username/docai.git
cd docai
\`\`\`

2. **Installer les dépendances**
\`\`\`bash
npm install
\`\`\`

3. **Configuration des variables d'environnement**
\`\`\`bash
cp .env.example .env.local
\`\`\`

Remplir les variables dans `.env.local`:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
MISTRAL_API_KEY=your_mistral_api_key
\`\`\`

4. **Configuration de la base de données**
- Exécuter le script SQL dans `scripts/create-tables.sql` dans votre console Supabase
- Configurer Google OAuth dans les paramètres d'authentification Supabase

5. **Lancer le serveur de développement**
\`\`\`bash
npm run dev
\`\`\`

L'application sera disponible sur `http://localhost:3000`

## 🏗️ Architecture

\`\`\`
docai/
├── app/                    # Pages Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Page d'authentification
│   ├── chat/              # Interface de chat
│   └── page.tsx           # Page d'accueil
├── components/            # Composants React réutilisables
├── lib/                   # Utilitaires et configurations
├── public/               # Assets statiques
└── scripts/              # Scripts SQL et utilitaires
\`\`\`

## 🔒 Sécurité et Confidentialité

- **Chiffrement des données** - Toutes les communications sont chiffrées
- **Authentification sécurisée** - OAuth 2.0 et JWT
- **Isolation des données** - Row Level Security (RLS) activé
- **Avertissements médicaux** - Rappels constants que l'IA ne remplace pas un médecin
- **Conformité RGPD** - Respect des principes de protection des données

## 📊 Utilisation

1. **Inscription/Connexion** - Créer un compte ou se connecter avec Google
2. **Nouvelle conversation** - Cliquer sur "Nouvelle conversation"
3. **Poser des questions** - Taper vos questions de santé dans le chat
4. **Recevoir des réponses** - L'IA analyse et répond avec des informations fiables
5. **Historique** - Accéder à toutes vos conversations précédentes

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
