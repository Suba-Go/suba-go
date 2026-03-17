import WhatsAppButton from '@/components/landing/whatsapp-button';
import FlyingObjects from '@/components/landing/flying-objects';
import LandingNavigator from '@/components/landing/landing-navigator';

export default function HomePage() {
  return (
    <div className="landing-scanlines bg-dark text-white">
      <FlyingObjects />
      <LandingNavigator />
      <WhatsAppButton />
    </div>
  );
}