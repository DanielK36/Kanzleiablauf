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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    name: '', // Will be firstName + lastName
    teamName: '',
    role: 'sub_leader',
    monthlyTargets: {
      fa_target: 0,
      eh_target: 0,
      new_appointments_target: 0,
      recommendations_target: 0,
      tiv_invitations_target: 0,
      taa_invitations_target: 0,
      tgs_registrations_target: 0,
      bav_checks_target: 0
    }
  });

  // Check if this is a monthly update
  useEffect(() => {
    if (searchParams.get('monthly') === 'true') {
      setIsMonthlyUpdate(true);
      setStep(2); // Skip to step 2 (targets) for monthly updates
      loadCurrentGoals();
    }
  }, [searchParams]);

  const loadCurrentGoals = async () => {
    try {
      const response = await fetch('/api/monthly-goals');
      if (response.ok) {
        const data = await response.json();
        if (data.currentGoals) {
          // Convert daily targets back to monthly for display
          const currentGoals = data.currentGoals;
          setFormData(prev => ({
            ...prev,
            monthlyTargets: {
              fa_target: (currentGoals.fa_daily || 5) * 22,
              eh_target: (currentGoals.eh_daily || 3) * 22,
              new_appointments_target: (currentGoals.new_appointments_daily || 3) * 22,
              recommendations_target: (currentGoals.recommendations_daily || 2) * 22,
              tiv_invitations_target: (currentGoals.tiv_invitations_daily || 1) * 22,
              taa_invitations_target: (currentGoals.taa_invitations_daily || 1) * 22,
              tgs_registrations_target: (currentGoals.tgs_registrations_daily || 1) * 22,
              bav_checks_target: (currentGoals.bav_checks_daily || 2) * 22
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error loading current goals:', error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => {
        const newData = {
          ...prev,
          [field]: value
        };
        
        // Automatically update the full name when firstName or lastName changes
        if (field === 'firstName' || field === 'lastName') {
          newData.name = `${newData.firstName} ${newData.lastName}`.trim();
        }
        
        return newData;
      });
    }
  };

  const handleNext = async () => {
    if ((step < 3 && !isMonthlyUpdate) || (isMonthlyUpdate && step < 2)) {
      setStep(step + 1);
    } else {
      // Save data to database and redirect to dashboard
      setLoading(true);
      try {
        if (isMonthlyUpdate) {
          // Monthly update - only save targets
          const response = await fetch('/api/monthly-goals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              monthlyTargets: formData.monthlyTargets
            }),
          });

          if (response.ok) {
            console.log('Monthly goals updated successfully');
            router.push('/dashboard');
          } else {
            console.error('Failed to save monthly goals');
            router.push('/dashboard');
          }
        } else {
          // Full onboarding
          const personalTargets = {
            fa_daily: Math.round(formData.monthlyTargets.fa_target / 22), // Convert monthly to daily
            eh_daily: Math.round(formData.monthlyTargets.eh_target / 22),
            new_appointments_daily: Math.round(formData.monthlyTargets.new_appointments_target / 22),
            recommendations_daily: Math.round(formData.monthlyTargets.recommendations_target / 22),
            tiv_invitations_daily: Math.round(formData.monthlyTargets.tiv_invitations_target / 22),
            taa_invitations_daily: Math.round(formData.monthlyTargets.taa_invitations_target / 22),
            tgs_registrations_daily: Math.round(formData.monthlyTargets.tgs_registrations_target / 22),
            bav_checks_daily: Math.round(formData.monthlyTargets.bav_checks_target / 22)
          };

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
              personal_targets: personalTargets,
              monthly_targets: formData.monthlyTargets,
              email: user?.emailAddresses[0]?.emailAddress || 'user@example.com'
            }),
          });

          const responseData = await response.json();
          console.log('Onboarding response:', responseData);

          if (response.ok) {
            console.log('Onboarding data saved successfully');
            router.push('/dashboard');
          } else {
            console.error('Failed to save onboarding data:', responseData);
            alert(`Fehler beim Speichern: ${responseData.error} - ${responseData.details || ''}`);
          }
        }
      } catch (error) {
        console.error('Error saving data:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
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
          <option value="sub_leader">Führungskraft</option>
          <option value="trainee">Berater in Ausbildung</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Jeder Berater ist automatisch auch Führungskraft. Nur für Auszubildende wähle "Berater in Ausbildung".
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Monatliche Zielzahlen festlegen
        </h3>
        <p className="text-sm text-gray-600">
          Setze deine monatlichen Ziele für die wichtigsten Kennzahlen
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            FA (Finanzanlagen) - Monatsziel
          </label>
          <input
            type="number"
            value={formData.monthlyTargets.fa_target}
            onChange={(e) => handleInputChange('monthlyTargets.fa_target', parseInt(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            EH (Einheiten) - Monatsziel
          </label>
          <input
            type="number"
            value={formData.monthlyTargets.eh_target}
            onChange={(e) => handleInputChange('monthlyTargets.eh_target', parseInt(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Neue Termine - Monatsziel
          </label>
          <input
            type="number"
            value={formData.monthlyTargets.new_appointments_target}
            onChange={(e) => handleInputChange('monthlyTargets.new_appointments_target', parseInt(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Empfehlungen - Monatsziel
          </label>
          <input
            type="number"
            value={formData.monthlyTargets.recommendations_target}
            onChange={(e) => handleInputChange('monthlyTargets.recommendations_target', parseInt(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            TIV-Einladungen - Monatsziel
          </label>
          <input
            type="number"
            value={formData.monthlyTargets.tiv_invitations_target}
            onChange={(e) => handleInputChange('monthlyTargets.tiv_invitations_target', parseInt(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            TAA-Einladungen - Monatsziel
          </label>
          <input
            type="number"
            value={formData.monthlyTargets.taa_invitations_target}
            onChange={(e) => handleInputChange('monthlyTargets.taa_invitations_target', parseInt(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            TGS-Anmeldungen - Monatsziel
          </label>
          <input
            type="number"
            value={formData.monthlyTargets.tgs_registrations_target}
            onChange={(e) => handleInputChange('monthlyTargets.tgs_registrations_target', parseInt(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            bAV-Checks - Monatsziel
          </label>
          <input
            type="number"
            value={formData.monthlyTargets.bav_checks_target}
            onChange={(e) => handleInputChange('monthlyTargets.bav_checks_target', parseInt(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Zusammenfassung
        </h3>
        <p className="text-sm text-gray-600">
          Überprüfe deine Eingaben bevor du fortfährst
        </p>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-4">Persönliche Daten</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <span className="text-sm text-gray-600">Name:</span>
            <p className="font-medium">{formData.firstName} {formData.lastName}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Team-Name:</span>
            <p className="font-medium">{formData.teamName}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Rolle:</span>
            <p className="font-medium">
              {formData.role === 'sub_leader' ? 'Führungskraft' : 
               formData.role === 'trainee' ? 'Berater in Ausbildung' : 
               formData.role}
            </p>
          </div>
        </div>
        
        <h4 className="font-medium text-gray-900 mb-4">Monatliche Zielzahlen</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-lg font-bold text-blue-600">{formData.monthlyTargets.fa_target}</div>
            <div className="text-xs text-gray-600">FA</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-lg font-bold text-blue-600">{formData.monthlyTargets.eh_target}</div>
            <div className="text-xs text-gray-600">EH</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-lg font-bold text-blue-600">{formData.monthlyTargets.new_appointments_target}</div>
            <div className="text-xs text-gray-600">Termine</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-lg font-bold text-blue-600">{formData.monthlyTargets.recommendations_target}</div>
            <div className="text-xs text-gray-600">Empfehlungen</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-lg font-bold text-blue-600">{formData.monthlyTargets.tiv_invitations_target}</div>
            <div className="text-xs text-gray-600">TIV</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-lg font-bold text-blue-600">{formData.monthlyTargets.taa_invitations_target}</div>
            <div className="text-xs text-gray-600">TAA</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-lg font-bold text-blue-600">{formData.monthlyTargets.tgs_registrations_target}</div>
            <div className="text-xs text-gray-600">TGS</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-lg font-bold text-blue-600">{formData.monthlyTargets.bav_checks_target}</div>
            <div className="text-xs text-gray-600">bAV</div>
          </div>
        </div>
      </div>
    </div>
  );

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Persönliche Daten";
      case 2: return "Monatliche Zielzahlen";
      case 3: return "Zusammenfassung";
      default: return "";
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Bitte melden Sie sich an
            </h1>
            <p className="text-gray-600">
              Sie müssen sich anmelden, um das Onboarding zu verwenden.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Willkommen beim Leadership-Enablement-System
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Schritt {step} von 3: {getStepTitle()}
            </p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </CardHeader>
          
          <CardContent>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            
            <div className="flex justify-between mt-8">
              <Button
                onClick={handleBack}
                disabled={step === 1}
                variant="outline"
                className="px-6 py-2"
              >
                Zurück
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 disabled:opacity-50"
              >
                {loading ? 'Speichern...' : (step === 3 ? 'Fertigstellen' : 'Weiter')}
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
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
