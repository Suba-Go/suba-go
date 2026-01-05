import React from 'react';
import { Check, Circle } from 'lucide-react';

interface PasswordChecklistProps {
  password?: string;
}

export function PasswordChecklist({ password = '' }: PasswordChecklistProps) {
  const requirements = [
    {
      label: 'Al menos 8 caracteres',
      test: (pwd: string) => pwd.length >= 8,
    },
    {
      label: 'Al menos una mayúscula',
      test: (pwd: string) => /[A-Z]/.test(pwd),
    },
    {
      label: 'Al menos una minúscula',
      test: (pwd: string) => /[a-z]/.test(pwd),
    },
  ];

  return (
    <div className="mt-2 space-y-1">
      {requirements.map((req, index) => {
        const isMet = req.test(password);
        return (
          <div
            key={index}
            className={`flex items-center text-sm ${
              isMet ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            {isMet ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Circle className="w-4 h-4 mr-2" />
            )}
            <span>{req.label}</span>
          </div>
        );
      })}
    </div>
  );
}
