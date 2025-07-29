import Image from "next/image";
import { X } from "lucide-react";

export default function SignUp() {
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
      
      {/* Main content area - centered */}
      <div className="flex items-center justify-center min-h-screen">
        {/* Sign-up modal */}
        <div className="bg-gradient-to-t from-[rgb(230,223,253)] via-[rgb(230,223,253)] to-white rounded-2xl shadow-2xl relative p-8 max-w-md w-full mx-4">
          {/* Close button */}
          <a href="/" className="absolute top-6 right-6 text-[rgb(75,46,182)] hover:text-[rgb(65,36,172)] transition-colors">
            <X className="w-5 h-5" />
          </a>
          
          {/* Modal content */}
          <div className="flex flex-col items-center text-center pt-8 pb-6">
            {/* Main heading */}
            <h1 className="font-primary font-semibold text-2xl mb-2 text-black">
              Create an Account
            </h1>
            
            {/* Subtitle */}
            <p className="font-secondary text-sm mb-18 text-black">
              Sign up using your work email
            </p>
            
            {/* Email input field */}
            <div className="w-4/5 mb-6">
              <input
                type="email"
                placeholder="Email address"
                autoFocus
                className="w-full px-4 py-3 border border-gray-600 rounded-xl font-secondary text-sm placeholder-gray-400 focus:outline-none focus:border-[rgb(75,46,182)] transition-colors"
              />
            </div>
            
            {/* Continue button */}
            <button className="px-8 py-3 bg-[rgb(75,46,182)] text-white rounded-xl font-secondary font-medium hover:bg-[rgb(65,36,172)] transition-colors mb-18">
              Continue
            </button>
            
            {/* Footer links */}
            <div className="space-y-4">
              <p className="font-secondary text-sm text-black">
                Already have an account?{" "}
                <a href="/log-in" className="text-[rgb(75,46,182)] hover:text-[rgb(65,36,172)] transition-colors">
                  Log in
                </a>
              </p>
              
              <div className="font-secondary text-xs text-[rgb(75,46,182)]">
                <a href="/terms-of-use" className="hover:text-[rgb(65,36,172)] transition-colors underline">
                  Terms of use
                </a>
                <span className="mx-2 text-gray-400">|</span>
                <a href="/privacy-policy" className="hover:text-[rgb(65,36,172)] transition-colors underline">
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 