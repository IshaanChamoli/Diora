"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LogIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-[rgb(230,223,253)] via-[rgb(230,223,253)] to-white relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="absolute top-6 left-6 right-6 z-10">
        <div className="flex justify-between items-center">
          {/* Logo on the left */}
          <div>
            <Link href="/">
              <Image
                src="/logo-with-text.png"
                alt="Diora Logo"
                width={120}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>
          </div>
          
          {/* Buttons on the right */}
          <div className="flex gap-3">
            <Link href="/login" className="px-5 py-2 bg-[rgb(75,46,182)] text-white rounded-2xl font-medium hover:bg-[rgb(65,36,172)] transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="px-5 py-2 bg-[rgb(230,223,253)] text-[rgb(75,46,182)] border border-[rgb(75,46,182)] rounded-2xl font-medium hover:bg-[rgb(245,243,255)] transition-colors">
              Sign up for free
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main content area - centered */}
      <div className="flex items-center justify-center min-h-screen">
        {/* Log-in modal */}
        <div className="bg-gradient-to-t from-[rgb(230,223,253)] via-[rgb(230,223,253)] to-white rounded-2xl shadow-2xl relative p-8 max-w-md w-full mx-4">
          {/* Close button */}
          <Link href="/" className="absolute top-6 right-6 text-[rgb(75,46,182)] hover:text-[rgb(65,36,172)] transition-colors">
            <X className="w-5 h-5" />
          </Link>
          
          {/* Modal content */}
          <div className="flex flex-col items-center text-center pt-8 pb-6">
            {/* Main heading */}
            <h1 className="font-primary font-semibold text-2xl mb-2 text-black">
              Welcome Back
            </h1>
            
            {/* Subtitle */}
            <p className="font-secondary text-sm mb-18 text-black">
              Sign in to your account
            </p>
            
            {/* Error message */}
            {error && (
              <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-secondary">{error}</p>
              </div>
            )}
            
            {/* Email input field */}
            <div className="w-4/5 mb-6">
              <input
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                autoFocus
                autoComplete="off"
                className="w-full px-4 py-3 border border-gray-600 rounded-xl font-secondary text-sm placeholder-gray-400 focus:outline-none focus:border-[rgb(75,46,182)] transition-colors"
              />
            </div>
            
            {/* Password input field */}
            <div className="w-4/5 mb-6 relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                autoComplete="off"
                className="w-full px-4 py-3 pr-12 border border-gray-600 rounded-xl font-secondary text-sm placeholder-gray-400 focus:outline-none focus:border-[rgb(75,46,182)] transition-colors"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Continue button */}
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-8 py-3 bg-[rgb(75,46,182)] text-white rounded-xl font-secondary font-medium hover:bg-[rgb(65,36,172)] transition-colors mb-18 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
            
            {/* Footer links */}
            <div className="space-y-4">
              <p className="font-secondary text-sm text-black">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-[rgb(75,46,182)] hover:text-[rgb(65,36,172)] transition-colors">
                  Sign up
                </Link>
              </p>
              
              <div className="font-secondary text-xs text-[rgb(75,46,182)]">
                <Link href="/terms-of-use" className="hover:text-[rgb(65,36,172)] transition-colors underline">
                  Terms of use
                </Link>
                <span className="mx-2 text-gray-400">|</span>
                <Link href="/privacy-policy" className="hover:text-[rgb(65,36,172)] transition-colors underline">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 