"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface WeekdayQuestion {
  id?: string;
  weekday: number;
  yesterday_question: string[];
  today_questions: string[];
  trainee_question: string[];
  created_at?: string;
  updated_at?: string;
}

export default function WeekdayQuestionsAdmin() {
  const [questions, setQuestions] = useState<WeekdayQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<WeekdayQuestion | null>(null);

  const weekdays = [
    { value: 1, label: 'Montag' },
    { value: 2, label: 'Dienstag' },
    { value: 3, label: 'Mittwoch' },
    { value: 4, label: 'Donnerstag' },
    { value: 5, label: 'Freitag' }
  ];

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      console.log('🔍 Loading weekday questions...');
      const response = await fetch('/api/admin/weekday-questions');
      console.log('🔍 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Loaded questions:', data);
        setQuestions(data);
      } else {
        const errorText = await response.text();
        console.error('🔍 Error loading questions:', errorText);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveQuestion = async (question: WeekdayQuestion) => {
    try {
      const response = await fetch('/api/admin/weekday-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(question),
      });

      if (response.ok) {
        await loadQuestions();
        setEditingQuestion(null);
        alert('Fragen erfolgreich gespeichert!');
      } else {
        const errorData = await response.json();
        console.error('Error saving question:', errorData);
        alert('Fehler beim Speichern: ' + (errorData.error || 'Unbekannter Fehler'));
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Fehler beim Speichern: ' + error);
    }
  };

  const addTodayQuestion = (question: WeekdayQuestion) => {
    const updatedQuestion = {
      ...question,
      today_questions: [...question.today_questions, '']
    };
    setEditingQuestion(updatedQuestion);
  };

  const updateTodayQuestion = (question: WeekdayQuestion, index: number, value: string) => {
    const updatedQuestion = {
      ...question,
      today_questions: question.today_questions.map((q, i) => i === index ? value : q)
    };
    setEditingQuestion(updatedQuestion);
  };

  const removeTodayQuestion = (question: WeekdayQuestion, index: number) => {
    const updatedQuestion = {
      ...question,
      today_questions: question.today_questions.filter((_, i) => i !== index)
    };
    setEditingQuestion(updatedQuestion);
  };

  // Helper functions for yesterday questions
  const addYesterdayQuestion = (question: WeekdayQuestion) => {
    const updatedQuestion = {
      ...question,
      yesterday_question: [...question.yesterday_question, '']
    };
    setEditingQuestion(updatedQuestion);
  };

  const updateYesterdayQuestion = (question: WeekdayQuestion, index: number, value: string) => {
    const updatedQuestion = {
      ...question,
      yesterday_question: question.yesterday_question.map((q, i) => i === index ? value : q)
    };
    setEditingQuestion(updatedQuestion);
  };

  const removeYesterdayQuestion = (question: WeekdayQuestion, index: number) => {
    const updatedQuestion = {
      ...question,
      yesterday_question: question.yesterday_question.filter((_, i) => i !== index)
    };
    setEditingQuestion(updatedQuestion);
  };

  // Helper functions for trainee questions
  const addTraineeQuestion = (question: WeekdayQuestion) => {
    const updatedQuestion = {
      ...question,
      trainee_question: [...question.trainee_question, '']
    };
    setEditingQuestion(updatedQuestion);
  };

  const updateTraineeQuestion = (question: WeekdayQuestion, index: number, value: string) => {
    const updatedQuestion = {
      ...question,
      trainee_question: question.trainee_question.map((q, i) => i === index ? value : q)
    };
    setEditingQuestion(updatedQuestion);
  };

  const removeTraineeQuestion = (question: WeekdayQuestion, index: number) => {
    const updatedQuestion = {
      ...question,
      trainee_question: question.trainee_question.filter((_, i) => i !== index)
    };
    setEditingQuestion(updatedQuestion);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Wochentags-Fragen verwalten</h1>
        <p>Lade Fragen...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Wochentags-Fragen verwalten</h1>
      
      {questions.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-4">Keine Fragen gefunden. Erstelle neue Fragen:</p>
            <Button onClick={() => {
              const newQuestion: WeekdayQuestion = {
                weekday: 1,
                yesterday_question: '',
                today_questions: [''],
                trainee_question: ''
              };
              setEditingQuestion(newQuestion);
            }}>
              Neue Fragen erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {weekdays.map(weekday => {
            const question = questions.find(q => q.weekday === weekday.value);
            const isEditing = editingQuestion?.weekday === weekday.value;
            
            return (
              <Card key={weekday.value}>
                <CardHeader>
                  <CardTitle>{weekday.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      {/* Gestern-Fragen */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Fragen für gestern:</label>
                        {editingQuestion.yesterday_question.map((q, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <Input
                              value={q}
                              onChange={(e) => updateYesterdayQuestion(editingQuestion, index, e.target.value)}
                              placeholder={`Gestern-Frage ${index + 1} eingeben...`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeYesterdayQuestion(editingQuestion, index)}
                            >
                              Entfernen
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addYesterdayQuestion(editingQuestion)}
                        >
                          Gestern-Frage hinzufügen
                        </Button>
                      </div>

                      {/* Heute-Fragen */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Fragen für heute:</label>
                        {editingQuestion.today_questions.map((q, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <Input
                              value={q}
                              onChange={(e) => updateTodayQuestion(editingQuestion, index, e.target.value)}
                              placeholder={`Frage ${index + 1} eingeben...`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeTodayQuestion(editingQuestion, index)}
                            >
                              Entfernen
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addTodayQuestion(editingQuestion)}
                        >
                          Frage hinzufügen
                        </Button>
                      </div>

                      {/* Trainee-Fragen */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Fragen für Trainee:</label>
                        {editingQuestion.trainee_question.map((q, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <Input
                              value={q}
                              onChange={(e) => updateTraineeQuestion(editingQuestion, index, e.target.value)}
                              placeholder={`Trainee-Frage ${index + 1} eingeben...`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeTraineeQuestion(editingQuestion, index)}
                            >
                              Entfernen
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addTraineeQuestion(editingQuestion)}
                        >
                          Trainee-Frage hinzufügen
                        </Button>
                      </div>

                      {/* Speichern/Abbrechen */}
                      <div className="flex gap-2">
                        <Button onClick={() => saveQuestion(editingQuestion)}>
                          Speichern
                        </Button>
                        <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {question ? (
                        <>
                          <div>
                            <h4 className="font-medium text-gray-700">Gestern:</h4>
                            <p className="text-gray-600">{question.yesterday_question}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700">Heute:</h4>
                            <ul className="list-disc list-inside text-gray-600">
                              {question.today_questions.map((q, index) => (
                                <li key={index}>{q}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700">Trainee:</h4>
                            <p className="text-gray-600">{question.trainee_question}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500">Keine Fragen für {weekday.label} definiert</p>
                      )}
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (question) {
                            setEditingQuestion(question);
                          } else {
                            const newQuestion: WeekdayQuestion = {
                              weekday: weekday.value,
                              yesterday_question: '',
                              today_questions: [''],
                              trainee_question: ''
                            };
                            setEditingQuestion(newQuestion);
                          }
                        }}
                      >
                        {question ? 'Bearbeiten' : 'Erstellen'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}