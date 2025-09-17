"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';

interface Event {
  id: string;
  type: string;
  date: string;
  day: string;
  time: string;
  location: string;
  topic: string;
  isRecurring: boolean;
  recurringType: 'weekly' | 'monthly' | 'none';
  customType?: string;
  icon?: string;
}

export default function EventsAdminPage() {
  const { user, isLoaded } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      loadEvents();
    }
  }, [isLoaded, user]);

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async (event: Event) => {
    try {
      // Automatisch Wochentag berechnen
      const eventDate = new Date(event.date);
      const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
      const calculatedDay = weekdays[eventDate.getDay()];
      
      const eventWithCalculatedDay = {
        ...event,
        day: calculatedDay
      };

      const method = event.id && event.id !== 'new' ? 'PUT' : 'POST';
      const response = await fetch('/api/events', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventWithCalculatedDay),
      });

      if (response.ok) {
        await loadEvents();
        setEditingEvent(null);
        alert('✅ Veranstaltung erfolgreich gespeichert!');
      } else {
        const errorData = await response.json();
        console.error('Failed to save event:', errorData);
        
        if (errorData.error === 'Events table not found' && errorData.sql) {
          const message = `❌ Events-Tabelle fehlt in der Datenbank!\n\nBitte führen Sie dieses SQL-Script in Ihrem Supabase Dashboard aus:\n\n${errorData.sql}`;
          alert(message);
        } else {
          const errorMessage = errorData.details ? 
            `${errorData.error}: ${errorData.details}` : 
            errorData.error || 'Unbekannter Fehler';
          alert(`❌ Fehler beim Speichern: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('❌ Fehler beim Speichern der Veranstaltung');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Veranstaltung wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/events?id=${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadEvents();
      } else {
        const errorData = await response.json();
        console.error('Failed to delete event:', errorData);
        const errorMessage = errorData.details ? 
          `${errorData.error}: ${errorData.details}` : 
          errorData.error || 'Unbekannter Fehler';
        alert(`❌ Fehler beim Löschen: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Fehler beim Löschen der Veranstaltung');
    }
  };

  const handleAddEvent = () => {
    const newEvent: Event = {
      id: 'new',
      type: 'TIV',
      date: new Date().toISOString().split('T')[0],
      day: 'Montag',
      time: '09:00 Uhr',
      location: '',
      topic: '',
      isRecurring: false,
      recurringType: 'none',
      customType: '',
      icon: '🎯'
    };
    setEditingEvent(newEvent);
  };


  if (loading) {
    return <div className="p-6">Lade Veranstaltungen...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Veranstaltungen verwalten</h1>
        <p className="text-gray-600 mt-2">Verwalten Sie alle kommenden Veranstaltungen</p>
      </div>

      <div className="mb-4">
        <Button onClick={handleAddEvent} className="bg-blue-600 hover:bg-blue-700 text-white">
          + Neue Veranstaltung
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>
                  {event.icon || '📅'} {event.custom_type && event.type === 'custom' ? event.custom_type : event.type}
                </span>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setEditingEvent(event)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1"
                  >
                    Bearbeiten
                  </Button>
                  <Button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1"
                  >
                    Löschen
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Datum:</strong> {event.day}, {new Date(event.date).toLocaleDateString('de-DE')}</div>
                <div><strong>Uhrzeit:</strong> {event.time}</div>
                <div><strong>Ort:</strong> {event.location}</div>
                {event.topic && (
                  <div><strong>Thema:</strong> {event.topic}</div>
                )}
                {event.isRecurring && (
                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                    <div className="text-green-700 text-xs">
                      🔄 Wiederholt sich {event.recurringType === 'weekly' ? 'wöchentlich' : 'monatlich'}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-30 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl bg-white shadow-2xl">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-xl text-gray-900">
                {editingEvent.id === 'new' ? 'Neue Veranstaltung' : 'Veranstaltung bearbeiten'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <EventForm
                event={editingEvent}
                onSave={handleSaveEvent}
                onCancel={() => setEditingEvent(null)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function EventForm({ event, onSave, onCancel }: {
  event: Event;
  onSave: (event: Event) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    id: event.id || '',
    type: event.type || 'TIV',
    date: event.date || new Date().toISOString().split('T')[0],
    day: event.day || 'Montag',
    time: event.time || '09:00 Uhr',
    location: event.location || '',
    topic: event.topic || '',
    isRecurring: event.isRecurring || false,
    recurringType: event.recurringType || 'none',
    customType: event.customType || '',
    icon: event.icon || '🎯'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Veranstaltungstyp</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value, customType: e.target.value === 'custom' ? formData.customType : '' })}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="TIV">TIV</option>
            <option value="TAA">TAA</option>
            <option value="Powermeeting">Powermeeting</option>
            <option value="Direktionsmeeting">Direktionsmeeting</option>
            <option value="Schulung">Schulung</option>
            <option value="Teammeeting">Teammeeting</option>
            <option value="Telefonparty">Telefonparty</option>
            <option value="custom">Eigener Typ</option>
          </select>
        </div>

        {formData.type === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Eigener Typ</label>
            <input
              type="text"
              value={formData.customType || ''}
              onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
              placeholder="z.B. Kundenevent, Workshop..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tag (automatisch berechnet)</label>
          <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
            {formData.date ? (() => {
              const eventDate = new Date(formData.date);
              const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
              return weekdays[eventDate.getDay()];
            })() : 'Wählen Sie zuerst ein Datum'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Uhrzeit</label>
          <input
            type="text"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            placeholder={formData.type === 'Telefonparty' ? 'z.B. 14:00-16:00 Uhr' : 'z.B. 09:00 Uhr'}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ort</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Ort eingeben"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="z.B. 🎯"
              className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="text-2xl">{formData.icon}</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Beliebige Emoji oder Unicode-Zeichen
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {['🎯', '📞', '⚡', '👥', '📚', '🏢', '🎉', '💼', '📅', '🌟', '🔥', '💡'].map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => setFormData({ ...formData, icon: emoji })}
                className="text-xl p-1 hover:bg-gray-100 rounded"
                title={`Icon ${emoji} verwenden`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Thema (optional)</label>
          <input
            type="text"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            placeholder="Thema eingeben"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-3">🔄 Wiederholung</h4>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked, recurringType: e.target.checked ? 'weekly' : 'none' })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-gray-700">
              Veranstaltung wiederholt sich
            </label>
          </div>
          
          {formData.isRecurring && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Wiederholungstyp</label>
              <select
                value={formData.recurringType}
                onChange={(e) => setFormData({ ...formData, recurringType: e.target.value as 'weekly' | 'monthly' | 'none' })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="weekly">Wöchentlich</option>
                <option value="monthly">Monatlich</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 sticky bottom-0 bg-white p-4 -mx-6 -mb-6">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-medium flex-1 sm:flex-none">
          💾 Speichern
        </Button>
        <Button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 text-base font-medium flex-1 sm:flex-none">
          ❌ Abbrechen
        </Button>
      </div>
    </form>
  );
}
