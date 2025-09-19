"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WeekdayQuestion {
  id: string;
  weekday: string;
  question: string;
  type: 'text' | 'number' | 'boolean';
  required: boolean;
  order: number;
}

export default function WeekdayQuestionsAdmin() {
  const [questions, setQuestions] = useState<WeekdayQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<WeekdayQuestion | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<WeekdayQuestion>>({
    weekday: 'monday',
    question: '',
    type: 'text',
    required: true,
    order: 0
  });

  const weekdays = [
    { value: 'monday', label: 'Montag' },
    { value: 'tuesday', label: 'Dienstag' },
    { value: 'wednesday', label: 'Mittwoch' },
    { value: 'thursday', label: 'Donnerstag' },
    { value: 'friday', label: 'Freitag' }
  ];

  const questionTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Zahl' },
    { value: 'boolean', label: 'Ja/Nein' }
  ];

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      // TODO: Implement API endpoint
      setQuestions([]);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveQuestion = async (question: WeekdayQuestion) => {
    try {
      // TODO: Implement API endpoint
      console.log('Saving question:', question);
      await loadQuestions();
      setEditingQuestion(null);
      setNewQuestion({
        weekday: 'monday',
        question: '',
        type: 'text',
        required: true,
        order: 0
      });
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      // TODO: Implement API endpoint
      console.log('Deleting question:', id);
      await loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Lade Fragen...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Weekday Questions Management
        </h1>
        <p className="text-gray-600">
          Verwalte die wochentags-spezifischen Fragen für Berater
        </p>
      </div>

      {/* Add New Question */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Neue Frage hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wochentag
              </label>
              <select
                value={newQuestion.weekday}
                onChange={(e) => setNewQuestion({...newQuestion, weekday: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {weekdays.map(day => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fragetyp
              </label>
              <select
                value={newQuestion.type}
                onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value as any})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {questionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frage
              </label>
              <textarea
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={2}
                placeholder="Geben Sie die Frage ein..."
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newQuestion.required}
                  onChange={(e) => setNewQuestion({...newQuestion, required: e.target.checked})}
                  className="mr-2"
                />
                Erforderlich
              </label>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reihenfolge
                </label>
                <input
                  type="number"
                  value={newQuestion.order}
                  onChange={(e) => setNewQuestion({...newQuestion, order: parseInt(e.target.value)})}
                  className="w-20 p-2 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <Button
              onClick={() => saveQuestion(newQuestion as WeekdayQuestion)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Frage hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="grid gap-4">
        {weekdays.map(day => {
          const dayQuestions = questions.filter(q => q.weekday === day.value);
          return (
            <Card key={day.value}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {day.label}
                  <span className="text-sm font-normal text-gray-500">
                    {dayQuestions.length} Fragen
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dayQuestions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Keine Fragen für {day.label}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dayQuestions
                      .sort((a, b) => a.order - b.order)
                      .map(question => (
                        <div key={question.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{question.question}</div>
                            <div className="text-sm text-gray-500">
                              Typ: {questionTypes.find(t => t.value === question.type)?.label} | 
                              {question.required ? ' Erforderlich' : ' Optional'} | 
                              Reihenfolge: {question.order}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingQuestion(question)}
                            >
                              Bearbeiten
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteQuestion(question.id)}
                              className="text-red-600 hover:text-red-700"
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
    </div>
  );
}
