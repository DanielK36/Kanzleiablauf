"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DailyEntryFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function DailyEntryForm({ onSubmit, initialData }: DailyEntryFormProps) {
  const [formData, setFormData] = useState({
    fa_count: 0,
    eh_count: 0,
    new_appointments: 0,
    tiv_count: 0,
    taa_count: 0,
    recommendations: 0,
    todos: ['', '', '', '', ''],
    focus_area: '',
    help_request: '',
    weekend_positive: '',
    training_diamonds: '',
    saturday_appointments: [],
    tiv_invitations: 0,
    taa_invitations: 0,
    recommendation_effort: '',
    recommendation_expansion: '',
    week_positive: '',
    week_learnings: '',
    saturday_participation: false,
  });

  const [currentDay, setCurrentDay] = useState(0);

  useEffect(() => {
    const today = new Date().getDay();
    setCurrentDay(today);
    
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTodoChange = (index: number, value: string) => {
    const newTodos = [...formData.todos];
    newTodos[index] = value;
    setFormData(prev => ({
      ...prev,
      todos: newTodos
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['focus_area', 'help_request'];
    
    // Add day-specific required fields
    if (currentDay === 1) { // Montag
      requiredFields.push('weekend_positive', 'training_diamonds');
    } else if (currentDay === 3) { // Mittwoch
      requiredFields.push('tiv_invitations', 'taa_invitations');
    } else if (currentDay === 4) { // Donnerstag
      requiredFields.push('recommendation_effort', 'recommendation_expansion');
    } else if (currentDay === 5) { // Freitag
      requiredFields.push('week_positive', 'week_learnings');
    }
    
    const missingFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return !value || (typeof value === 'string' && value.trim() === '') || (typeof value === 'number' && value === 0);
    });
    
    if (missingFields.length > 0) {
      alert(`Bitte fülle alle Pflichtfelder aus: ${missingFields.join(', ')}`);
      return;
    }
    
    const entryData = {
      ...formData,
      entry_date: new Date().toISOString().split('T')[0],
      todos: formData.todos.filter(todo => todo.trim() !== '')
    };
    
    onSubmit(entryData);
  };

  const getDaySpecificFields = () => {
    switch (currentDay) {
      case 1: // Montag
        return (
          <>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Was habe ich am Wochenende arbeitsmäßig Positives erlebt?
                </label>
                <textarea
                  value={formData.weekend_positive}
                  onChange={(e) => handleInputChange('weekend_positive', e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Was waren deine Diamanten vom Samstag?
                </label>
                <textarea
                  value={formData.training_diamonds}
                  onChange={(e) => handleInputChange('training_diamonds', e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={2}
                />
              </div>
            </div>
          </>
        );
        
      case 3: // Mittwoch
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Was ist dein Fokus für heute?
              </label>
              <textarea
                value={formData.focus_area}
                onChange={(e) => handleInputChange('focus_area', e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={2}
                placeholder="Beschreibe deinen heutigen Fokus..."
              />
            </div>
          </div>
        );
        
      case 4: // Donnerstag
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wie machst du dich heute empfehlenswerter?
              </label>
              <textarea
                value={formData.recommendation_effort}
                onChange={(e) => handleInputChange('recommendation_effort', e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wie sorgst du heute dafür, deine Empfehlungsliste zu erweitern?
              </label>
              <textarea
                value={formData.recommendation_expansion}
                onChange={(e) => handleInputChange('recommendation_expansion', e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={2}
              />
            </div>
          </div>
        );
        
      case 5: // Freitag
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Was lief diese Woche gut?
              </label>
              <textarea
                value={formData.week_positive}
                onChange={(e) => handleInputChange('week_positive', e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Was lernst du daraus?
              </label>
              <textarea
                value={formData.week_learnings}
                onChange={(e) => handleInputChange('week_learnings', e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={2}
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="saturday_participation"
                checked={formData.saturday_participation}
                onChange={(e) => handleInputChange('saturday_participation', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="saturday_participation" className="text-sm font-medium text-gray-700">
                Ich nehme am Samstag teil
              </label>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const getDayName = () => {
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return days[currentDay];
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Tageseintrag - {getDayName()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Standard Metriken - Mobile optimized */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Zahlen</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  FA
                </label>
                <input
                  type="number"
                  value={formData.fa_count}
                  onChange={(e) => handleInputChange('fa_count', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  EH
                </label>
                <input
                  type="number"
                  value={formData.eh_count}
                  onChange={(e) => handleInputChange('eh_count', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Neue Termine
                </label>
                <input
                  type="number"
                  value={formData.new_appointments}
                  onChange={(e) => handleInputChange('new_appointments', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  TIV
                </label>
                <input
                  type="number"
                  value={formData.tiv_count}
                  onChange={(e) => handleInputChange('tiv_count', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  TAA
                </label>
                <input
                  type="number"
                  value={formData.taa_count}
                  onChange={(e) => handleInputChange('taa_count', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Empfehlungen
                </label>
                <input
                  type="number"
                  value={formData.recommendations}
                  onChange={(e) => handleInputChange('recommendations', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* ToDos - Compact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ToDos (außerhalb der Beratung)
            </label>
            <div className="space-y-2">
              {formData.todos.map((todo, index) => (
                <input
                  key={index}
                  type="text"
                  value={todo}
                  onChange={(e) => handleTodoChange(index, e.target.value)}
                  placeholder={`ToDo ${index + 1}`}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              ))}
            </div>
          </div>

          {/* Fokus-Bereich */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Worin willst du heute wachsen? <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.focus_area}
              onChange={(e) => handleInputChange('focus_area', e.target.value)}
              className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            >
              <option value="">Bitte wählen...</option>
              <option value="Neukunden">Neukunden</option>
              <option value="neue Berater">Neue Berater</option>
              <option value="mehr Empfehlungen">Mehr Empfehlungen</option>
            </select>
          </div>

          {/* Hilfe-Wunsch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wie kann dir deine Führungskraft heute helfen? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.help_request}
              onChange={(e) => handleInputChange('help_request', e.target.value)}
              className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={2}
              placeholder="Beschreibe, wobei du heute Unterstützung brauchst..."
              required
            />
          </div>

          {/* Wochentag-spezifische Felder */}
          {getDaySpecificFields()}

          {/* Submit Button */}
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm">
            Tageseintrag speichern
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
