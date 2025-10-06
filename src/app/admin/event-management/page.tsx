'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// Event Interface
interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  event_type: string;
  event_category: string;
  topic: string;
  is_recurring: boolean;
  recurrence_type: string;
  recurrence_days: number[];
  recurrence_interval: number;
  recurrence_end_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Speaker Interface
interface Speaker {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  bio: string;
  expertise_areas: string[];
  selected_topics: string[];
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

// Event Topic Interface
interface EventTopic {
  id: string;
  event_category: string;
  topic_name: string;
  description: string;
  is_active: boolean;
}

export default function AdminEventManagementPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('events');
  
  // Events State
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showDeleteEventConfirm, setShowDeleteEventConfirm] = useState<{id: string, title: string} | null>(null);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    event_type: 'TIV',
    event_category: 'TIV',
    topic: '',
    is_recurring: false,
    recurrence_type: 'weekly',
    recurrence_days: [] as number[],
    recurrence_interval: 1,
    recurrence_end_date: ''
  });

  // Speakers State
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [speakersLoading, setSpeakersLoading] = useState(true);

  // Event Topics State
  const [topics, setTopics] = useState<EventTopic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<EventTopic | null>(null);
  const [topicFormData, setTopicFormData] = useState({
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

  // Check if user is admin
  useEffect(() => {
    if (isLoaded && user) {
      checkUserRole();
    } else if (isLoaded && !user) {
      router.push('/simple-dashboard');
    }
  }, [isLoaded, user, router]);

  const checkUserRole = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        // If we can access admin API, user is admin
        loadEvents();
        loadSpeakers();
        loadTopics();
      } else {
        // User is not admin, redirect
        router.push('/simple-dashboard');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      router.push('/simple-dashboard');
    }
  };

  // Events Functions
  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const result = await response.json();
        setEvents(result.data || []);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingEvent ? 'PUT' : 'POST';
      const body = editingEvent ? { id: editingEvent.id, ...eventFormData } : eventFormData;

      const response = await fetch('/api/events', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await loadEvents();
        setShowCreateEventModal(false);
        setShowEditEventModal(false);
        setEditingEvent(null);
        resetEventForm();
      } else {
        const error = await response.json();
        alert(`Fehler beim ${editingEvent ? 'Aktualisieren' : 'Erstellen'} des Events: ` + error.error);
      }
    } catch (error) {
      console.error(`Error ${editingEvent ? 'updating' : 'creating'} event:`, error);
      alert(`Fehler beim ${editingEvent ? 'Aktualisieren' : 'Erstellen'} des Events`);
    }
  };

  const resetEventForm = () => {
    setEventFormData({
      title: '',
      description: '',
      event_date: '',
      start_time: '',
      end_time: '',
      location: '',
      event_type: 'TIV',
      event_category: 'TIV',
      topic: '',
      is_recurring: false,
      recurrence_type: 'weekly',
      recurrence_days: [],
      recurrence_interval: 1,
      recurrence_end_date: ''
    });
  };

  const handleEventEdit = (event: Event) => {
    setEditingEvent(event);
    setEventFormData({
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      event_type: event.event_type,
      event_category: event.event_category,
      topic: event.topic,
      is_recurring: event.is_recurring,
      recurrence_type: event.recurrence_type,
      recurrence_days: event.recurrence_days,
      recurrence_interval: event.recurrence_interval,
      recurrence_end_date: event.recurrence_end_date
    });
    setShowEditEventModal(true);
  };

  const handleEventDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/events?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadEvents();
        setShowDeleteEventConfirm(null);
      } else {
        alert('Fehler beim Löschen des Events');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Fehler beim Löschen des Events');
    }
  };

  // Speakers Functions
  const loadSpeakers = async () => {
    try {
      const response = await fetch('/api/speakers');
      if (response.ok) {
        const result = await response.json();
        setSpeakers(result.data || []);
      }
    } catch (error) {
      console.error('Error loading speakers:', error);
    } finally {
      setSpeakersLoading(false);
    }
  };

  const handleSpeakerApproval = async (id: string, isApproved: boolean) => {
    try {
      const response = await fetch('/api/speakers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_approved: isApproved })
      });

      if (response.ok) {
        await loadSpeakers();
      } else {
        alert('Fehler beim Aktualisieren des Referenten');
      }
    } catch (error) {
      console.error('Error updating speaker:', error);
      alert('Fehler beim Aktualisieren des Referenten');
    }
  };

  // Event Topics Functions
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
      setTopicsLoading(false);
    }
  };

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingTopic ? 'PUT' : 'POST';
      const body = editingTopic ? { id: editingTopic.id, ...topicFormData } : topicFormData;

      const response = await fetch('/api/event-topics', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await loadTopics();
        setShowCreateTopicModal(false);
        setEditingTopic(null);
        resetTopicForm();
      } else {
        const error = await response.json();
        alert(`Fehler beim ${editingTopic ? 'Aktualisieren' : 'Erstellen'} des Topics: ` + error.error);
      }
    } catch (error) {
      console.error(`Error ${editingTopic ? 'updating' : 'creating'} topic:`, error);
      alert(`Fehler beim ${editingTopic ? 'Aktualisieren' : 'Erstellen'} des Topics`);
    }
  };

  const resetTopicForm = () => {
    setTopicFormData({
      event_category: 'TIV',
      topic_name: '',
      description: '',
      is_active: true
    });
  };

  const handleTopicEdit = (topic: EventTopic) => {
    setEditingTopic(topic);
    setTopicFormData({
      event_category: topic.event_category,
      topic_name: topic.topic_name,
      description: topic.description,
      is_active: topic.is_active
    });
  };

  const handleTopicDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/event-topics?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadTopics();
      } else {
        alert('Fehler beim Löschen des Topics');
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Fehler beim Löschen des Topics');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🎯 Event & Speaker Management</h1>
          <p className="text-gray-600">Verwaltung von Events, Referenten und Event-Topics</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events">📅 Events</TabsTrigger>
            <TabsTrigger value="speakers">🎤 Referenten</TabsTrigger>
            <TabsTrigger value="topics">📋 Event-Topics</TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <h2 className="text-xl font-semibold">Event-Verwaltung</h2>
              <Button onClick={() => setShowCreateEventModal(true)}>
                + Neues Event
              </Button>
            </div>

            {eventsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Lade Events...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <Card key={event.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <div className="text-sm text-gray-600">
                          {new Date(event.event_date).toLocaleDateString('de-DE')} • {event.start_time} - {event.end_time}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700">{event.description}</p>
                          <p className="text-sm text-gray-600">📍 {event.location}</p>
                          <p className="text-sm text-gray-600">📂 {event.event_category} • {event.topic || 'Allgemein'}</p>
                          {event.is_recurring && (
                            <p className="text-sm text-blue-600">
                              🔄 {event.recurrence_type} • {event.recurrence_days.map(d => ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d]).join(', ')}
                            </p>
                          )}
                          <div className="flex justify-between items-center mt-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              event.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                              event.status === 'active' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {event.status}
                            </span>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEventEdit(event)}
                              >
                                Bearbeiten
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => setShowDeleteEventConfirm({id: event.id, title: event.title})}
                              >
                                Löschen
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {events.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="text-6xl mb-4">📅</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Events vorhanden</h3>
                      <p className="text-gray-600 mb-4">Erstellen Sie Ihr erstes Event</p>
                      <Button onClick={() => setShowCreateEventModal(true)}>
                        + Event erstellen
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Speakers Tab */}
          <TabsContent value="speakers" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <h2 className="text-xl font-semibold">Referenten-Verwaltung</h2>
              <div className="text-sm text-gray-600">
                {speakers.filter(s => !s.is_approved).length} ausstehende Bewerbungen
              </div>
            </div>

            {speakersLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Lade Referenten...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {speakers.map((speaker) => (
                    <Card key={speaker.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {speaker.first_name} {speaker.last_name}
                            </CardTitle>
                            <p className="text-sm text-gray-600">{speaker.email}</p>
                          </div>
                          <Badge variant={speaker.is_approved ? "default" : "secondary"}>
                            {speaker.is_approved ? "Autorisiert" : "Ausstehend"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {speaker.bio && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Biografie</h4>
                              <p className="text-sm text-gray-700 line-clamp-3">{speaker.bio}</p>
                            </div>
                          )}

                          {speaker.expertise_areas && speaker.expertise_areas.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Expertise</h4>
                              <div className="flex flex-wrap gap-1">
                                {speaker.expertise_areas.map((area, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {area}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {speaker.selected_topics && speaker.selected_topics.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Ausgewählte Themen</h4>
                              <div className="flex flex-wrap gap-1">
                                {speaker.selected_topics.map((topic, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-gray-500">
                            Registriert: {new Date(speaker.created_at).toLocaleDateString('de-DE')}
                          </div>

                          <div className="flex space-x-2 pt-4">
                            {!speaker.is_approved ? (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSpeakerApproval(speaker.id, true)}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  ✅ Autorisieren
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleSpeakerApproval(speaker.id, false)}
                                  className="flex-1"
                                >
                                  ❌ Ablehnen
                                </Button>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleSpeakerApproval(speaker.id, false)}
                                className="flex-1"
                              >
                                🔄 Autorisierung widerrufen
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {speakers.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="text-6xl mb-4">🎤</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Referenten vorhanden</h3>
                      <p className="text-gray-600 mb-4">Referenten können sich über die Speaker-Registration Seite anmelden</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Event Topics Tab */}
          <TabsContent value="topics" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <h2 className="text-xl font-semibold">Event-Topics</h2>
              <Button onClick={() => setShowCreateTopicModal(true)}>
                + Neues Topic
              </Button>
            </div>

            {topicsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Lade Topics...</p>
              </div>
            ) : (
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
                              setTopicFormData(prev => ({ ...prev, event_category: category.value }));
                              setShowCreateTopicModal(true);
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
                                    onClick={() => handleTopicEdit(topic)}
                                  >
                                    Bearbeiten
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-red-600 hover:text-red-800"
                                    onClick={() => {
                                      if (confirm('Möchten Sie dieses Topic wirklich löschen?')) {
                                        handleTopicDelete(topic.id);
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
            )}
          </TabsContent>
        </Tabs>

        {/* Event Create Modal */}
        {showCreateEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 bg-white shadow-lg">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>📅 Neues Event erstellen</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titel *</Label>
                    <Input
                      id="title"
                      value={eventFormData.title}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Beschreibung</Label>
                    <Textarea
                      id="description"
                      value={eventFormData.description}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="event_date">Datum *</Label>
                      <Input
                        id="event_date"
                        type="date"
                        value={eventFormData.event_date}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, event_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Ort</Label>
                      <Input
                        id="location"
                        value={eventFormData.location}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Startzeit</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={eventFormData.start_time}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">Endzeit</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={eventFormData.end_time}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="event_category">Kategorie</Label>
                      <Select 
                        value={eventFormData.event_category} 
                        onValueChange={(value) => setEventFormData(prev => ({ ...prev, event_category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kategorie wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="topic">Topic</Label>
                      <Input
                        id="topic"
                        value={eventFormData.topic}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, topic: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Event erstellen
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateEventModal(false);
                        resetEventForm();
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

        {/* Event Edit Modal */}
        {showEditEventModal && editingEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 bg-white shadow-lg">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>📅 Event bearbeiten</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Titel *</Label>
                    <Input
                      id="edit-title"
                      value={eventFormData.title}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-description">Beschreibung</Label>
                    <Textarea
                      id="edit-description"
                      value={eventFormData.description}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-event_date">Datum *</Label>
                      <Input
                        id="edit-event_date"
                        type="date"
                        value={eventFormData.event_date}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, event_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-location">Ort</Label>
                      <Input
                        id="edit-location"
                        value={eventFormData.location}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-start_time">Startzeit</Label>
                      <Input
                        id="edit-start_time"
                        type="time"
                        value={eventFormData.start_time}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-end_time">Endzeit</Label>
                      <Input
                        id="edit-end_time"
                        type="time"
                        value={eventFormData.end_time}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-event_category">Kategorie</Label>
                      <Select 
                        value={eventFormData.event_category} 
                        onValueChange={(value) => setEventFormData(prev => ({ ...prev, event_category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kategorie wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-topic">Topic</Label>
                      <Input
                        id="edit-topic"
                        value={eventFormData.topic}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, topic: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Event aktualisieren
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowEditEventModal(false);
                        setEditingEvent(null);
                        resetEventForm();
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

        {/* Event Delete Confirmation Modal */}
        {showDeleteEventConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 bg-white shadow-lg">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>🗑️ Event löschen</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <p className="mb-4">
                  Möchten Sie das Event "{showDeleteEventConfirm.title}" wirklich löschen?
                </p>
                <div className="flex space-x-3">
                  <Button 
                    variant="destructive" 
                    onClick={() => handleEventDelete(showDeleteEventConfirm.id)}
                    className="flex-1"
                  >
                    Löschen
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteEventConfirm(null)}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Topic Create Modal */}
        {showCreateTopicModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 bg-white shadow-lg">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>📋 Neues Event-Topic erstellen</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <form onSubmit={handleTopicSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="topic-category">Kategorie</Label>
                    <Select 
                      value={topicFormData.event_category} 
                      onValueChange={(value) => setTopicFormData(prev => ({ ...prev, event_category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kategorie wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="topic-name">Topic Name *</Label>
                    <Input
                      id="topic-name"
                      value={topicFormData.topic_name}
                      onChange={(e) => setTopicFormData(prev => ({ ...prev, topic_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="topic-description">Beschreibung</Label>
                    <Textarea
                      id="topic-description"
                      value={topicFormData.description}
                      onChange={(e) => setTopicFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="topic-active"
                      checked={topicFormData.is_active}
                      onChange={(e) => setTopicFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="topic-active">Aktiv</Label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Topic erstellen
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateTopicModal(false);
                        resetTopicForm();
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

        {/* Topic Edit Modal */}
        {editingTopic && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 bg-white shadow-lg">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>📋 Event-Topic bearbeiten</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <form onSubmit={handleTopicSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="edit-topic-category">Kategorie</Label>
                    <Select 
                      value={topicFormData.event_category} 
                      onValueChange={(value) => setTopicFormData(prev => ({ ...prev, event_category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kategorie wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-topic-name">Topic Name *</Label>
                    <Input
                      id="edit-topic-name"
                      value={topicFormData.topic_name}
                      onChange={(e) => setTopicFormData(prev => ({ ...prev, topic_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-topic-description">Beschreibung</Label>
                    <Textarea
                      id="edit-topic-description"
                      value={topicFormData.description}
                      onChange={(e) => setTopicFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-topic-active"
                      checked={topicFormData.is_active}
                      onChange={(e) => setTopicFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="edit-topic-active">Aktiv</Label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Topic aktualisieren
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setEditingTopic(null);
                        resetTopicForm();
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