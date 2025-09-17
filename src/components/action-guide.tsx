"use client";
import { useState } from 'react';
import { getActionGuides } from '@/lib/action-guides';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

interface ActionGuideProps {
  weekday: string;
  role: 'leader' | 'advisor';
  onComplete: () => void;
}

export const ActionGuideComponent = ({ weekday, role, onComplete }: ActionGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const guides = getActionGuides(weekday, role);

  if (!guides || !guides.steps || guides.steps.length === 0) {
    return <div className="action-guide">No action guides available for today.</div>;
  }

  const handleNextStep = () => {
    if (currentStep < guides.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const progressValue = ((currentStep + 1) / guides.steps.length) * 100;

  return (
    <div className="action-guide bg-gray-800 text-white rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4">{guides.focus} - Schritt {currentStep + 1} von {guides.steps.length}</h3>
      <Progress value={progressValue} className="mb-4 h-2" />

      <div className="current-step mb-6">
        <h4 className="text-lg font-semibold mb-2">Jetzt tun:</h4>
        <p className="text-gray-200 mb-4">{guides.steps[currentStep]}</p>

        {guides.scripts && guides.scripts[currentStep] && (
          <div className="script-box bg-gray-700 rounded-md p-4 italic text-gray-300">
            <h5 className="font-medium mb-1">Gesprächsscript:</h5>
            <p>&ldquo;{guides.scripts[currentStep]}&rdquo;</p>
          </div>
        )}

        <div className="step-actions mt-6 flex space-x-4">
          <Button onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            {currentStep < guides.steps.length - 1 ? 'Erledigt - Nächster Schritt' : 'Alle Schritte erledigt'}
          </Button>
          <Button variant="outline" className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">
            Hilfe benötigt
          </Button>
        </div>
      </div>
    </div>
  );
};
