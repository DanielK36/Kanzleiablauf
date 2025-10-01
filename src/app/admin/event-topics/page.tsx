'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EventTopic {
  id: string;
  event_category: string;
  topic_name: string;
  description: string;
  is_active: boolean;
}

export default function AdminEventTopicsPage() {
  const [topics, setTopics] = useState<EventTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<EventTopic | null>(null);
  const [formData, setFormData] = useState({
    event_category: 'TIV',
    topic_name: '',
    description: '',
    is_active: true
  });

  const categories = [
    { value: 'TIV', label: '🎯 TIV (Finanzanalysen)' },
    { value: 'TAA', label: '📞 TAA (Telefonakquise)' },
    { value: 'Powermeeting', label: '⚡ Powermeeting' }
  ];

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const response = await fetch('/api/event-topics');
      if (response.ok) {
        const result = await response.json();
        setTopics(result.data || []);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/event-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadTopics();
        setShowCreateModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert('Fehler beim Erstellen des Topics: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      alert('Fehler beim Erstellen des Topics');
    }
  };

  const resetForm = () => {
    setFormData({
      event_category: 'TIV',
      topic_name: '',
      description: '',
      is_active: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Topics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">📝 Event-Topics verwalten</h1>
          <Button onClick={() => setShowCreateModal(true)}>
            + Neues Topic
          </Button>
        </div>

        <div className="space-y-6">
          {categories.map((category) => {
            const categoryTopics = topics.filter(topic => topic.event_category === category.value);
            
            return (
              <Card key={category.value}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">{category.label}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {categoryTopics.length} Topics verfügbar
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setFormData(prev => ({ ...prev, event_category: category.value }));
                        setShowCreateModal(true);
                      }}
                    >
                      + Topic hinzufügen
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {categoryTopics.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">📝</div>
                      <p>Keine Topics für {category.label} vorhanden</p>
                      <p className="text-sm mt-2">Klicken Sie auf "Topic hinzufügen" um ein neues Topic zu erstellen</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryTopics.map((topic) => (
                        <div key={topic.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900">{topic.topic_name}</h3>
                            <span className={`px-2 py-1 rounded text-xs ${
                              topic.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {topic.is_active ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </div>
                          {topic.description && (
                            <p className="text-sm text-gray-600 mb-3">{topic.description}</p>
                          )}
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingTopic(topic)}
                            >
                              Bearbeiten
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 hover:text-red-800"
                              onClick={() => {
                                if (confirm('Möchten Sie dieses Topic wirklich löschen?')) {
                                  // TODO: Implement delete functionality
                                  console.log('Delete topic:', topic.id);
                                }
                              }}
                            >
                              Löschen
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Create Topic Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>📝 Neues Topic erstellen</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="event_category">Kategorie</Label>
                    <Select 
                      value={formData.event_category} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, event_category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="topic_name">Topic-Name</Label>
                    <Input
                      id="topic_name"
                      value={formData.topic_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, topic_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Beschreibung (optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Topic erstellen
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="flex-1"
                    >
                      Abbrechen
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
