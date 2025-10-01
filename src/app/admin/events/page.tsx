'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

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

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{id: string, title: string} | null>(null);
  const [formData, setFormData] = useState({
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
    recurrence_type: 'none',
    recurrence_days: [] as number[],
    recurrence_interval: 1,
    recurrence_end_date: ''
  });

  const weekdays = [
    { value: 1, label: 'Montag' },
    { value: 2, label: 'Dienstag' },
    { value: 3, label: 'Mittwoch' },
    { value: 4, label: 'Donnerstag' },
    { value: 5, label: 'Freitag' },
    { value: 6, label: 'Samstag' },
    { value: 7, label: 'Sonntag' }
  ];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events?limit=all');
      if (response.ok) {
        const result = await response.json();
        setEvents(result.data || []);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const eventData = {
        ...formData,
        recurrence_interval: parseInt(formData.recurrence_interval.toString()),
        recurrence_end_date: formData.recurrence_end_date || null
      };

      const method = editingEvent ? 'PUT' : 'POST';
      const url = editingEvent ? '/api/events' : '/api/events';
      const body = editingEvent ? { id: editingEvent.id, ...eventData } : eventData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await loadEvents();
        setShowCreateModal(false);
        setShowEditModal(false);
        setEditingEvent(null);
        resetForm();
      } else {
        const error = await response.json();
        alert(`Fehler beim ${editingEvent ? 'Aktualisieren' : 'Erstellen'} des Events: ` + error.error);
      }
    } catch (error) {
      console.error(`Error ${editingEvent ? 'updating' : 'creating'} event:`, error);
      alert(`Fehler beim ${editingEvent ? 'Aktualisieren' : 'Erstellen'} des Events`);
    }
  };

  const resetForm = () => {
    setFormData({
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
      recurrence_type: 'none',
      recurrence_days: [],
      recurrence_interval: 1,
      recurrence_end_date: ''
    });
  };

  const handleWeekdayChange = (dayValue: number, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        recurrence_days: [...prev.recurrence_days, dayValue]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        recurrence_days: prev.recurrence_days.filter(d => d !== dayValue)
      }));
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      event_type: event.event_type,
      event_category: event.event_category || 'TIV',
      topic: event.topic || '',
      is_recurring: event.is_recurring,
      recurrence_type: event.recurrence_type,
      recurrence_days: event.recurrence_days || [],
      recurrence_interval: event.recurrence_interval || 1,
      recurrence_end_date: event.recurrence_end_date || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/events?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadEvents();
        setShowDeleteConfirm(null);
      } else {
        const error = await response.json();
        alert('Fehler beim Löschen des Events: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Fehler beim Löschen des Events');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">📅 Event-Verwaltung</h1>
          <Button onClick={() => setShowCreateModal(true)}>
            + Neues Event
          </Button>
        </div>

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
                      🔄 {event.recurrence_type} • {event.recurrence_days.map(d => weekdays.find(w => w.value === d)?.label).join(', ')}
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
                        onClick={() => handleEdit(event)}
                      >
                        Bearbeiten
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm({id: event.id, title: event.title})}
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
              <Button onClick={() => setShowCreateModal(true)}>
                + Event erstellen
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>📅 Neues Event erstellen</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Event-Titel</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Beschreibung</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="event_date">Datum</Label>
                      <Input
                        id="event_date"
                        type="date"
                        value={formData.event_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="event_type">Event-Typ</Label>
                      <Select value={formData.event_type} onValueChange={(value) => setFormData(prev => ({ ...prev, event_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TIV">TIV</SelectItem>
                          <SelectItem value="TAA">TAA</SelectItem>
                          <SelectItem value="Powermeeting">Powermeeting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Startzeit</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">Endzeit</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Ort</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="max_participants">Max. Teilnehmer (leer = unbegrenzt)</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_recurring"
                      checked={formData.is_recurring}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: checked as boolean }))}
                    />
                    <Label htmlFor="is_recurring">Wiederkehrendes Event</Label>
                  </div>

                  {formData.is_recurring && (
                    <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                      <div>
                        <Label htmlFor="recurrence_type">Wiederholungstyp</Label>
                        <Select value={formData.recurrence_type} onValueChange={(value) => setFormData(prev => ({ ...prev, recurrence_type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Wöchentlich</SelectItem>
                            <SelectItem value="monthly">Monatlich</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.recurrence_type === 'weekly' && (
                        <div>
                          <Label>Wochentage</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {weekdays.map((day) => (
                              <div key={day.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`day-${day.value}`}
                                  checked={formData.recurrence_days.includes(day.value)}
                                  onCheckedChange={(checked) => handleWeekdayChange(day.value, checked as boolean)}
                                />
                                <Label htmlFor={`day-${day.value}`} className="text-sm">{day.label}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="recurrence_end_date">Enddatum (optional)</Label>
                        <Input
                          id="recurrence_end_date"
                          type="date"
                          value={formData.recurrence_end_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurrence_end_date: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Event erstellen
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

        {/* Edit Event Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>📅 Event bearbeiten</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Event-Titel</Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-description">Beschreibung</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-event_date">Datum</Label>
                      <Input
                        id="edit-event_date"
                        type="date"
                        value={formData.event_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-event_type">Event-Typ</Label>
                      <Select value={formData.event_type} onValueChange={(value) => setFormData(prev => ({ ...prev, event_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TIV">TIV</SelectItem>
                          <SelectItem value="TAA">TAA</SelectItem>
                          <SelectItem value="Powermeeting">Powermeeting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-start_time">Startzeit</Label>
                      <Input
                        id="edit-start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-end_time">Endzeit</Label>
                      <Input
                        id="edit-end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-location">Ort</Label>
                    <Input
                      id="edit-location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-is_recurring"
                      checked={formData.is_recurring}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: checked as boolean }))}
                    />
                    <Label htmlFor="edit-is_recurring">Wiederkehrendes Event</Label>
                  </div>

                  {formData.is_recurring && (
                    <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                      <div>
                        <Label htmlFor="edit-recurrence_type">Wiederholungstyp</Label>
                        <Select value={formData.recurrence_type} onValueChange={(value) => setFormData(prev => ({ ...prev, recurrence_type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Wöchentlich</SelectItem>
                            <SelectItem value="monthly">Monatlich</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.recurrence_type === 'weekly' && (
                        <div>
                          <Label>Wochentage</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {weekdays.map((day) => (
                              <div key={day.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`edit-day-${day.value}`}
                                  checked={formData.recurrence_days.includes(day.value)}
                                  onCheckedChange={(checked) => handleWeekdayChange(day.value, checked as boolean)}
                                />
                                <Label htmlFor={`edit-day-${day.value}`} className="text-sm">{day.label}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="edit-recurrence_end_date">Enddatum (optional)</Label>
                        <Input
                          id="edit-recurrence_end_date"
                          type="date"
                          value={formData.recurrence_end_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurrence_end_date: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Event aktualisieren
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingEvent(null);
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>🗑️ Event löschen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Sind Sie sicher, dass Sie das Event "{showDeleteConfirm.title}" löschen möchten?
                </p>
                <p className="text-sm text-red-600 mb-6">
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <div className="flex space-x-3">
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDelete(showDeleteConfirm.id)}
                    className="flex-1"
                  >
                    Löschen
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
