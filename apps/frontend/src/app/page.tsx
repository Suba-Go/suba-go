import WhatsAppButton from '@/components/landing/whatsapp-button';
import FlyingObjects from '@/components/landing/flying-objects';
import LandingNavigator from '@/components/landing/landing-navigator';
import { LandingNavProvider } from '@/contexts/landing-nav-context';

export default function HomePage() {
  return (
    <LandingNavProvider>
      <div className="landing-scanlines bg-dark text-white">
        <FlyingObjects />
        <LandingNavigator />
        <WhatsAppButton />
      </div>
    </LandingNavProvider>
  );
}
