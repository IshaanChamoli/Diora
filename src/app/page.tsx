import Image from "next/image";
import { AudioLines } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Header with logo and buttons - using absolute positioning for perfect spacing */}
      <header className="absolute top-6 left-6 right-6 z-10">
        <div className="flex justify-between items-center">
          {/* Logo on the left */}
          <div>
            <Image
              src="/logo-with-text.png"
              alt="Diora Logo"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </div>
          
          {/* Buttons on the right */}
          <div className="flex gap-3">
            <button className="px-5 py-2 bg-[rgb(75,46,182)] text-white rounded-2xl font-medium hover:bg-[rgb(65,36,172)] transition-colors">
              Log in
            </button>
            <a href="/sign-up" className="px-5 py-2 bg-[rgb(230,223,253)] text-[rgb(75,46,182)] border border-[rgb(75,46,182)] rounded-2xl font-medium hover:bg-[rgb(245,243,255)] transition-colors">
              Sign up for free
            </a>
          </div>
        </div>
      </header>
      
      {/* Main content area - centered */}
      <div className="flex items-center justify-center min-h-screen">
        {/* Centered content div */}
        <div className="flex flex-col items-center text-center">
          {/* Central circular logo */}
          <div className="mb-8">
            <Image
              src="/logo.gif"
              alt="Diora Central Logo"
              width={200}
              height={200}
              className="w-48 h-48"
              priority
            />
          </div>
          
          {/* Main heading */}
          <h1 className="font-primary font-semibold text-4xl mb-4 text-black">
            The AI-Powered Expert Network
          </h1>
          
          {/* Tagline */}
          <p className="font-primary font-light text-xl mb-8 text-black">
            Insights delivered at the speed of thought.
          </p>
          
          {/* Call to action button */}
          <button className="w-[160px] h-[40px] bg-[rgb(75,46,182)] text-white rounded-xl font-primary font-light text-[18px] flex items-center justify-center gap-[6px] hover:bg-[rgb(65,36,172)] transition-colors">
            <AudioLines className="w-3.5 h-3.5" />
            Start now
          </button>
        </div>
      </div>
    </div>
  );
}
