import { NextResponse } from 'next/server';

// Assurez-vous que ce type correspond à celui dans components/admin-dashboard.tsx
interface DashboardStats {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number; // en ms
  topQuestions: Array<{ question: string; count: number }>;
  userGrowth: Array<{ date: string; users: number }>; // ex: '2023-01-01'
  responseAccuracy: number; // en pourcentage
  systemHealth: "healthy" | "warning" | "critical";
}

export async function GET(request: Request) {
  // const { searchParams } = new URL(request.url);
  // const timeRange = searchParams.get('range') || '7d';
  // Ici, vous pourriez utiliser timeRange pour filtrer vos données réelles.

  // Données mockées pour l'instant
  const mockStats: DashboardStats = {
    totalUsers: Math.floor(Math.random() * 1000) + 500,
    totalConversations: Math.floor(Math.random() * 5000) + 2000,
    totalMessages: Math.floor(Math.random() * 20000) + 10000,
    averageResponseTime: Math.floor(Math.random() * 300) + 200, // ms
    topQuestions: [
      { question: "Quels sont les symptômes de la grippe ?", count: Math.floor(Math.random() * 50) + 20 },
      { question: "Comment traiter un mal de tête ?", count: Math.floor(Math.random() * 40) + 15 },
      { question: "Informations sur le COVID-19", count: Math.floor(Math.random() * 30) + 10 },
    ],
    userGrowth: [
      { date: "2024-05-01", users: 500 },
      { date: "2024-05-08", users: 550 },
      { date: "2024-05-15", users: 610 },
      { date: "2024-05-22", users: 680 },
    ],
    responseAccuracy: Math.floor(Math.random() * 10) + 90, // 90-99%
    systemHealth: "healthy",
  };

  try {
    // Dans une vraie application, vous feriez ici vos appels à la base de données
    // pour calculer les statistiques réelles.
    // Exemple:
    // const users = await supabase.from('user_profiles').select('*', { count: 'exact' });
    // mockStats.totalUsers = users.count || 0;

    return NextResponse.json(mockStats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch admin statistics" }, { status: 500 });
  }
}
