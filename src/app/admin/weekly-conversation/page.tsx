'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ConversationPartner {
  id: string;
  name: string;
  team_name: string;
  role: string;
  weekly_progress: any;
  daily_entries: any[];
  highlight_yesterday?: string;
  help_needed?: string;
  improvement_today?: string;
}

interface ConversationData {
  partner: ConversationPartner;
  conversation_points: string[];
  action_items: string[];
  next_steps: string[];
}

export default function WeeklyConversationPage() {
  const [partners, setPartners] = useState<ConversationPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [conversationNotes, setConversationNotes] = useState('');
  const [actionItems, setActionItems] = useState<string[]>(['']);
  const [nextSteps, setNextSteps] = useState<string[]>(['']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    if (selectedPartner) {
      loadConversationData();
    }
  }, [selectedPartner]);

  const loadPartners = async () => {
    try {
      const response = await fetch('/api/admin/team-radar?timeframe=weekly');
      if (response.ok) {
        const data = await response.json();
        const allPartners = data.teams.flatMap((team: any) => team.members);
        setPartners(allPartners);
        if (allPartners.length > 0 && !selectedPartner) {
          setSelectedPartner(allPartners[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/weekly-conversation?partnerId=${selectedPartner}`);
      if (response.ok) {
        const data = await response.json();
        setConversationData(data);
        setActionItems(data.action_items || ['']);
        setNextSteps(data.next_steps || ['']);
      }
    } catch (error) {
      console.error('Error loading conversation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addActionItem = () => {
    setActionItems([...actionItems, '']);
  };

  const updateActionItem = (index: number, value: string) => {
    const newItems = [...actionItems];
    newItems[index] = value;
    setActionItems(newItems);
  };

  const removeActionItem = (index: number) => {
    const newItems = actionItems.filter((_, i) => i !== index);
    setActionItems(newItems);
  };

  const addNextStep = () => {
    setNextSteps([...nextSteps, '']);
  };

  const updateNextStep = (index: number, value: string) => {
    const newSteps = [...nextSteps];
    newSteps[index] = value;
    setNextSteps(newSteps);
  };

  const removeNextStep = (index: number) => {
    const newSteps = nextSteps.filter((_, i) => i !== index);
    setNextSteps(newSteps);
  };

  const saveConversation = async () => {
    try {
      const response = await fetch('/api/admin/weekly-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partnerId: selectedPartner,
          notes: conversationNotes,
          actionItems: actionItems.filter(item => item.trim() !== ''),
          nextSteps: nextSteps.filter(step => step.trim() !== '')
        }),
      });

      if (response.ok) {
        alert('Gespräch erfolgreich gespeichert!');
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
      alert('Fehler beim Speichern des Gesprächs');
    }
  };

  const getPerformanceColor = (current: number, target: number) => {
    if (target === 0) return 'bg-gray-400';
    const progress = (current / target) * 100;
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading && !conversationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Gesprächs-Daten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">💬 Wochen-Gespräch</CardTitle>
                <p className="text-green-100 mt-2">Vorbereitung & Durchführung für Führungsgespräche</p>
              </div>
              <div className="flex space-x-3">
                <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                  <SelectTrigger className="w-64 bg-white text-gray-900">
                    <SelectValue placeholder="Partner wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map(partner => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name} ({partner.team_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={saveConversation}
                  className="bg-white text-green-600 hover:bg-green-50"
                >
                  💾 Gespräch speichern
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {conversationData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Linke Spalte: Performance-Daten */}
            <div className="space-y-6">
              
              {/* Partner-Übersicht */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📊 {conversationData.partner.name} - Wöchentliche Performance
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {conversationData.partner.role} in Team {conversationData.partner.team_name}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(conversationData.partner.weekly_progress).map(([key, value]) => {
                      if (key.includes('_target')) return null;
                      
                      const targetKey = `${key}_target`;
                      const target = conversationData.partner.weekly_progress[targetKey] || 0;
                      const current = value as number;
                      const progress = target > 0 ? (current / target) * 100 : 0;
                      
                      return (
                        <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            {key.toUpperCase().replace('_', ' ')}
                          </div>
                          <div className="text-lg font-bold text-gray-900">{current}/{target}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className={`h-2 rounded-full ${getPerformanceColor(current, target)}`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{Math.round(progress)}%</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Gesprächspunkte */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    💡 Automatische Gesprächspunkte
                  </CardTitle>
                  <p className="text-sm text-gray-600">Basierend auf Performance-Daten</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {conversationData.conversation_points.map((point, index) => (
                      <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm text-blue-800">{point}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Letzte Einträge */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📝 Letzte Tageseinträge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {conversationData.partner.daily_entries.slice(0, 3).map((entry, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          {new Date(entry.entry_date).toLocaleDateString('de-DE')}
                        </div>
                        {entry.highlight_yesterday && (
                          <div className="text-sm text-gray-600 mb-1">
                            <strong>Highlight:</strong> {entry.highlight_yesterday}
                          </div>
                        )}
                        {entry.help_needed && (
                          <div className="text-sm text-gray-600 mb-1">
                            <strong>Hilfe benötigt:</strong> {entry.help_needed}
                          </div>
                        )}
                        {entry.improvement_today && (
                          <div className="text-sm text-gray-600">
                            <strong>Verbesserung:</strong> {entry.improvement_today}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Rechte Spalte: Gesprächs-Notizen */}
            <div className="space-y-6">
              
              {/* Gesprächs-Notizen */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📝 Gesprächs-Notizen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={conversationNotes}
                    onChange={(e) => setConversationNotes(e.target.value)}
                    placeholder="Notizen zum Gespräch..."
                    className="min-h-32"
                  />
                </CardContent>
              </Card>

              {/* Action Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    ✅ Action Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {actionItems.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateActionItem(index, e.target.value)}
                          placeholder="Action Item..."
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeActionItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addActionItem}
                      className="w-full"
                    >
                      + Action Item hinzufügen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🎯 Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {nextSteps.map((step, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={step}
                          onChange={(e) => updateNextStep(index, e.target.value)}
                          placeholder="Next Step..."
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeNextStep(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addNextStep}
                      className="w-full"
                    >
                      + Next Step hinzufügen
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}