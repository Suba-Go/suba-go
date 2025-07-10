import MultiStepForm from '@/components/forms/multi-step-form';

export default function Home() {
  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark mb-4">Crea tu empresa</h1>
          <p className="text-gray-600">
            Completa el formulario para configurar tu nueva empresa
          </p>
        </div>
        <MultiStepForm />
      </div>
    </main>
  );
}
