"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalTeams: number;
  totalAdmins: number;
  totalAdvisors: number;
  totalLeaders: number;
  recentActivity: any[];
}

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTeams: 0,
    totalAdmins: 0,
    totalAdvisors: 0,
    totalLeaders: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      checkAdminAccess();
      loadStats();
    }
  }, [isLoaded]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        router.push('/simple-dashboard');
        return;
      }
    } catch (error) {
      console.error('Admin access check failed:', error);
      router.push('/simple-dashboard');
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const [usersResponse, teamsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/teams')
      ]);

      if (usersResponse.ok) {
        const result = await usersResponse.json();
        const users = result.success ? result.data : result;
        
        // Ensure users is an array
        if (Array.isArray(users)) {
          setStats(prev => ({
            ...prev,
            totalUsers: users.length,
            totalAdmins: users.filter((u: any) => u.role === 'admin').length,
            totalAdvisors: users.filter((u: any) => u.role === 'berater').length,
            totalLeaders: users.filter((u: any) => u.role === 'führungskraft').length
          }));
        } else {
          console.error('Users data is not an array:', users);
          setStats(prev => ({
            ...prev,
            totalUsers: 0,
            totalAdmins: 0,
            totalAdvisors: 0,
            totalLeaders: 0
          }));
        }
      }

      if (teamsResponse.ok) {
        const result = await teamsResponse.json();
        const teams = result.success ? result.data : result;
        
        // Ensure teams is an array
        if (Array.isArray(teams)) {
          setStats(prev => ({
            ...prev,
            totalTeams: teams.length
          }));
        } else {
          console.error('Teams data is not an array:', teams);
          setStats(prev => ({
            ...prev,
            totalTeams: 0
          }));
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminPages = [
    {
      title: 'Frequenz-Radar',
      description: '🌌 Drei-Ebenen-Radar: Zahlen → Spiegel → Frequenz',
      href: '/admin/frequency-radar',
      icon: '🌌',
      color: 'bg-gradient-to-r from-blue-600 to-purple-600',
      priority: 'high'
    },
    {
      title: 'Partner-Detail',
      description: '👤 Einzelne Partner mit allen drei Radar-Ebenen',
      href: '/admin/partner-detail',
      icon: '👤',
      color: 'bg-gradient-to-r from-purple-600 to-pink-600',
      priority: 'high'
    },
    {
      title: 'Wochen-Gespräch',
      description: '💬 Vorbereitung & Durchführung für Führungsgespräche',
      href: '/admin/weekly-conversation',
      icon: '💬',
      color: 'bg-gradient-to-r from-green-600 to-blue-600',
      priority: 'high'
    },
    {
      title: 'Event-Verwaltung',
      description: '📅 Veranstaltungen verwalten',
      href: '/admin/events',
      icon: '📅',
      color: 'bg-gradient-to-r from-orange-600 to-yellow-600',
      priority: 'high'
    },
    {
      title: 'Referenten-Verwaltung',
      description: '🎤 Referenten autorisieren',
      href: '/admin/speakers',
      icon: '🎤',
      color: 'bg-gradient-to-r from-purple-600 to-pink-600',
      priority: 'high'
    },
    {
      title: 'Event-Topics',
      description: '📝 Event-Themen verwalten',
      href: '/admin/event-topics',
      icon: '📝',
      color: 'bg-gradient-to-r from-yellow-600 to-orange-600',
      priority: 'high'
    },
    {
      title: 'Team-Performance-Radar',
      description: '⚡ Führungs-Instrument für Energie-Flow und Performance-Tracking',
      href: '/admin/team-radar',
      icon: '⚡',
      color: 'bg-gradient-to-r from-blue-600 to-purple-600',
      priority: 'medium'
    },
    {
      title: 'Ziele-Management',
      description: '🎯 Individuelle und Team-Ziele für das Performance-Radar setzen',
      href: '/admin/goals-management',
      icon: '🎯',
      color: 'bg-gradient-to-r from-green-600 to-blue-600',
      priority: 'medium'
    },
    {
      title: 'Führungsgespräch-Vorbereitung',
      description: '💬 Tägliche Daten für gezielte Führungsgespräche',
      href: '/admin/leadership-conversation',
      icon: '💬',
      color: 'bg-gradient-to-r from-purple-600 to-pink-600',
      priority: 'medium'
    },
    {
      title: 'Analytics Dashboard',
      description: '📊 Team-Performance und Benutzer-Aktivitäts-Analyse',
      href: '/admin/analytics',
      icon: '📊',
      color: 'bg-gradient-to-r from-green-600 to-blue-600',
      priority: 'high'
    },
    {
      title: 'Benutzer & Teams',
      description: '👥 Benutzer und Teams verwalten',
      href: '/admin/users-teams',
      icon: '👥',
      color: 'bg-gradient-to-r from-blue-600 to-purple-600',
      priority: 'high'
    },
    {
      title: 'Wochentags-Fragen',
      description: 'Fragen für verschiedene Wochentage konfigurieren',
      href: '/admin/weekday-questions',
      icon: '❓',
      color: 'bg-pink-500',
      priority: 'low'
    },
    {
      title: 'Analytics Dashboard',
      description: 'Team-Performance und Benutzer-Aktivitäts-Analyse',
      href: '/admin/analytics',
      icon: '📊',
      color: 'bg-green-500',
      priority: 'low'
    },
  ];


  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-4">Lädt...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🌌 Frequenz-Radar Admin</h1>
              <p className="text-gray-600 mt-2">Führungs-Instrument für Energie-Flow und Performance-Tracking</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Willkommen zurück,</p>
              <p className="font-semibold">{user?.firstName || user?.name?.split(' ')[0] || user?.firstName}</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Teams</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalTeams}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">👤</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Benutzer</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">👑</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalAdmins}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Berater</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.totalAdvisors}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <span className="text-2xl">🎖️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Leader</p>
                  <p className="text-2xl font-bold text-pink-600">{stats.totalLeaders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Pages - Prioritized */}
        <Card>
          <CardHeader>
            <CardTitle>🌌 Frequenz-Radar Tools (Priorität)</CardTitle>
            <p className="text-sm text-gray-600">Drei-Ebenen-System: Zahlen → Spiegel → Frequenz</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* High Priority */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  🌌 Frequenz-Radar (Höchste Priorität)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {adminPages.filter(page => page.priority === 'high').map((page, index) => (
                    <Link key={index} href={page.href}>
                      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-200">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-lg ${page.color} text-white shadow-lg`}>
                              <span className="text-2xl">{page.icon}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-2">{page.title}</h3>
                              <p className="text-sm text-gray-600">{page.description}</p>
                              <div className="mt-2">
                                <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                                  🔥 Priorität
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Medium Priority */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  ⚙️ Erweiterte Admin-Tools
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adminPages.filter(page => page.priority === 'medium').map((page, index) => (
                    <Link key={index} href={page.href}>
                      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 ${page.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                              {page.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{page.title}</h3>
                              <p className="text-sm text-gray-600">{page.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Low Priority */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  📊 Legacy-Tools
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adminPages.filter(page => page.priority === 'low').map((page, index) => (
                    <Link key={index} href={page.href}>
                      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer opacity-75 hover:opacity-100">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 ${page.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                              {page.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{page.title}</h3>
                              <p className="text-sm text-gray-600">{page.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System-Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Supabase</p>
                  <p className="text-sm text-gray-600">Verbindung aktiv</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Clerk Auth</p>
                  <p className="text-sm text-gray-600">Authentifizierung aktiv</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Next.js</p>
                  <p className="text-sm text-gray-600">Server läuft</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
