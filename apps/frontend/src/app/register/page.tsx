// frontend/src/app/register/page.tsx
import React from "react";
import { Metadata } from 'next';
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: 'Registra tu empresa',
  description: 'Registra tu cuenta para gestionar tu empresa.',
};

// Ajusta este import según tu estructura real
// Ejemplos comunes:
// import MultiStepForm from "@/components/forms/multi-step-form";
// import MultiStepForm from "../components/forms/multi-step-form";
import MultiStepForm from "@/components/forms/multi-step-form";

export default function RegisterPage() {
  return (
    <>
      {/* Create Company Section */}
      <section id="formulario" className="py-24 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold mb-4">
                <BarChart3 className="w-4 h-4" />
                Comienza Hoy
              </div>

              <h2 className="text-4xl font-bold text-dark mb-6">
                Crea tu empresa en Suba&Go
              </h2>

              <p className="text-xl text-gray-600">
                Únete a la plataforma líder y comienza a vender con mejores resultados
                desde el primer día.
              </p>
            </div>

            <div className="bg-soft-white p-8 rounded-3xl border border-gray-100 shadow-lg">
              <MultiStepForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}