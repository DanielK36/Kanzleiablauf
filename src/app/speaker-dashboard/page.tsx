'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RecurringEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
  event_category: string;
  topic: string;
  is_recurring: boolean;
  recurrence_type: string;
  recurrence_days: number[];
  recurrence_interval: number;
  recurrence_end_date: string;
  event_speakers: Array<{
    id: string;
    role: string;
    topic: string;
    is_confirmed: boolean;
    speakers: {
      id: string;
      first_name: string;
      last_name: string;
    };
  }>;
}

interface EventSlot {
  event_id: string;
  date: string;
  is_available: boolean;
  speaker_name?: string;
  speaker_id?: string;
  is_my_booking?: boolean;
}

interface SpeakerBooking {
  id: string;
  event_id: string;
  speaker_id: string;
  event_date: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  created_at: string;
}

export default function SpeakerDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [recurringEvents, setRecurringEvents] = useState<RecurringEvent[]>([]);
  const [eventSlots, setEventSlots] = useState<Record<string, EventSlot[]>>({});
  const [myBookings, setMyBookings] = useState<SpeakerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (isLoaded && user) {
      checkSpeakerAccess();
      loadRecurringEvents();
      loadMyBookings();
      checkNotificationPermission();
    } else if (isLoaded && !user) {
      router.push('/simple-dashboard');
    }
  }, [isLoaded, user, router]);

  const checkSpeakerAccess = async () => {
    try {
      const response = await fetch('/api/speaker-check');
      if (!response.ok) {
        // Try to auto-register as speaker
        const autoRegisterResponse = await fetch('/api/auto-register-speaker', {
          method: 'POST'
        });
        
        if (autoRegisterResponse.ok) {
          // Successfully registered, try again
          const retryResponse = await fetch('/api/speaker-check');
          if (retryResponse.ok) {
            const retryResult = await retryResponse.json();
            if (retryResult.success && retryResult.data.speaker) {
              if (!retryResult.data.isApproved) {
                alert('Deine Speaker-Registrierung ist noch nicht genehmigt. Bitte wende dich an den Administrator.');
                router.push('/simple-dashboard');
                return;
              }
              // Successfully registered and approved
              return;
            }
          }
        }
        
        router.push('/speaker-registration');
        return;
      }
      
      const result = await response.json();
      if (!result.success || !result.data.speaker) {
        // Try to auto-register as speaker
        const autoRegisterResponse = await fetch('/api/auto-register-speaker', {
          method: 'POST'
        });
        
        if (autoRegisterResponse.ok) {
          // Successfully registered, try again
          const retryResponse = await fetch('/api/speaker-check');
          if (retryResponse.ok) {
            const retryResult = await retryResponse.json();
            if (retryResult.success && retryResult.data.speaker) {
              if (!retryResult.data.isApproved) {
                alert('Deine Speaker-Registrierung ist noch nicht genehmigt. Bitte wende dich an den Administrator.');
                router.push('/simple-dashboard');
                return;
              }
              // Successfully registered and approved
              return;
            }
          }
        }
        
        router.push('/speaker-registration');
        return;
      }
      
      if (!result.data.isApproved) {
        alert('Deine Speaker-Registrierung ist noch nicht genehmigt. Bitte wende dich an den Administrator.');
        router.push('/simple-dashboard');
        return;
      }
    } catch (error) {
      console.error('Speaker access check failed:', error);
      router.push('/speaker-registration');
    }
  };

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = Notification.permission;
      setNotificationPermission(permission);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        await subscribeToPushNotifications();
      }
    }
  };

  const subscribeToPushNotifications = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });
        
        // Send subscription to server
        await fetch('/api/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            userId: user?.id
          })
        });
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const loadRecurringEvents = async () => {
    try {
      const response = await fetch('/api/events?recurring=true');
      if (response.ok) {
        const result = await response.json();
        setRecurringEvents(result.data || []);
        
        // Load slots for each recurring event
        for (const event of result.data || []) {
          await loadEventSlots(event.id);
        }
      }
    } catch (error) {
      console.error('Error loading recurring events:', error);
    }
  };

  const loadEventSlots = async (eventId: string) => {
    try {
      const response = await fetch(`/api/event-slots?event_id=${eventId}`);
      if (response.ok) {
        const result = await response.json();
        setEventSlots(prev => ({
          ...prev,
          [eventId]: result.data || []
        }));
      }
    } catch (error) {
      console.error('Error loading event slots:', error);
    }
  };

  const loadMyBookings = async () => {
    try {
      const response = await fetch('/api/speaker-bookings');
      if (response.ok) {
        const result = await response.json();
        setMyBookings(result.data || []);
      } else {
        // Table doesn't exist yet, show empty state
        console.log('Speaker bookings table not available yet');
        setMyBookings([]);
      }
    } catch (error) {
      console.error('Error loading my bookings:', error);
      setMyBookings([]);
    }
  };

  const bookEventSlot = async (eventId: string, date: string) => {
    try {
      const response = await fetch('/api/speaker-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          event_date: date
        })
      });

      if (response.ok) {
        // Reload slots and bookings
        await loadEventSlots(eventId);
        await loadMyBookings();
      } else {
        const error = await response.json();
        console.error('Booking error:', error);
        if (response.status === 404) {
          if (error.error?.includes('Speaker not found')) {
            alert('Du bist noch nicht als Referent registriert. Bitte registriere dich zuerst als Referent.');
            router.push('/speaker-registration');
          } else {
            alert('Die Buchungsfunktion ist noch nicht verfügbar. Bitte wende dich an den Administrator.');
          }
        } else if (response.status === 500) {
          alert(`Server-Fehler: ${error.error}. Debug: ${JSON.stringify(error.debug)}`);
        } else {
          alert(`Fehler beim Buchen: ${error.error}`);
        }
      }
    } catch (error) {
      console.error('Error booking event slot:', error);
      alert('Fehler beim Buchen des Termins');
    }
  };

  const cancelBooking = async (bookingId: string, eventId: string) => {
    try {
      const response = await fetch(`/api/speaker-bookings?id=${bookingId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Reload slots and bookings
        await loadEventSlots(eventId);
        await loadMyBookings();
      } else {
        alert('Fehler beim Stornieren der Buchung');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Fehler beim Stornieren der Buchung');
    }
  };

  const getWeekdayName = (dayNumber: number) => {
    const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return weekdays[dayNumber] || 'Unbekannt';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getSlotStatus = (slot: EventSlot) => {
    if (slot.is_my_booking) return 'my-booking';
    if (!slot.is_available) return 'booked';
    return 'available';
  };

  const getSlotBadgeVariant = (status: string) => {
    switch (status) {
      case 'my-booking': return 'default';
      case 'booked': return 'secondary';
      case 'available': return 'outline';
      default: return 'outline';
    }
  };

  const getSlotBadgeText = (status: string) => {
    switch (status) {
      case 'my-booking': return '✅ Meine Buchung';
      case 'booked': return '🔴 Vergeben';
      case 'available': return '🟢 Verfügbar';
      default: return '❓ Unbekannt';
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Referenten-Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎤 Referenten-Dashboard</h1>
              <p className="text-gray-600">Verfügbare Veranstaltungen buchen und verwalten</p>
            </div>
            <div className="flex items-center space-x-4">
              {notificationPermission === 'default' && (
                <Button onClick={requestNotificationPermission} variant="outline">
                  🔔 Benachrichtigungen aktivieren
                </Button>
              )}
              {notificationPermission === 'granted' && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  🔔 Benachrichtigungen aktiv
                </Badge>
              )}
              <Link href="/speaker-registration">
                <Button variant="outline">
                  📝 Profil bearbeiten
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Notification Status */}
        {notificationPermission === 'denied' && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">⚠️</span>
                <p className="text-yellow-800">
                  Push-Benachrichtigungen sind deaktiviert. Du verpasst möglicherweise neue Veranstaltungen!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Bookings Summary */}
        {myBookings.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">📅 Meine Buchungen ({myBookings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myBookings.slice(0, 6).map((booking) => {
                  const event = recurringEvents.find(e => e.id === booking.event_id);
                  return (
                    <div key={booking.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">
                        {event?.title || 'Unbekannte Veranstaltung'}
                      </div>
                      <div className="text-xs text-blue-700">
                        {formatDate(booking.event_date)} • {event?.start_time}
                      </div>
                      <Badge 
                        variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                        className="mt-2"
                      >
                        {booking.status === 'confirmed' ? '✅ Bestätigt' : '⏳ Ausstehend'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              {myBookings.length > 6 && (
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm">
                    Alle {myBookings.length} Buchungen anzeigen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recurring Events */}
        <div className="space-y-6">
          {recurringEvents.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <div className="text-sm text-gray-600 mt-1">
                      📅 {getWeekdayName(event.recurrence_days[0])} • {event.start_time} - {event.end_time}
                    </div>
                    <div className="text-sm text-gray-600">
                      📍 {event.location} • {event.event_category}
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-700 mt-2">{event.description}</p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {event.event_category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {eventSlots[event.id] && eventSlots[event.id].length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Verfügbare Termine:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {eventSlots[event.id].slice(0, 12).map((slot, index) => {
                        const status = getSlotStatus(slot);
                        const isMyBooking = slot.is_my_booking;
                        const isBooked = !slot.is_available && !isMyBooking;
                        const isAvailable = slot.is_available;

                        return (
                          <div key={index} className="text-center">
                            <div className="text-xs text-gray-600 mb-1">
                              {formatDate(slot.date)}
                            </div>
                            <Badge 
                              variant={getSlotBadgeVariant(status)}
                              className="w-full justify-center"
                            >
                              {getSlotBadgeText(status)}
                            </Badge>
                            {isAvailable && (
                              <Button
                                size="sm"
                                className="w-full mt-2"
                                onClick={() => bookEventSlot(event.id, slot.date)}
                              >
                                Buchen
                              </Button>
                            )}
                            {isMyBooking && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="w-full mt-2"
                                onClick={() => {
                                  const booking = myBookings.find(b => 
                                    b.event_id === event.id && b.event_date === slot.date
                                  );
                                  if (booking) {
                                    cancelBooking(booking.id, event.id);
                                  }
                                }}
                              >
                                Stornieren
                              </Button>
                            )}
                            {isBooked && (
                              <div className="text-xs text-gray-500 mt-2">
                                {slot.speaker_name}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {eventSlots[event.id].length > 12 && (
                      <div className="text-center mt-4">
                        <Button variant="outline" size="sm">
                          Weitere {eventSlots[event.id].length - 12} Termine anzeigen
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">📅</div>
                    <p>Lade verfügbare Termine...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {recurringEvents.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🎤</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine wiederkehrenden Veranstaltungen</h3>
              <p className="text-gray-600 mb-4">Es sind derzeit keine Veranstaltungen verfügbar</p>
              <Link href="/speaker-registration">
                <Button>
                  📝 Als Referent registrieren
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
