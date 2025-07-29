import Image from "next/image";

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
            <button className="px-5 py-2 bg-[rgb(230,223,253)] text-[rgb(75,46,182)] border border-[rgb(75,46,182)] rounded-2xl font-medium hover:bg-[rgb(245,243,255)] transition-colors">
              Sign up for free
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content area */}
      <div className="p-8">
        {/* Your homepage content will go here */}
      </div>
    </div>
  );
}
