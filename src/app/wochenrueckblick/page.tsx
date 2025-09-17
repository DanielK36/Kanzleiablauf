"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isWeekend } from '@/lib/weekday-logic';

export default function WeeklyReviewPage() {
  const [currentWeekReview, setCurrentWeekReview] = useState({
    opened_up_this_week: "",
    how_to_honor: "",
    next_week_movement: "",
    strongest_moment: "",
    surprise_member: "",
    struggling_member: "",
    next_week_focus: ""
  });

  const [previousWeeks, setPreviousWeeks] = useState([
    {
      week_start: "2024-01-01",
      opened_up_this_week: "Sarah hat sich besonders bei den Empfehlungsgesprächen geöffnet",
      how_to_honor: "Lob in der Team-Besprechung und zusätzliche Unterstützung",
      next_week_movement: "Julius soll mehr Verantwortung übernehmen",
      strongest_moment: "Das erfolgreiche Abschlussgespräch mit Herrn Müller",
      surprise_member: "Sarah hat mich positiv überrascht mit ihrer Initiative",
      struggling_member: "Max hat diese Woche Schwierigkeiten mit der Motivation",
      next_week_focus: "Fokus auf bAV-Checks und strukturierte Beratungsgespräche"
    },
    {
      week_start: "2023-12-25",
      opened_up_this_week: "Julius hat sich bei der Präsentationstechnik verbessert",
      how_to_honor: "Anerkennung im Team und Weiterbildungsmöglichkeit",
      next_week_movement: "Sarah soll mehr Kaltakquise machen",
      strongest_moment: "Das Team-Meeting am Mittwoch war sehr produktiv",
      surprise_member: "Max hat überraschend gut bei den TIV-Einladungen abgeschnitten",
      struggling_member: "Sarah hatte Schwierigkeiten mit der Terminplanung",
      next_week_focus: "Fokus auf Empfehlungen und Netzwerken"
    }
  ]);

  const [selectedWeek, setSelectedWeek] = useState('current');
  const [isEditable, setIsEditable] = useState(false);

  // Check if it's weekend (Friday after 18:00, Saturday, Sunday)
  const canEdit = isWeekend();

  useEffect(() => {
    if (selectedWeek === 'current') {
      setIsEditable(canEdit);
    } else {
      setIsEditable(false);
    }
  }, [selectedWeek, canEdit]);

  const handleInputChange = (field: string, value: string) => {
    if (selectedWeek === 'current') {
      setCurrentWeekReview(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = () => {
    console.log('Saving weekly review:', currentWeekReview);
    alert('Wochenrückblick erfolgreich gespeichert!');
    setIsEditable(false);
  };

  const formatWeekDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getCurrentWeekStart = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Wochenrückblick - Führungskraft
          </h1>
          <p className="text-gray-600 mt-2">
            {canEdit ? 
              "Sie können den Wochenrückblick bearbeiten (Wochenende)" : 
              "Wochenrückblick ist nur am Wochenende bearbeitbar"
            }
          </p>
        </div>

        {/* Week Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📅 Woche auswählen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedWeek('current')}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  selectedWeek === 'current'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                }`}
              >
                Aktuelle Woche ({formatWeekDate(getCurrentWeekStart().toISOString())})
              </button>
              {previousWeeks.map((week, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedWeek(index.toString())}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    selectedWeek === index.toString()
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                >
                  Woche {formatWeekDate(week.week_start)}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Review Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📋 Wochenrückblick</CardTitle>
            <p className="text-sm text-gray-600">
              {selectedWeek === 'current' ? 
                "Beantworten Sie die Fragen für die aktuelle Woche" : 
                "Anzeige der vergangenen Wochenrückblicke"
              }
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Question 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wer hat sich diese Woche besonders geöffnet?
                </label>
                <textarea
                  value={selectedWeek === 'current' ? currentWeekReview.opened_up_this_week : previousWeeks[parseInt(selectedWeek)]?.opened_up_this_week || ''}
                  onChange={(e) => handleInputChange('opened_up_this_week', e.target.value)}
                  disabled={false}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  rows={2}
                  placeholder="Beschreiben Sie, wer sich diese Woche besonders geöffnet hat..."
                />
              </div>

              {/* Question 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Und wie kannst du das ehren?
                </label>
                <textarea
                  value={selectedWeek === 'current' ? currentWeekReview.how_to_honor : previousWeeks[parseInt(selectedWeek)]?.how_to_honor || ''}
                  onChange={(e) => handleInputChange('how_to_honor', e.target.value)}
                  disabled={false}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  rows={2}
                  placeholder="Wie können Sie diese Leistung würdigen?"
                />
              </div>

              {/* Question 3 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wen möchtest du nächste Woche neu in Bewegung bringen?
                </label>
                <textarea
                  value={selectedWeek === 'current' ? currentWeekReview.next_week_movement : previousWeeks[parseInt(selectedWeek)]?.next_week_movement || ''}
                  onChange={(e) => handleInputChange('next_week_movement', e.target.value)}
                  disabled={false}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  rows={2}
                  placeholder="Wer soll nächste Woche neue Impulse bekommen?"
                />
              </div>

              {/* Question 4 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Was war diese Woche dein stärkster Moment?
                </label>
                <textarea
                  value={selectedWeek === 'current' ? currentWeekReview.strongest_moment : previousWeeks[parseInt(selectedWeek)]?.strongest_moment || ''}
                  onChange={(e) => handleInputChange('strongest_moment', e.target.value)}
                  disabled={false}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  rows={2}
                  placeholder="Beschreiben Sie Ihren stärksten Moment dieser Woche..."
                />
              </div>

              {/* Question 5 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wer hat dich überrascht – positive oder herausfordernd?
                </label>
                <textarea
                  value={selectedWeek === 'current' ? currentWeekReview.surprise_member : previousWeeks[parseInt(selectedWeek)]?.surprise_member || ''}
                  onChange={(e) => handleInputChange('surprise_member', e.target.value)}
                  disabled={false}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  rows={2}
                  placeholder="Wer hat Sie überrascht und wie?"
                />
              </div>

              {/* Question 6 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wer ist diese Woche untergegangen?
                </label>
                <textarea
                  value={selectedWeek === 'current' ? currentWeekReview.struggling_member : previousWeeks[parseInt(selectedWeek)]?.struggling_member || ''}
                  onChange={(e) => handleInputChange('struggling_member', e.target.value)}
                  disabled={false}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  rows={2}
                  placeholder="Wer hatte diese Woche Schwierigkeiten?"
                />
              </div>

              {/* Question 7 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Welcher Fokus steht für nächste Woche an?
                </label>
                <textarea
                  value={selectedWeek === 'current' ? currentWeekReview.next_week_focus : previousWeeks[parseInt(selectedWeek)]?.next_week_focus || ''}
                  onChange={(e) => handleInputChange('next_week_focus', e.target.value)}
                  disabled={false}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  rows={2}
                  placeholder="Welcher Fokus soll nächste Woche im Vordergrund stehen?"
                />
              </div>

              {/* Action Buttons */}
              {selectedWeek === 'current' && (
                <div className="flex gap-4 pt-4">
                  {isEditable ? (
                    <>
                      <Button
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg"
                      >
                        Speichern
                      </Button>
                      <Button
                        onClick={() => setIsEditable(false)}
                        variant="outline"
                        className="py-2 px-6 rounded-lg"
                      >
                        Abbrechen
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditable(true)}
                      disabled={!canEdit}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-400"
                    >
                      Bearbeiten
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
