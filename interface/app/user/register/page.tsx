"use client";

import { useState, useCallback } from 'react';
import { fetchRegister } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

export default function Register() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('designer');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      if (password !== confirmPassword) {
        toast({
          title: "Registration Failed",
          description: "Passwords do not match",
          type: "error"
        });
        return;
      }

      const result = await fetchRegister(email, name, password, userType);
      
      if (result.success) {
        toast({
          title: "Registration Successful",
          description: "Please login with your account"
        });
        router.push('/user/login');
      } else {
        toast({
          title: "Registration Failed",
          description: "Please check your information and try again",
          type: "error"
        });
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "An error occurred, please try again later",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, name, password, confirmPassword, userType, router, toast]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col md:flex-row min-h-screen"
    >
      {/* Left Section - Design */}
      <div className="relative w-full md:w-1/2 bg-gradient-to-b from-blue-600 to-emerald-700 p-4 md:p-8 flex items-center justify-center text-white min-h-[30vh] md:min-h-screen">
        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4 md:space-y-6">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
            Start Your Innovation Journey
          </h2>
          <p className="text-base md:text-lg text-blue-50 max-w-xl mx-auto px-4">
            Begin here to transform academic wisdom into innovative breakthroughs. Your journey from research to innovation starts here.
          </p>
        </div>
        <div 
          className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-20"
          style={{
            animation: "gradient 15s ease infinite",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </div>

      {/* Right Section - Sign Up Form */}
      <div className="w-full md:w-1/2 bg-primary p-4 md:p-8 flex items-center justify-center min-h-[70vh] md:min-h-screen">
        <div className="max-w-md w-full">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Create Account</h1>
              <p className="text-text-secondary">Enter your information to get started</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-text-primary">Username</Label>
                <Input
                  id="name"
                  placeholder="Enter your username"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-secondary text-text-primary placeholder:text-text-placeholder border-border-secondary focus:border-border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-text-primary">Email</Label>
                <Input
                  id="email"
                  placeholder="Enter your email"
                  type="text"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-secondary text-text-primary placeholder:text-text-placeholder border-border-secondary focus:border-border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-text-primary">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-secondary text-text-primary placeholder:text-text-placeholder border-border-secondary focus:border-border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-text-primary">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-secondary text-text-primary placeholder:text-text-placeholder border-border-secondary focus:border-border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-text-primary">User Type</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={userType === "designer" ? "default" : "outline"}
                    className={userType === "designer" 
                      ? "bg-secondary text-text-primary hover:bg-border-secondary" 
                      : "border-border-secondary text-text-primary hover:bg-secondary"}
                    onClick={() => setUserType("designer")}
                    disabled={isLoading}
                  >
                    Designer
                  </Button>
                  <Button
                    type="button"
                    variant={userType === "researcher" ? "default" : "outline"}
                    className={userType === "researcher" 
                      ? "bg-secondary text-text-primary hover:bg-border-secondary" 
                      : "border-border-secondary text-text-primary hover:bg-secondary"}
                    onClick={() => setUserType("researcher")}
                    disabled={isLoading}
                  >
                    Researcher
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox id="terms" required className="border-border-secondary mt-1" />
                <label
                  htmlFor="terms"
                  className="text-sm text-text-secondary leading-relaxed"
                >
                  I agree to the{" "}
                  <Link href="#" className="text-text-link hover:text-text-linkHover">
                    Terms of Service
                  </Link>
                  {" "}and{" "}
                  <Link href="#" className="text-text-link hover:text-text-linkHover">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button 
                className="w-full bg-secondary hover:bg-border-secondary text-text-primary" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-secondary" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-primary text-text-secondary">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                disabled={isLoading}
                className="border-border-secondary text-text-primary hover:bg-secondary"
              >
                Google
              </Button>
              <Button 
                variant="outline" 
                disabled={isLoading}
                className="border-border-secondary text-text-primary hover:bg-secondary"
              >
                GitHub
              </Button>
            </div>

            <div className="text-center text-sm text-text-secondary">
              Already have an account?{" "}
              <Link href="/user/login" className="text-text-link hover:text-text-linkHover">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
