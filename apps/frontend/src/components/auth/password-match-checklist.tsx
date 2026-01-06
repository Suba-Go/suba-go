import React from 'react';
import { Check, Circle } from 'lucide-react';

interface PasswordMatchChecklistProps {
  password?: string;
  confirmPassword?: string;
}

export function PasswordMatchChecklist({ 
  password = '', 
  confirmPassword = '' 
}: PasswordMatchChecklistProps) {
  const isMatch = password && confirmPassword && password === confirmPassword;

  return (
    <div className="mt-2 space-y-1">
      <div
        className={`flex items-center text-sm ${
          isMatch ? 'text-green-600' : 'text-gray-500'
        }`}
      >
        {isMatch ? (
          <Check className="w-4 h-4 mr-2" />
        ) : (
          <Circle className="w-4 h-4 mr-2" />
        )}
        <span>Las contraseñas coinciden</span>
      </div>
    </div>
  );
}

