import { ArrowUpRight } from "lucide-react";

interface FUIHeroWithJellyProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  className?: string;
}

export default function FUIHeroWithJelly({
  title = "Manage your sales and analytics in one place. looking for",
  subtitle = "Simple is a modern website builder powered by AI that changes how companies create user interfaces together.",
  ctaText = "Buy this template",
  ctaHref = "https://farmui.com/templates/ease",
  onCtaClick,
  className = "",
}: FUIHeroWithJellyProps) {
  return (
    <section className={`relative text-white bg-[linear-gradient(to_bottom,#fff,#000_30%,#000_98%)] dark:bg-[linear-gradient(to_bottom,#000_10%,#000_30%,#000_98%)] overflow-hidden ${className}`}>
      <div className="px-2 mx-auto sm:px-6 md:px-0 max-w-7xl">
        <div className="pt-24 md:pt-36">
          <div className="pb-12 text-center md:pb-16">
            <h1
              className="mb-6 border-y border-none text-4xl sm:text-5xl md:text-6xl max-w-4xl mx-auto font-normal tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-red-200 via-blue-200 to-white p-4 leading-tight"
            >
              {title}
            </h1>
            <div className="relative mx-auto max-w-3xl px-4">
              <p className="mb-8 text-base sm:text-lg text-gray-400 leading-relaxed">
                {subtitle}
              </p>
              <div
                className="absolute left-0 top-0 h-80 w-[90%] opacity-60 overflow-x-hidden bg-[rgb(54,157,253)] bg-opacity-40 blur-[337.4px] pointer-events-none"
                style={{ transform: "rotate(-30deg)" }}
              />
              <div className="relative before:absolute before:inset-0 before:border-y before:border-none before:[border-image:linear-gradient(to_right,transparent,theme(colors.slate.300/.8),transparent)1]">
                <div className="mx-auto z-20 max-w-xs mt-[-20px] mb-[20px] sm:flex sm:justify-center items-center sm:max-w-none gap-5">
                  <a
                    href={ctaHref}
                    onClick={(e) => {
                      if (onCtaClick) {
                        e.preventDefault();
                        onCtaClick();
                      }
                    }}
                    target={ctaHref.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="group inline-flex text-base sm:text-lg gap-x-2 mt-2 backdrop-blur-md text-white justify-center items-center py-3 px-6 w-fit rounded-xl border duration-200 bg-page-gradient border-white/30 font-sans hover:border-zinc-500 hover:bg-white/[0.1] hover:text-white transition-all shadow-[0_0_30px_rgba(54,157,253,0.3)]"
                  >
                    <span>{ctaText}</span>
                    <div className="flex overflow-hidden relative justify-center items-center ml-1 w-5 h-5">
                      <ArrowUpRight className="absolute transition-all duration-500 group-hover:translate-x-4 group-hover:-translate-y-5" />
                      <ArrowUpRight className="absolute transition-all duration-500 -translate-x-4 -translate-y-5 group-hover:translate-x-0 group-hover:translate-y-0" />
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative z-10 px-4">
            <div className="mx-auto max-w-5xl shadow-[0_25px_80px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden border border-white/10">
              <img
                src="https://cdn.21st.dev/assets/mirror/12/12cca5de1e3d775e4aced9e0506d59a456399ae6f38b1d30dd3ffcb4e7d9af68.png"
                className="w-full rounded-3xl bg-transparent object-cover"
                alt="Dashboard Preview"
              />
            </div>
          </div>

          {/* Background Jelly Video */}
          <div className="relative mt-[-100px] overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              src="https://ease-one.vercel.app/bg/something.mp4"
              className="w-full min-w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07050A] via-transparent to-transparent" />
          </div>

          <div className="mx-auto max-w-full h-20 bg-[#07050A]" />
        </div>
      </div>
    </section>
  );
}
