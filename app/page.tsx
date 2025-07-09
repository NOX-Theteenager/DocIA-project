"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  MessageCircle,
  Shield,
  Clock,
  Users,
  Brain,
  Settings,
  ChevronDown,
  ArrowRight,
  Star,
  TrendingUp,
  Sun,
  Moon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, createContext, useContext, useRef } from "react"

// Theme Context
type Theme = "light" | "dark"
interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark")
      }
    }
  }, [])

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light"
      localStorage.setItem("theme", newTheme)
      document.documentElement.classList.toggle("dark", newTheme === "dark")
      return newTheme
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

// Theme Toggle Component
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="text-white dark:text-gray-200 hover:text-teal-200 dark:hover:text-teal-400 transition-all duration-300"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

// Parallax Image Component with 3D Effect
function ParallaxImage({ src, alt, width, height, className }: { src: string; alt: string; width: number; height: number; className?: string }) {
  const imageRef = useRef<HTMLImageElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2

    const rotateX = (y / rect.height) * 20 // Max 20deg tilt on Y-axis
    const rotateY = -(x / rect.width) * 20 // Max 20deg tilt on X-axis

    imageRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`
  }

  const handleMouseLeave = () => {
    if (imageRef.current) {
      imageRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`
    }
  }

  useEffect(() => {
    // Optional: Add subtle auto-animation for touch devices
    const isTouchDevice = "ontouchstart" in window
    if (isTouchDevice && imageRef.current) {
      let angle = 0
      const animate = () => {
        angle += 0.02
        const rotateX = Math.sin(angle) * 5
        const rotateY = Math.cos(angle) * 5
        if (imageRef.current) {
          imageRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1)`
        }
        requestAnimationFrame(animate)
      }
      const animationFrame = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <div
      className="relative group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: "1000px" }}
    >
      <Image
        ref={imageRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-transform duration-300 ${className}`}
      />
    </div>
  )
}

// Composant pour les statistiques animées
function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      setCount(Math.floor(progress * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration])

  return (
    <span>
      {count}
      {suffix}
    </span>
  )
}

// Composant pour l'effet de typing
function TypingEffect({ text, speed = 100 }: { text: string; speed?: number }) {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, speed])

  return (
    <span>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900 overflow-hidden">
        {/* Header */}
        <header className="bg-teal-800 text-white dark:text-gray-200 relative">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-teal-600/20 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-teal-500/20 rounded-full blur-2xl animate-float-delayed"></div>
          </div>

          <div className="container mx-auto px-4 py-4 relative z-10">
            <nav className="flex items-center justify-between">
              <div
                className={`flex items-center space-x-3 transition-all duration-1000 ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"}`}
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-white/20 dark:bg-gray-800/20 rounded-full animate-pulse"></div>
                  <Image
                    src="/images/logo.png"
                    alt="DocIA Logo"
                    width={40}
                    height={40}
                    className="rounded-full relative z-10 transition-transform group-hover:scale-110 object-cover aspect-square w-10 h-10 sm:w-12 sm:h-12"
                  />
                </div>
                <span className="text-xl font-bold text-white dark:text-gray-200">DocIA</span>
              </div>
              <div
                className={`flex items-center space-x-4 md:space-x-8 transition-all duration-1000 delay-300 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-5 opacity-0"}`}
              >
                <div className="hidden md:flex items-center space-x-8">
                  <Link
                    href="#accueil"
                    className="text-white dark:text-gray-200 hover:text-teal-200 dark:hover:text-teal-400 transition-all duration-300 hover:scale-105 relative group"
                  >
                    Accueil
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-200 dark:bg-teal-400 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link
                    href="#about"
                    className="text-white dark:text-gray-200 hover:text-teal-200 dark:hover:text-teal-400 transition-all duration-300 hover:scale-105 relative group"
                  >
                    À propos
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-200 dark:bg-teal-400 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <div className="relative group">
                    <button className="flex items-center space-x-1 text-white dark:text-gray-200 hover:text-teal-200 dark:hover:text-teal-400 transition-all duration-300 hover:scale-105">
                      <span>Services</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                    </button>
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-800 dark:text-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-20">
                      <Link href="#features" className="block px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/50 rounded-t-lg transition-colors">
                        Fonctionnalités
                      </Link>
                      <Link href="#precision" className="block px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/50 transition-colors">
                        Diagnostic
                      </Link>
                      <Link href="#support" className="block px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/50 rounded-b-lg transition-colors">
                        Support 24/7
                      </Link>
                    </div>
                  </div>
                </div>
                <ThemeToggle />
                <Link
                  href="/auth"
                  className={`transition-all duration-1000 delay-500 ${isVisible ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"}`}
                >
                  <Button className="bg-teal-500 hover:bg-teal-600 text-white dark:text-white px-6 py-2 rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                    Se connecter
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section id="accueil" className="bg-teal-800 dark:bg-gray-800 text-white dark:text-gray-200 py-20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl animate-pulse"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div
                className={`space-y-6 transition-all duration-1000 ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"}`}
              >
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                  <TypingEffect text="DOCAI : VOTRE" speed={80} />
                  <br />
                  <span className="text-teal-200 dark:text-teal-400 animate-fade-in-up delay-1000">ASSISTANT</span>
                  <br />
                  <span className="text-teal-200 dark:text-teal-400 animate-fade-in-up delay-1500">MÉDICAL</span>
                  <br />
                  <span className="text-teal-200 dark:text-teal-400 animate-fade-in-up delay-2000">INTELLIGENT</span>
                </h1>
                <p
                  className={`text-lg text-teal-100 dark:text-gray-300 leading-relaxed max-w-md transition-all duration-1000 delay-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}
                >
                  DocIA est votre compagnon santé intelligent qui vous accompagne dans vos questions médicales avec des
                  réponses fiables et personnalisées, disponible 24h/24 et 7j/7.
                </p>
                <div
                  className={`flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}
                >
                  <Link href="/auth">
                    <Button
                      size="lg"
                      className="bg-teal-500 hover:bg-teal-600 text-white dark:text-white px-8 py-3 rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group"
                    >
                      Commencer maintenant
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white dark:border-gray-200 text-white dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 hover:text-teal-800 dark:hover:text-teal-400 px-8 py-3 rounded-full bg-transparent hover:scale-105 transition-all duration-300"
                  >
                    En savoir plus
                  </Button>
                </div>

                <div
                  className={`grid grid-cols-3 gap-4 pt-8 transition-all duration-1000 delay-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-200 dark:text-teal-400">
                      <AnimatedCounter end={10000} suffix="+" />
                    </div>
                    <div className="text-sm text-teal-300 dark:text-gray-300">Patients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-200 dark:text-teal-400">
                      <AnimatedCounter end={95} suffix="%" />
                    </div>
                    <div className="text-sm text-teal-300 dark:text-gray-300">Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-200 dark:text-teal-400">
                      <AnimatedCounter end={24} suffix="/7" />
                    </div>
                    <div className="text-sm text-teal-300 dark:text-gray-300">Disponible</div>
                  </div>
                </div>
              </div>
              <div
                className={`relative transition-all duration-1000 delay-300 ${isVisible ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"}`}
              >
                <div className="flex items-center justify-center">
                  <ParallaxImage
                    src="/images/logo.png"
                    alt="DocIA Logo"
                    width={400}
                    height={400}
                    className="w-full max-w-[300px] sm:max-w-[400px] lg:max-w-[500px] h-auto rounded-full object-cover shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-pink-50 dark:bg-gray-800 py-20 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-200 mb-4 max-w-4xl mx-auto animate-fade-in-up">
                DÉCOUVREZ COMMENT INTERAGIR FACILEMENT AVEC DOCAI POUR VOS QUESTIONS DE SANTÉ.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: MessageCircle,
                  title: "UNE CONVERSATION FLUIDE ET EMPATHIQUE",
                  description:
                    "Posez vos questions de santé comme si vous parliez à un professionnel bienveillant qui vous comprend.",
                  delay: "delay-100",
                },
                {
                  icon: Settings,
                  title: "POSEZ VOS QUESTIONS ET RECEVEZ DES RÉPONSES PERSONNALISÉES",
                  description:
                    "Notre IA analyse vos questions et vous fournit des informations médicales adaptées à votre situation.",
                  delay: "delay-300",
                },
                {
                  icon: Shield,
                  title: "PROFITEZ D'UNE EXPÉRIENCE UTILISATEUR INTUITIVE AVEC DOCAI",
                  description: "Interface simple et sécurisée pour une expérience optimale dans vos recherches de santé.",
                  delay: "delay-500",
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className={`text-center p-8 border-0 shadow-sm bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-500 hover:scale-105 animate-fade-in-up ${feature.delay} group`}
                >
                  <CardContent className="space-y-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto group-hover:bg-teal-100 dark:group-hover:bg-teal-900 transition-colors duration-300">
                      <feature.icon className="h-8 w-8 text-gray-600 dark:text-gray-300 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200 group-hover:text-teal-800 dark:group-hover:text-teal-400 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
                    <Button
                      variant="link"
                      className="text-teal-600 dark:text-teal-400 p-0 group-hover:scale-110 transition-transform duration-300"
                    >
                      Commencer →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Precision Section */}
        <section id="precision" className="bg-white dark:bg-gray-900 py-20 relative overflow-hidden">
          <div className="absolute top-10 right-10 w-20 h-20 bg-teal-100 dark:bg-teal-900/50 rounded-full opacity-50 animate-float"></div>
          <div className="absolute bottom-10 left-10 w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full opacity-30 animate-float-delayed"></div>

          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-in-left">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 animate-fade-in">PRÉCISION</p>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-200 mb-6 animate-fade-in-up delay-100">
                  UNE PRÉCISION INÉGALÉE POUR VOS DIAGNOSTICS
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 animate-fade-in-up delay-200">
                  Grâce à notre intelligence artificielle avancée, DocIA analyse vos symptômes avec précision et vous
                  guide dans vos questions de santé avec des informations fiables et actualisées.
                </p>
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  <div className="animate-fade-in-up delay-300 group">
                    <h4 className="font-bold text-gray-900 dark:text-gray-200 mb-2 flex items-center group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      <Star className="h-4 w-4 mr-2 text-yellow-500" />
                      DIAGNOSTIC FIABLE
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Analyses basées sur des données médicales validées et des protocoles reconnus.
                    </p>
                  </div>
                  <div className="animate-fade-in-up delay-400 group">
                    <h4 className="font-bold text-gray-900 dark:text-gray-200 mb-2 flex items-center group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                      SUPPORT EMPATHIQUE
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Un accompagnement bienveillant adapté à vos besoins et préoccupations.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 animate-fade-in-up delay-500">
                  <Button className="bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white dark:text-white px-6 py-2 rounded-full hover:scale-105 transition-all duration-300">
                    Essayer
                  </Button>
                  <Button
                    variant="link"
                    className="text-gray-900 dark:text-gray-200 p-0 hover:scale-105 transition-transform duration-300 group"
                  >
                    En savoir plus
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
              <div className="relative animate-fade-in-right">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl aspect-square flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="w-24 h-24 bg-gray-400 dark:bg-gray-600 rounded-lg flex items-center justify-center relative z-10 transition-transform group-hover:scale-110 duration-300 overflow-hidden">
                    <Image
                      src="/precision.png"
                      alt="Precision Diagnostic"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="support" className="bg-blue-50 dark:bg-gray-800 py-20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/20 dark:bg-blue-900/20 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-teal-200/20 dark:bg-teal-900/20 rounded-full blur-2xl animate-float-delayed"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-200 mb-4 animate-fade-in-up">
                DÉCOUVREZ LES FONCTIONNALITÉS DE DOCAI
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto animate-fade-in-up delay-200">
                DocIA offre des réponses instantanées et précises aux questions des patients. Grâce à son langage
                empathique, il facilite la compréhension des diagnostics et des soins.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Clock,
                  title: "ASSISTANCE 24/7 POUR VOS QUESTIONS MÉDICALES",
                  description: "Accédez à des informations médicales à tout moment, jour et nuit.",
                  delay: "delay-100",
                },
                {
                  icon: Brain,
                  title: "RÉPONSES PERSONNALISÉES ET ADAPTÉES À CHAQUE PATIENT",
                  description: "Chaque réponse est adaptée à votre situation spécifique.",
                  delay: "delay-300",
                },
                {
                  icon: Users,
                  title: "INTERFACE INTUITIVE ET FACILE À UTILISER",
                  description: "Une expérience utilisateur simple et accessible à tous.",
                  delay: "delay-500",
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className={`text-center p-8 border-0 shadow-sm bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-500 hover:scale-105 animate-fade-in-up ${feature.delay} group`}
                >
                  <CardContent className="space-y-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors duration-300">
                      <feature.icon className="h-8 w-8 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200 group-hover:text-blue-800 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12 animate-fade-in-up delay-700">
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  className="px-6 py-2 rounded-full bg-transparent text-gray-900 dark:text-gray-200 hover:scale-105 transition-all duration-300"
                >
                  En savoir plus
                </Button>
                <Button
                  variant="link"
                  className="text-gray-900 dark:text-gray-200 p-0 hover:scale-105 transition-transform duration-300 group"
                >
                  Commencer
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-white dark:bg-gray-900 py-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-teal-100 to-blue-100 dark:from-teal-900/50 dark:to-blue-900/50 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-200 mb-4 animate-fade-in-up">DISCUTEZ AVEC DOCAI MAINTENANT</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 animate-fade-in-up delay-200">
              Posez vos questions sur la santé en toute confiance.
            </p>
            <Link href="/auth" className="animate-fade-in-up delay-400 inline-block">
              <Button
                size="lg"
                className="bg-teal-500 hover:bg-teal-600 text-white dark:text-white px-8 py-3 rounded-full hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl group"
              >
                Se lancer dès maintenant
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Blog Section */}
        <section id="about" className="bg-gray-50 dark:bg-gray-800 py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 animate-fade-in-up">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Blog</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-200 mb-4">RESSOURCES SANTÉ</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                Découvrez nos articles et guides pour mieux comprendre votre santé.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  category: "Design",
                  title: "COMPRENDRE LES MÉDICAMENTS COURANTS",
                  description: "Découvrez les effets et utilisations des médicaments.",
                  delay: "delay-100",
                },
                {
                  category: "Research",
                  title: "CONSEILS POUR UNE VIE SAINE",
                  description: "Adoptez des habitudes saines pour améliorer votre bien-être.",
                  delay: "delay-300",
                },
                {
                  category: "Frameworks",
                  title: "INTERPRÉTER VOS RÉSULTATS MÉDICAUX",
                  description: "Comprenez vos résultats pour mieux discuter avec votre médecin.",
                  delay: "delay-500",
                },
              ].map((article, index) => (
                <Card
                  key={index}
                  className={`border-0 shadow-sm bg-white dark:bg-gray-900 overflow-hidden hover:shadow-xl transition-all duration-500 hover:scale-105 animate-fade-in-up ${article.delay} group`}
                >
                  <div className="bg-gray-200 dark:bg-gray-700 h-48 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="w-16 h-16 bg-gray-400 dark:bg-gray-600 rounded-lg flex items-center justify-center relative z-10 transition-transform group-hover:scale-110 duration-300 overflow-hidden">
                      <Image
                        src="/medicaments.png"
                        alt="Article Image"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover opacity-50"
                      />
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{article.category}</p>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200 mb-2 group-hover:text-teal-800 dark:group-hover:text-teal-400 transition-colors duration-300">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{article.description}</p>
                    <Button
                      variant="link"
                      className="text-teal-600 dark:text-teal-400 p-0 group-hover:scale-110 transition-transform duration-300"
                    >
                      En savoir plus →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-teal-800 text-white dark:text-gray-200 py-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl animate-float-delayed"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid md:grid-cols-5 gap-8">
              <div className="animate-fade-in-up">
                <div className="flex items-center space-x-3 mb-4">
                  <Image
                    src="/images/logo.png"
                    alt="DocIA Logo"
                    width={32}
                    height={32}
                    className="rounded-full object-cover aspect-square w-8 h-8 sm:w-10 sm:h-10"
                  />
                  <span className="text-xl font-bold text-white dark:text-gray-200">DocIA</span>
                </div>
                <p className="text-teal-200 dark:text-gray-300 text-sm mb-4">
                  Votre assistant médical intelligent disponible 24h/24 pour répondre à toutes vos questions de santé.
                </p>
                <div className="flex space-x-4">
                  {["facebook", "twitter", "linkedin", "instagram"].map((social, index) => (
                    <div
                      key={social}
                      className={`w-8 h-8 bg-teal-700 dark:bg-teal-900 rounded-full flex items-center justify-center hover:bg-teal-600 dark:hover:bg-teal-800 transition-all duration-300 hover:scale-110 animate-fade-in-up delay-${(index + 1) * 100}`}
                    >
                      <div className="w-4 h-4 bg-white dark:bg-gray-200 rounded-full opacity-70"></div>
                    </div>
                  ))}
                </div>
              </div>

              {[
                {
                  title: "Produit",
                  links: ["Fonctionnalités", "Tarifs", "Sécurité", "Mises à jour"],
                  delay: "delay-200",
                },
                {
                  title: "Entreprise",
                  links: ["À propos", "Blog", "Carrières", "Presse"],
                  delay: "delay-300",
                },
                {
                  title: "Ressources",
                  links: ["Documentation", "Aide", "Statut", "API"],
                  delay: "delay-400",
                },
                {
                  title: "Légal",
                  links: ["Confidentialité", "Conditions", "Cookies", "Licences"],
                  delay: "delay-500",
                },
              ].map((column, index) => (
                <div key={index} className={`animate-fade-in-up ${column.delay}`}>
                  <h4 className="font-bold mb-4 text-white dark:text-gray-200">{column.title}</h4>
                  <ul className="space-y-2">
                    {column.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <Link
                          href="#"
                          className="text-teal-200 dark:text-gray-300 hover:text-white dark:hover:text-gray-100 text-sm transition-all duration-300 hover:scale-105 inline-block"
                        >
                          {link}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="border-t border-teal-700 dark:border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center animate-fade-in-up delay-600">
              <p className="text-teal-200 dark:text-gray-300 text-sm">© 2025 DocIA - Douala General Hospital. Tous droits réservés.</p>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <p className="text-teal-200 dark:text-gray-300 text-sm">Restez informé de nos actualités</p>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Votre email"
                    className="px-4 py-2 rounded-l-full bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm border border-white/20 dark:border-gray-200/20 text-white dark:text-gray-200 placeholder-white/50 dark:placeholder-gray-200/50 focus:outline-none focus:border-white/50 dark:focus:border-gray-200/50 transition-all duration-300"
                  />
                  <Button className="bg-teal-500 hover:bg-teal-600 text-white dark:text-white px-6 py-2 rounded-r-full hover:scale-105 transition-all duration-300">
                    S'abonner
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  )
}