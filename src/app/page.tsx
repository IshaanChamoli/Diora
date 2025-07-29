import Image from "next/image";

export default function Home() {
  return (
    <div className="p-8">
      {/* Primary font (Manrope) - for headings */}
      <h1 className="font-primary font-semibold text-4xl mb-4">
        Welcome to Diora
      </h1>
      
      {/* Secondary font (Inter) - for body text */}
      <p className="font-secondary font-light text-lg">
        Your Next.js application is ready to build with our design language fonts!
      </p>
      
      <div className="mt-8 space-y-4">
        <h2 className="font-primary font-semibold text-2xl">
          Design Language Fonts
        </h2>
        <p className="font-secondary font-light">
          This text uses Inter (secondary font) with light weight (200) for body text
        </p>
        <p className="font-secondary font-semibold">
          This text uses Inter (secondary font) with semibold weight (600) for emphasis
        </p>
        <p className="font-primary font-light">
          This text uses Manrope (primary font) with light weight (200) for subtle headings
        </p>
        <p className="font-primary font-semibold">
          This text uses Manrope (primary font) with semibold weight (600) for main headings
        </p>
      </div>
    </div>
  );
}
