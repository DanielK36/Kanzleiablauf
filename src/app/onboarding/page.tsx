"use client";
import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isMonthlyUpdate, setIsMonthlyUpdate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    name: '', // Will be firstName + lastName
    teamName: '',
    role: 'führungskraft',
    parentLeaderId: ''
  });
  const [availableLeaders, setAvailableLeaders] = useState([]);

  // Load available leaders for hierarchy selection
  useEffect(() => {
    const loadAvailableLeaders = async () => {
      try {
        const response = await fetch('/api/users/leaders');
        if (response.ok) {
          const leaders = await response.json();
          setAvailableLeaders(leaders.data || []);
        }
      } catch (error) {
        console.error('Error loading leaders:', error);
      }
    };
    
    if (isLoaded) {
      loadAvailableLeaders();
    }
  }, [isLoaded]);

  // Check if this is a monthly update or if team already exists
  useEffect(() => {
    const checkTeamExists = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const userData = await response.json();
          // If user exists and has a team, skip to summary
          if (userData && userData.team_name) {
            setIsMonthlyUpdate(true);
            setStep(2); // Skip to step 2 (summary) if team already exists
            loadCurrentData();
            return;
          }
          // If user is admin, skip onboarding completely
          if (userData && userData.role === 'admin') {
            router.push('/simple-kanzleiablauf-team');
            return;
          }
        }
      } catch (error) {
        console.log('No existing user data found');
      }
      
      // Check URL parameter for monthly update
      if (searchParams.get('monthly') === 'true') {
        setIsMonthlyUpdate(true);
        setStep(2); // Skip to step 2 (summary) for monthly updates
        loadCurrentData();
      }
    };
    
    checkTeamExists();
  }, [searchParams, router]);

  const loadCurrentData = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const userData = await response.json();
        setFormData(prev => ({
          ...prev,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          name: userData.name || '',
          teamName: userData.team_name || '',
          role: userData.role || 'berater'
        }));
      }
    } catch (error) {
      console.error('Error loading current data:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Update name when firstName or lastName changes
      name: field === 'firstName' ? `${value} ${prev.lastName}`.trim() :
            field === 'lastName' ? `${prev.firstName} ${value}`.trim() :
            prev.name
    }));
  };

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Final step - save data and redirect
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          name: formData.name,
          team_name: formData.teamName,
          role: formData.role,
          parent_leader_id: formData.parentLeaderId || null
        }),
      });

      if (response.ok) {
        setSuccess(true);
        // Kurze Verzögerung für bessere UX
        setTimeout(() => {
          router.push('/simple-kanzleiablauf-team');
        }, 1000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Fehler beim Speichern der Daten. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      setError('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vorname
        </label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ihr Vorname"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nachname
        </label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => handleInputChange('lastName', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ihr Nachname"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Team
        </label>
        <select
          value={formData.teamName}
          onChange={(e) => handleInputChange('teamName', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Team auswählen</option>
          <option value="Goalgetter">Goalgetter</option>
          <option value="Proud">Proud</option>
          <option value="Eagles">Eagles</option>
          <option value="Visionäre">Visionäre</option>
          <option value="Hurricane">Hurricane</option>
          <option value="Alpha">Alpha</option>
          <option value="Straw Hats">Straw Hats</option>
          <option value="Eys Breaker">Eys Breaker</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rolle
        </label>
        <select
          value={formData.role}
          onChange={(e) => handleInputChange('role', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="führungskraft">Führungskraft</option>
          <option value="trainee">Trainee (in Ausbildung)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Alle sind Führungskräfte und können Untergebene haben. Wähle "Trainee" nur für Auszubildende.
        </p>
      </div>
      
      {/* Direkte Führungskraft Auswahl - für alle (außer Admin) */}
      {formData.role !== 'admin' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Direkte Führungskraft
          </label>
          <select
            value={formData.parentLeaderId}
            onChange={(e) => handleInputChange('parentLeaderId', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Führungskraft auswählen</option>
            {availableLeaders.map((leader: any) => (
              <option key={leader.id} value={leader.id}>
                {leader.name} ({leader.team_name})
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Wählen Sie Ihre direkte Führungskraft aus. Diese bestimmt, wessen Zahlen Sie sehen werden. Als Führungskraft können Sie später auch selbst Untergebene haben.
          </p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Zusammenfassung
        </h3>
        <p className="text-sm text-gray-600">
          Bitte überprüfe deine Angaben vor dem Abschluss
        </p>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <div className="flex justify-between">
          <span className="font-medium">Name:</span>
          <span>{formData.name || `${formData.firstName} ${formData.lastName}`}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Team:</span>
          <span>{formData.teamName}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Rolle:</span>
          <span className="capitalize">{formData.role}</span>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">🎯 Nächste Schritte:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Gehe zum Dashboard und setze deine persönlichen Ziele</li>
          <li>• Nutze die "Team-Ziele" Funktion für Team-Monatsziele</li>
          <li>• Beginne mit deinen täglichen Einträgen</li>
        </ul>
      </div>
    </div>
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {isMonthlyUpdate ? 'Profil aktualisieren' : 'Willkommen!'}
            </CardTitle>
            <p className="text-center text-gray-600">
              {isMonthlyUpdate 
                ? 'Aktualisiere deine persönlichen Informationen'
                : 'Lass uns dein Profil einrichten'
              }
            </p>
          </CardHeader>
          <CardContent>
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Persönliche Daten</span>
                <span>Zusammenfassung</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">Daten erfolgreich gespeichert! Weiterleitung...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step content */}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => router.push('/simple-kanzleiablauf-team')}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleNext}
                disabled={loading || success || (step === 1 && (!formData.firstName || !formData.lastName || !formData.teamName))}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Speichere...
                  </div>
                ) : success ? 'Erfolgreich!' : step === 2 ? 'Abschließen' : 'Weiter'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Onboarding...</p>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}