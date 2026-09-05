import { ParallaxComponent } from '@/components/ui/parallax-scrolling';

export default function ParallaxDemo() {
  return (
    <div className="relative w-full min-h-screen bg-[#07050A]">
      <ParallaxComponent />
      <div className="osmo-credits">
        <p className="osmo-credits__p">
          Resource by{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.osmo.supply/"
            className="osmo-credits__p-a"
          >
            Osmo
          </a>
        </p>
      </div>
    </div>
  );
}
