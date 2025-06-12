"use client"

import { useState } from "react"
import {
  Menu,
  BookOpen,
  Video,
  Zap,
  Map,
  Target,
  Code,
  Folder,
  Calendar,
  Globe,
  TrendingUp,
  Briefcase,
  MessageCircle,
  Award,
  Users,
  Check,
  X,
  ArrowRight,
  Play,
  Star,
} from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { HeroVisual } from "@/components/hero-visual"
import { CompanyLogos } from "@/components/company-logos"

const StarIcon = () => <div className="w-3 h-3 bg-[#97C3CC] dark:bg-[#0EA5E9] transform rotate-45 rounded-sm"></div>

export default function MasteringbackendLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0F1C] transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 dark:bg-[#0A0F1C]/90 backdrop-blur-md border-b border-[#97C3CC]/20 dark:border-[#475569]/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BrandLogo size="md" showText={true} variant="default" />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#learn"
                className="text-[#0E1F33]/70 hover:text-[#0E1F33] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors"
              >
                Learn
              </a>
              <a
                href="#build"
                className="text-[#0E1F33]/70 hover:text-[#0E1F33] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors"
              >
                Build
              </a>
              <a
                href="#grow"
                className="text-[#0E1F33]/70 hover:text-[#0E1F33] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors"
              >
                Grow
              </a>
              <a
                href="/blog"
                className="text-[#0E1F33]/70 hover:text-[#0E1F33] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors"
              >
                Blog
              </a>
              <a
                href="#community"
                className="text-[#0E1F33]/70 hover:text-[#0E1F33] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors"
              >
                Community
              </a>
              <ThemeToggle />
              <a
                href="/auth/login"
                className="text-[#0E1F33]/70 hover:text-[#0E1F33] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors px-4 py-2"
              >
                Login
              </a>
              <a
                href="/auth/register"
                className="bg-[#0E1F33] dark:bg-[#0EA5E9] text-white px-6 py-2 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-all"
              >
                Get Started
              </a>
            </div>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="w-6 h-6 text-[#0E1F33] dark:text-[#F1F5F9]" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-[#0A0F1C]/95 backdrop-blur-md border-t border-[#97C3CC]/20 dark:border-[#475569]/20">
            <div className="px-4 py-6 space-y-4">
              <a
                href="#learn"
                className="block text-[#0E1F33]/70 hover:text-[#0E1F33] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Learn
              </a>
              <a
                href="#build"
                className="block text-[#0E1F33]/70 hover:text-[#0E1F33] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Build
              </a>
              <a
                href="#grow"
                className="block text-[#0E1F33]/70 hover:text-[#0E1F33] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Grow
              </a>
              <a
                href="/blog"
                className="block text-[#0E1F33]/70 hover:text-[#0E1F33] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </a>
              <a
                href="#community"
                className="block text-[#0E1F33]/70 hover:text-[#0E1F33] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Community
              </a>
              <div className="pt-4 border-t border-[#97C3CC]/20 dark:border-[#475569]/20">
                <a
                  href="/auth/login"
                  className="block text-[#0E1F33]/70 hover:text-[#0E1F33] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors py-2 mb-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </a>
                <a
                  href="/auth/register"
                  className="block bg-[#0E1F33] dark:bg-[#0EA5E9] text-white px-6 py-3 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-all text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Beautiful Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#97C3CC]/20 via-[#E8F4F8] to-white dark:from-[#1E293B]/70 dark:via-[#0F172A]/90 dark:to-[#0A0F1C] z-0"></div>

        {/* Animated Background Shapes */}
        <div className="absolute top-0 left-0 right-0 bottom-0 z-0 overflow-hidden">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/10 rounded-full blur-3xl"></div>
          <div className="absolute top-[30%] right-[10%] w-72 h-72 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[10%] left-[20%] w-80 h-80 bg-[#0E1F33]/5 dark:bg-[#0EA5E9]/5 rounded-full blur-3xl"></div>

          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMxLjIgMCAyLjEuOSAyLjEgMi4xdjE5LjhjMCAxLjItLjkgMi4xLTIuMSAyLjFIMTYuMmMtMS4yIDAtMi4xLS45LTIuMS0yLjFWMjAuMWMwLTEuMi45LTIuMSAyLjEtMi4xaDE5Ljh6IiBzdHJva2U9InJnYmEoMTQ0LCAxNDQsIDE0NCwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-30 dark:opacity-10"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header Text */}
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <BrandLogo size="md" showText={false} variant="default" />
              <span className="text-lg font-semibold text-[#0E1F33]/60 dark:text-[#94A3B8]">Masteringbackend</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-6 leading-tight">
              Transform Your
              <span className="block text-[#0E1F33] dark:text-[#F1F5F9]">Backend Career</span>
            </h1>

            <p className="text-xl md:text-2xl text-[#0E1F33] dark:text-[#CBD5E1] mb-8 leading-relaxed">
              We don't just sell courses. We transform careers. Master backend development through our proven
              <strong className="text-[#0E1F33] dark:text-[#F1F5F9]"> Learn → Build → Grow</strong> methodology and land
              your dream job.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <a
                href="/auth/register"
                className="group bg-[#0E1F33] dark:bg-[#0EA5E9] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-all transform hover:scale-105"
              >
                <span className="flex items-center space-x-2">
                  <span>Start Your Transformation</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </a>

              <button className="group flex items-center space-x-2 text-[#0E1F33]/60 hover:text-[#0E1F33] dark:text-[#94A3B8] dark:hover:text-[#F1F5F9] transition-colors px-8 py-4">
                <div className="relative">
                  <Play className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-[#13AECE]/20 dark:bg-[#0EA5E9]/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300"></div>
                </div>
                <span>Watch Success Stories</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-[#0E1F33]/70 dark:text-[#94A3B8] text-sm">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-[#13AECE] dark:text-[#0EA5E9]" />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-[#13AECE] dark:text-[#0EA5E9]" />
                <span>No long-term contracts</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-[#13AECE] dark:text-[#0EA5E9]" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Large Visual Section */}
          <div className="mb-16">
            <div className="relative max-w-5xl mx-auto">
              <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
                <HeroVisual />
              </div>

              {/* Floating Elements Around Visual */}
              <div className="absolute -top-4 -left-4 glass-card p-3 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-[#97C3CC] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                    <Code className="w-4 h-4 text-[#0E1F33] dark:text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0E1F33] dark:text-[#F1F5F9]">Live Coding</div>
                    <div className="text-xs text-[#0E1F33]/70 dark:text-[#94A3B8]">Real-time practice</div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 glass-card p-3 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0E1F33] dark:text-[#F1F5F9]">50K+ Devs</div>
                    <div className="text-xs text-[#0E1F33]/70 dark:text-[#94A3B8]">Active community</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 glass-card p-3 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0E1F33] dark:text-[#F1F5F9]">95% Hired</div>
                    <div className="text-xs text-[#0E1F33]/70 dark:text-[#94A3B8]">Job placement rate</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 glass-card p-3 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-[#0E1F33] dark:bg-[#475569] rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0E1F33] dark:text-[#F1F5F9]">500+ Projects</div>
                    <div className="text-xs text-[#0E1F33]/70 dark:text-[#94A3B8]">Real-world experience</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Companies Section */}
          <div className="mb-16">
            <CompanyLogos />
          </div>
        </div>
      </section>

      {/* Why We're Different */}
      <section className="py-16 bg-[#97C3CC]/5 dark:bg-[#1E293B]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-6">Why We're Different</h2>
            <p className="text-xl text-[#0E1F33] dark:text-[#CBD5E1] max-w-3xl mx-auto">
              Other platforms sell courses. We sell career transformation. Here's how we do it differently.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-2">
                      Traditional Platforms
                    </h3>
                    <p className="text-[#0E1F33]/70 dark:text-[#94A3B8]">
                      Sell courses → You're on your own → Hope for the best
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 text-[#13AECE] dark:text-[#0EA5E9]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-2">Masteringbackend</h3>
                    <p className="text-[#0E1F33]/70 dark:text-[#94A3B8]">
                      Complete transformation → Practical experience → Job placement → Ongoing support
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-card p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-6">Our Success Formula</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#13AECE] dark:text-[#0EA5E9] font-semibold text-sm">1</span>
                  </div>
                  <span className="text-[#0E1F33] dark:text-[#F1F5F9]">Structured Learning Path</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-full flex items-center justify-center">
                    <span className="text-[#0E1F33] dark:text-[#F1F5F9] font-semibold text-sm">2</span>
                  </div>
                  <span className="text-[#0E1F33] dark:text-[#F1F5F9]">Real-World Projects</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#13AECE] dark:text-[#0EA5E9] font-semibold text-sm">3</span>
                  </div>
                  <span className="text-[#0E1F33] dark:text-[#F1F5F9]">Interview Preparation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-full flex items-center justify-center">
                    <span className="text-[#0E1F33] dark:text-[#F1F5F9] font-semibold text-sm">4</span>
                  </div>
                  <span className="text-[#0E1F33] dark:text-[#F1F5F9]">Career Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Key Flows */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-6">
              Your Complete Transformation Journey
            </h2>
            <p className="text-xl text-[#0E1F33] dark:text-[#CBD5E1] max-w-3xl mx-auto">
              Follow our proven three-step methodology to go from beginner to job-ready backend engineer
            </p>
          </div>

          {/* Journey Timeline with Connecting Line */}
          <div className="relative">
            {/* Desktop Connecting Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#13AECE] via-[#97C3CC] to-[#0E1F33] dark:from-[#0EA5E9] dark:via-[#475569] dark:to-[#1E293B] hidden lg:block">
              {/* Decorative dots along the line */}
              <div className="absolute top-[15%] left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full"></div>
              <div className="absolute top-[30%] left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-[#97C3CC] dark:bg-[#475569] rounded-full"></div>
              <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full"></div>
              <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-[#97C3CC] dark:bg-[#475569] rounded-full"></div>
              <div className="absolute top-[75%] left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full"></div>
              <div className="absolute top-[90%] left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-[#97C3CC] dark:bg-[#475569] rounded-full"></div>
            </div>

            {/* Mobile Connecting Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#13AECE] via-[#97C3CC] to-[#0E1F33] dark:from-[#0EA5E9] dark:via-[#475569] dark:to-[#1E293B] lg:hidden">
              {/* Decorative dots along the line - mobile */}
              <div className="absolute top-[10%] left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full"></div>
              <div className="absolute top-[25%] left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#97C3CC] dark:bg-[#475569] rounded-full"></div>
              <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full"></div>
              <div className="absolute top-[55%] left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#97C3CC] dark:bg-[#475569] rounded-full"></div>
              <div className="absolute top-[70%] left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full"></div>
              <div className="absolute top-[85%] left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#97C3CC] dark:bg-[#475569] rounded-full"></div>
            </div>

            {/* Flow 1: Learn */}
            <div id="learn" className="mb-16 lg:mb-32 relative">
              {/* Step Indicator - Desktop */}
              <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-0 hidden lg:block z-10">
                <div className="relative">
                  <div className="w-12 h-12 bg-white dark:bg-[#1E293B] rounded-full shadow-lg flex items-center justify-center">
                    <div className="w-8 h-8 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">1</span>
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#97C3CC] dark:bg-[#475569] rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Step Indicator - Mobile */}
              <div className="absolute left-6 transform -translate-x-1/2 -translate-y-1/2 top-0 lg:hidden z-10">
                <div className="relative">
                  <div className="w-10 h-10 bg-white dark:bg-[#1E293B] rounded-full shadow-lg flex items-center justify-center border-2 border-[#13AECE] dark:border-[#0EA5E9]">
                    <div className="w-6 h-6 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#97C3CC] dark:bg-[#475569] rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center pt-6 lg:pt-8">
                <div className="lg:pr-16">
                  <div className="flex items-center space-x-3 mb-4 lg:mb-6 ml-12 lg:ml-0">
                    <div className="w-10 lg:w-12 h-10 lg:h-12 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-xl flex items-center justify-center relative">
                      <BookOpen className="w-5 lg:w-6 h-5 lg:h-6 text-[#13AECE] dark:text-[#0EA5E9]" />
                      <StarIcon />
                    </div>
                    <div>
                      <span className="text-[#13AECE] dark:text-[#0EA5E9] font-semibold text-xs lg:text-sm uppercase tracking-wide">
                        Step 1
                      </span>
                      <h3 className="text-2xl lg:text-3xl font-bold text-[#0E1F33] dark:text-[#F1F5F9]">
                        Learn & Master
                      </h3>
                    </div>
                  </div>
                  <p className="text-lg lg:text-xl text-[#0E1F33] dark:text-[#CBD5E1] mb-6 lg:mb-8 ml-12 lg:ml-0 leading-relaxed">
                    Start with structured learning through our comprehensive training programs designed by industry
                    experts.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 ml-12 lg:ml-0">
                    <div className="glass-card p-3 lg:p-4 rounded-lg border border-[#97C3CC]/10 dark:border-[#475569]/20 hover:shadow-md transition-shadow">
                      <Video className="w-6 lg:w-8 h-6 lg:h-8 text-[#13AECE] dark:text-[#0EA5E9] mb-2" />
                      <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-1 text-sm lg:text-base">
                        Courses
                      </h4>
                      <p className="text-xs lg:text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">In-depth video courses</p>
                    </div>
                    <div className="glass-card p-3 lg:p-4 rounded-lg border border-[#97C3CC]/10 dark:border-[#475569]/20 hover:shadow-md transition-shadow">
                      <Zap className="w-6 lg:w-8 h-6 lg:h-8 text-[#13AECE] dark:text-[#0EA5E9] mb-2" />
                      <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-1 text-sm lg:text-base">
                        Bootcamps
                      </h4>
                      <p className="text-xs lg:text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">
                        Intensive training programs
                      </p>
                    </div>
                    <div className="glass-card p-3 lg:p-4 rounded-lg border border-[#97C3CC]/10 dark:border-[#475569]/20 hover:shadow-md transition-shadow">
                      <Map className="w-6 lg:w-8 h-6 lg:h-8 text-[#13AECE] dark:text-[#0EA5E9] mb-2" />
                      <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-1 text-sm lg:text-base">
                        Roadmaps
                      </h4>
                      <p className="text-xs lg:text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">Clear learning paths</p>
                    </div>
                    <div className="glass-card p-3 lg:p-4 rounded-lg border border-[#97C3CC]/10 dark:border-[#475569]/20 hover:shadow-md transition-shadow">
                      <Target className="w-6 lg:w-8 h-6 lg:h-8 text-[#13AECE] dark:text-[#0EA5E9] mb-2" />
                      <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-1 text-sm lg:text-base">
                        Paths
                      </h4>
                      <p className="text-xs lg:text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">Specialized tracks</p>
                    </div>
                  </div>
                </div>
                <div className="glass-card p-6 lg:p-8 rounded-2xl lg:ml-16 mt-6 lg:mt-0">
                  <div className="glass p-4 lg:p-6 rounded-xl shadow-sm mb-4">
                    <div className="flex items-center justify-between mb-3 lg:mb-4">
                      <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] text-sm lg:text-base">
                        Python Backend Mastery
                      </h4>
                      <span className="text-xs lg:text-sm text-[#13AECE] dark:text-[#0EA5E9] font-medium">
                        92% Complete
                      </span>
                    </div>
                    <div className="w-full bg-[#97C3CC]/20 dark:bg-[#475569]/30 rounded-full h-2 mb-3 lg:mb-4">
                      <div className="bg-[#0E1F33] dark:bg-[#0EA5E9] h-2 rounded-full" style={{ width: "92%" }}></div>
                    </div>
                    <div className="flex items-center space-x-2 lg:space-x-4 text-xs lg:text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">
                      <span>45 Lessons</span>
                      <span>•</span>
                      <span>12 Projects</span>
                      <span>•</span>
                      <span>8 Quizzes</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[#0E1F33]/60 dark:text-[#94A3B8] mb-3 lg:mb-4 text-sm lg:text-base">
                      Next: Advanced Database Design
                    </p>
                    <button className="bg-[#13AECE] dark:bg-[#0EA5E9] text-white px-4 lg:px-6 py-2 rounded-lg hover:bg-[#13AECE]/90 dark:hover:bg-[#0284C7] transition-colors text-sm lg:text-base w-full sm:w-auto">
                      Continue Learning
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Flow 2: Build/Apply */}
            <div id="build" className="mb-16 lg:mb-32 relative">
              {/* Step Indicator - Desktop */}
              <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-0 hidden lg:block z-10">
                <div className="relative">
                  <div className="w-12 h-12 bg-white dark:bg-[#1E293B] rounded-full shadow-lg flex items-center justify-center">
                    <div className="w-8 h-8 bg-[#97C3CC] dark:bg-[#475569] rounded-full flex items-center justify-center">
                      <span className="text-[#0E1F33] dark:text-[#F1F5F9] font-bold text-lg">2</span>
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Step Indicator - Mobile */}
              <div className="absolute left-6 transform -translate-x-1/2 -translate-y-1/2 top-0 lg:hidden z-10">
                <div className="relative">
                  <div className="w-10 h-10 bg-white dark:bg-[#1E293B] rounded-full shadow-lg flex items-center justify-center border-2 border-[#97C3CC] dark:border-[#475569]">
                    <div className="w-6 h-6 bg-[#97C3CC] dark:bg-[#475569] rounded-full flex items-center justify-center">
                      <span className="text-[#0E1F33] dark:text-[#F1F5F9] font-bold text-sm">2</span>
                    </div>
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center pt-6 lg:pt-8">
                <div className="order-2 lg:order-1 glass-card p-6 lg:p-8 rounded-2xl lg:mr-16">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-6">
                    <div className="glass p-3 lg:p-4 rounded-xl shadow-sm">
                      <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-2 text-sm lg:text-base">
                        E-commerce API
                      </h4>
                      <p className="text-xs lg:text-sm text-[#0E1F33]/60 dark:text-[#94A3B8] mb-2 lg:mb-3">
                        Full-stack marketplace
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full"></div>
                        <span className="text-xs text-[#13AECE] dark:text-[#0EA5E9]">Completed</span>
                      </div>
                    </div>
                    <div className="glass p-3 lg:p-4 rounded-xl shadow-sm">
                      <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-2 text-sm lg:text-base">
                        Chat System
                      </h4>
                      <p className="text-xs lg:text-sm text-[#0E1F33]/60 dark:text-[#94A3B8] mb-2 lg:mb-3">
                        Real-time messaging
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#97C3CC] dark:bg-[#475569] rounded-full"></div>
                        <span className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">In Progress</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[#0E1F33]/60 dark:text-[#94A3B8] mb-3 lg:mb-4 text-sm lg:text-base">
                      Build real-world projects that matter
                    </p>
                    <button className="bg-[#13AECE] dark:bg-[#0EA5E9] text-white px-4 lg:px-6 py-2 rounded-lg hover:bg-[#13AECE]/90 dark:hover:bg-[#0284C7] transition-colors text-sm lg:text-base w-full sm:w-auto">
                      View All Projects
                    </button>
                  </div>
                </div>
                <div className="order-1 lg:order-2 lg:pl-16">
                  <div className="flex items-center space-x-3 mb-4 lg:mb-6 ml-12 lg:ml-0">
                    <div className="w-10 lg:w-12 h-10 lg:h-12 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-xl flex items-center justify-center relative">
                      <Code className="w-5 lg:w-6 h-5 lg:h-6 text-[#0E1F33] dark:text-[#F1F5F9]" />
                      <StarIcon />
                    </div>
                    <div>
                      <span className="text-[#0E1F33] dark:text-[#94A3B8] font-semibold text-xs lg:text-sm uppercase tracking-wide">
                        Step 2
                      </span>
                      <h3 className="text-2xl lg:text-3xl font-bold text-[#0E1F33] dark:text-[#F1F5F9]">
                        Build & Apply
                      </h3>
                    </div>
                  </div>
                  <p className="text-lg lg:text-xl text-[#0E1F33] dark:text-[#CBD5E1] mb-6 lg:mb-8 ml-12 lg:ml-0 leading-relaxed">
                    Put your knowledge into practice with real-world projects and gain the experience employers want to
                    see.
                  </p>
                  <div className="grid grid-cols-1 gap-3 lg:gap-4 ml-12 lg:ml-0">
                    <div className="glass-card p-3 lg:p-4 rounded-lg border border-[#97C3CC]/10 dark:border-[#475569]/20 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <Folder className="w-6 lg:w-8 h-6 lg:h-8 text-[#0E1F33] dark:text-[#F1F5F9] flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] text-sm lg:text-base">
                            MB Projects
                          </h4>
                          <p className="text-xs lg:text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">
                            Industry-standard projects with real requirements
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="glass-card p-3 lg:p-4 rounded-lg border border-[#97C3CC]/10 dark:border-[#475569]/20 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-6 lg:w-8 h-6 lg:h-8 text-[#0E1F33] dark:text-[#F1F5F9] flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] text-sm lg:text-base">
                            Project30
                          </h4>
                          <p className="text-xs lg:text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">
                            30-day intensive project challenges
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="glass-card p-3 lg:p-4 rounded-lg border border-[#97C3CC]/10 dark:border-[#475569]/20 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-6 lg:w-8 h-6 lg:h-8 text-[#0E1F33] dark:text-[#F1F5F9] flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] text-sm lg:text-base">
                            MB Lands
                          </h4>
                          <p className="text-xs lg:text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">
                            Deploy and showcase your projects
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flow 3: Grow */}
            <div id="grow" className="relative">
              {/* Step Indicator - Desktop */}
              <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-0 hidden lg:block z-10">
                <div className="relative">
                  <div className="w-12 h-12 bg-white dark:bg-[#1E293B] rounded-full shadow-lg flex items-center justify-center">
                    <div className="w-8 h-8 bg-[#0E1F33] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">3</span>
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#13AECE] dark:bg-[#475569] rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Step Indicator - Mobile */}
              <div className="absolute left-6 transform -translate-x-1/2 -translate-y-1/2 top-0 lg:hidden z-10">
                <div className="relative">
                  <div className="w-10 h-10 bg-white dark:bg-[#1E293B] rounded-full shadow-lg flex items-center justify-center border-2 border-[#0E1F33] dark:border-[#0EA5E9]">
                    <div className="w-6 h-6 bg-[#0E1F33] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#13AECE] dark:bg-[#475569] rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center pt-6 lg:pt-8">
                <div className="lg:pr-16">
                  <div className="flex items-center space-x-3 mb-4 lg:mb-6 ml-12 lg:ml-0">
                    <div className="w-10 lg:w-12 h-10 lg:h-12 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-xl flex items-center justify-center relative">
                      <TrendingUp className="w-5 lg:w-6 h-5 lg:h-6 text-[#13AECE] dark:text-[#0EA5E9]" />
                      <StarIcon />
                    </div>
                    <div>
                      <span className="text-[#13AECE] dark:text-[#0EA5E9] font-semibold text-xs lg:text-sm uppercase tracking-wide">
                        Step 3
                      </span>
                      <h3 className="text-2xl lg:text-3xl font-bold text-[#0E1F33] dark:text-[#F1F5F9]">
                        Grow & Succeed
                      </h3>
                    </div>
                  </div>
                  <p className="text-lg lg:text-xl text-[#0E1F33] dark:text-[#CBD5E1] mb-6 lg:mb-8 ml-12 lg:ml-0 leading-relaxed">
                    Get job-ready with interview preparation, certifications, and ongoing career support from our
                    community.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 ml-12 lg:ml-0">
                    <div className="glass-card p-3 lg:p-4 rounded-lg border border-[#97C3CC]/10 dark:border-[#475569]/20 hover:shadow-md transition-shadow">
                      <Briefcase className="w-6 lg:w-8 h-6 lg:h-8 text-[#13AECE] dark:text-[#0EA5E9] mb-2" />
                      <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-1 text-sm lg:text-base">
                        MB Interviews
                      </h4>
                      <p className="text-xs lg:text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">
                        Project-based interview prep
                      </p>
                    </div>
                    <div className="glass-card p-3 lg:p-4 rounded-lg border border-[#97C3CC]/10 dark:border-[#475569]/20 hover:shadow-md transition-shadow">
                      <MessageCircle className="w-6 lg:w-8 h-6 lg:h-8 text-[#13AECE] dark:text-[#0EA5E9] mb-2" />
                      <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-1 text-sm lg:text-base">
                        Mock Interviews
                      </h4>
                      <p className="text-xs lg:text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">
                        Practice with real scenarios
                      </p>
                    </div>
                    <div className="glass-card p-3 lg:p-4 rounded-lg border border-[#97C3CC]/10 dark:border-[#475569]/20 hover:shadow-md transition-shadow">
                      <Award className="w-6 lg:w-8 h-6 lg:h-8 text-[#13AECE] dark:text-[#0EA5E9] mb-2" />
                      <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-1 text-sm lg:text-base">
                        Certifications
                      </h4>
                      <p className="text-xs lg:text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">
                        Industry-recognized credentials
                      </p>
                    </div>
                    <div className="glass-card p-3 lg:p-4 rounded-lg border border-[#97C3CC]/10 dark:border-[#475569]/20 hover:shadow-md transition-shadow">
                      <Users className="w-6 lg:w-8 h-6 lg:h-8 text-[#13AECE] dark:text-[#0EA5E9] mb-2" />
                      <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-1 text-sm lg:text-base">
                        Community
                      </h4>
                      <p className="text-xs lg:text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">
                        Lifelong network support
                      </p>
                    </div>
                  </div>
                </div>
                <div className="glass-card p-6 lg:p-8 rounded-2xl lg:ml-16 mt-6 lg:mt-0">
                  <div className="glass p-4 lg:p-6 rounded-xl shadow-sm mb-4">
                    <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-3 lg:mb-4 text-sm lg:text-base">
                      Interview Success Rate
                    </h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs lg:text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">
                        Technical Interviews
                      </span>
                      <span className="text-xs lg:text-sm font-medium text-[#13AECE] dark:text-[#0EA5E9]">94%</span>
                    </div>
                    <div className="w-full bg-[#97C3CC]/20 dark:bg-[#475569]/30 rounded-full h-2 mb-3 lg:mb-4">
                      <div className="bg-[#13AECE] dark:bg-[#0EA5E9] h-2 rounded-full" style={{ width: "94%" }}></div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs lg:text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">System Design</span>
                      <span className="text-xs lg:text-sm font-medium text-[#13AECE] dark:text-[#0EA5E9]">89%</span>
                    </div>
                    <div className="w-full bg-[#97C3CC]/20 dark:bg-[#475569]/30 rounded-full h-2">
                      <div className="bg-[#13AECE] dark:bg-[#0EA5E9] h-2 rounded-full" style={{ width: "89%" }}></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[#0E1F33]/60 dark:text-[#94A3B8] mb-3 lg:mb-4 text-sm lg:text-base">
                      Ready for your dream job?
                    </p>
                    <button className="bg-[#13AECE] dark:bg-[#0EA5E9] text-white px-4 lg:px-6 py-2 rounded-lg hover:bg-[#13AECE]/90 dark:hover:bg-[#0284C7] transition-colors text-sm lg:text-base w-full sm:w-auto">
                      Start Interview Prep
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Tracks */}
      <section className="py-20 bg-[#97C3CC]/5 dark:bg-[#1E293B]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-6">Choose Your Technology Track</h2>
            <p className="text-xl text-[#0E1F33] dark:text-[#CBD5E1] max-w-3xl mx-auto">
              Each track follows our proven Learn → Build → Grow methodology tailored to your chosen technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Python Track */}
            <div className="glass-card p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#0E1F33]/10 dark:bg-[#0EA5E9]/20 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9]">Py</span>
              </div>
              <h3 className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-4">Python Backend</h3>
              <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] mb-6">Master Django, FastAPI, and Python ecosystem</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#13AECE] dark:text-[#0EA5E9] text-xs font-bold">1</span>
                  </div>
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Learn Django & FastAPI</span>
                  <StarIcon />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-full flex items-center justify-center">
                    <span className="text-[#0E1F33] dark:text-[#F1F5F9] text-xs font-bold">2</span>
                  </div>
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Build REST APIs & Microservices</span>
                  <StarIcon />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#13AECE] dark:text-[#0EA5E9] text-xs font-bold">3</span>
                  </div>
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Practice Python interviews</span>
                  <StarIcon />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-full flex items-center justify-center">
                    <span className="text-[#0E1F33] dark:text-[#F1F5F9] text-xs font-bold">4</span>
                  </div>
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Join Python community</span>
                  <StarIcon />
                </div>
              </div>

              <button className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white py-3 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-colors">
                Start Python Track
              </button>
            </div>

            {/* JavaScript Track */}
            <div className="glass-card p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9]">JS</span>
              </div>
              <h3 className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-4">JavaScript Backend</h3>
              <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] mb-6">Master Node.js, Express, and modern JS</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#13AECE] dark:text-[#0EA5E9] text-xs font-bold">1</span>
                  </div>
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Learn Node.js & Express</span>
                  <StarIcon />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-full flex items-center justify-center">
                    <span className="text-[#0E1F33] dark:text-[#F1F5F9] text-xs font-bold">2</span>
                  </div>
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Build GraphQL & REST APIs</span>
                  <StarIcon />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#13AECE] dark:text-[#0EA5E9] text-xs font-bold">3</span>
                  </div>
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Practice JS interviews</span>
                  <StarIcon />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-full flex items-center justify-center">
                    <span className="text-[#0E1F33] dark:text-[#F1F5F9] text-xs font-bold">4</span>
                  </div>
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Join JS community</span>
                  <StarIcon />
                </div>
              </div>

              <button className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white py-3 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-colors">
                Start JavaScript Track
              </button>
            </div>

            {/* Java Track */}
            <div className="glass-card p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#0E1F33]/10 dark:bg-[#0EA5E9]/20 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9]">Java</span>
              </div>
              <h3 className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-4">Java Backend</h3>
              <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] mb-6">Master Spring Boot and enterprise Java</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#13AECE] dark:text-[#0EA5E9] text-xs font-bold">1</span>
                  </div>
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Learn Spring Boot & JPA</span>
                  <StarIcon />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-full flex items-center justify-center">
                    <span className="text-[#0E1F33] dark:text-[#F1F5F9] text-xs font-bold">2</span>
                  </div>
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Build enterprise applications</span>
                  <StarIcon />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#13AECE] dark:text-[#0EA5E9] text-xs font-bold">3</span>
                  </div>
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Practice Java interviews</span>
                  <StarIcon />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-full flex items-center justify-center">
                    <span className="text-[#0E1F33] dark:text-[#F1F5F9] text-xs font-bold">4</span>
                  </div>
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Join Java community</span>
                  <StarIcon />
                </div>
              </div>

              <button className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white py-3 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-colors">
                Start Java Track
              </button>
            </div>

            {/* More Stacks Card */}
            <div className="glass-card p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border-2 border-dashed border-[#97C3CC]/30 dark:border-[#475569]/40 hover:border-[#13AECE] dark:hover:border-[#0EA5E9]">
              <div className="w-16 h-16 bg-gradient-to-br from-[#13AECE]/10 to-[#97C3CC]/20 dark:from-[#0EA5E9]/20 dark:to-[#475569]/40 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full"></div>
                  <div className="w-2 h-2 bg-[#97C3CC] dark:bg-[#475569] rounded-full"></div>
                  <div className="w-2 h-2 bg-[#0E1F33] dark:bg-[#F1F5F9] rounded-full"></div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-4 group-hover:text-[#13AECE] dark:group-hover:text-[#0EA5E9] transition-colors">
                More Stacks
              </h3>

              <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] mb-6">
                Explore additional technologies like Go, Rust, C#, PHP, and more specialized backend stacks
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Go & Microservices</span>
                  <ArrowRight className="w-4 h-4 text-[#13AECE] dark:text-[#0EA5E9] group-hover:translate-x-1 transition-transform duration-300" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Rust & Performance</span>
                  <ArrowRight className="w-4 h-4 text-[#13AECE] dark:text-[#0EA5E9] group-hover:translate-x-1 transition-transform duration-300" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">C# & .NET</span>
                  <ArrowRight className="w-4 h-4 text-[#13AECE] dark:text-[#0EA5E9] group-hover:translate-x-1 transition-transform duration-300" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">PHP & Laravel</span>
                  <ArrowRight className="w-4 h-4 text-[#13AECE] dark:text-[#0EA5E9] group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-[#13AECE] to-[#97C3CC] dark:from-[#0EA5E9] dark:to-[#475569] text-white py-3 rounded-lg hover:shadow-lg transition-all duration-300 group-hover:scale-105 flex items-center justify-center space-x-2">
                <span>Explore All Stacks</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-6">Real Success Stories</h2>
            <p className="text-xl text-[#0E1F33] dark:text-[#CBD5E1] max-w-3xl mx-auto">
              Don't just take our word for it. Here are real transformations from our community members who went from
              beginners to landing their dream jobs.
            </p>
          </div>

          {/* Featured Success Story */}
          <div className="mb-16">
            <div className="glass-card p-8 md:p-12 rounded-3xl shadow-xl bg-[#0E1F33]/5 dark:bg-[#1E293B]/30">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-20 h-20 bg-[#0E1F33] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">SA</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9]">Sarah Ahmed</h3>
                      <p className="text-lg text-[#0E1F33]/70 dark:text-[#94A3B8]">Senior Backend Engineer at Google</p>
                      <div className="flex items-center space-x-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="w-4 h-4 fill-[#97C3CC] dark:fill-[#0EA5E9] text-[#97C3CC] dark:text-[#0EA5E9]"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <blockquote className="text-lg text-[#0E1F33] dark:text-[#CBD5E1] leading-relaxed mb-6">
                    "I was working as a customer service representative making $35K/year with no programming experience.
                    Masteringbackend didn't just teach me to code - they transformed my entire career trajectory. The
                    Learn → Build → Grow methodology gave me a clear path forward."
                  </blockquote>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="text-center p-4 bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-[#97C3CC]/20 dark:border-[#475569]/20">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">$35K</div>
                      <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">Before</div>
                      <div className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">Customer Service</div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-[#97C3CC]/20 dark:border-[#475569]/20">
                      <div className="text-2xl font-bold text-[#13AECE] dark:text-[#0EA5E9] mb-1">$165K</div>
                      <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">After</div>
                      <div className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">Senior Engineer</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>8 months journey</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>Python Track</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>371% salary increase</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="glass p-6 rounded-xl">
                    <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-3">Her Journey Timeline</h4>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[#13AECE] dark:text-[#0EA5E9] text-xs font-bold">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-[#0E1F33] dark:text-[#F1F5F9]">Months 1-3: Learn</p>
                          <p className="text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">
                            Completed Python Backend Mastery course
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[#0E1F33] dark:text-[#F1F5F9] text-xs font-bold">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-[#0E1F33] dark:text-[#F1F5F9]">Months 4-6: Build</p>
                          <p className="text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">
                            Built 5 real-world projects including an e-commerce API
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[#13AECE] dark:text-[#0EA5E9] text-xs font-bold">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-[#0E1F33] dark:text-[#F1F5F9]">Months 7-8: Grow</p>
                          <p className="text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">
                            Interview prep, got 3 offers, chose Google
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass p-6 rounded-xl">
                    <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-3">Key Projects Built</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-[#13AECE] dark:text-[#0EA5E9]" />
                        <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">
                          E-commerce REST API with Django
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-[#13AECE] dark:text-[#0EA5E9]" />
                        <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Real-time chat application</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-[#13AECE] dark:text-[#0EA5E9]" />
                        <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">Microservices architecture</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* More Success Stories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Story 1 */}
            <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-[#0E1F33] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">MJ</span>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9]">Michael Johnson</h4>
                  <p className="text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">Senior Developer at Netflix</p>
                </div>
              </div>

              <div className="flex items-center space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4 fill-[#97C3CC] dark:fill-[#0EA5E9] text-[#97C3CC] dark:text-[#0EA5E9]"
                  />
                ))}
              </div>

              <blockquote className="text-[#0E1F33] dark:text-[#CBD5E1] mb-4">
                "From truck driver to Netflix engineer in 18 months. The community support and practical projects made
                all the difference. I built a portfolio that got me noticed."
              </blockquote>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg">
                  <div className="text-lg font-bold text-[#0E1F33] dark:text-[#F1F5F9]">$45K → $140K</div>
                  <div className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">Salary jump</div>
                </div>
                <div className="text-center p-3 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg">
                  <div className="text-lg font-bold text-[#0E1F33] dark:text-[#F1F5F9]">18 months</div>
                  <div className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">Total time</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">
                <span className="bg-[#97C3CC]/20 dark:bg-[#475569]/40 text-[#0E1F33] dark:text-[#F1F5F9] px-2 py-1 rounded-full text-xs">
                  JavaScript Track
                </span>
                <span>•</span>
                <span>Career changer</span>
              </div>
            </div>

            {/* Story 2 */}
            <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-[#0E1F33] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">EP</span>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9]">Emily Park</h4>
                  <p className="text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">Backend Lead at Stripe</p>
                </div>
              </div>

              <div className="flex items-center space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4 fill-[#97C3CC] dark:fill-[#0EA5E9] text-[#97C3CC] dark:text-[#0EA5E9]"
                  />
                ))}
              </div>

              <blockquote className="text-[#0E1F33] dark:text-[#CBD5E1] mb-4">
                "The interview preparation was incredible. I felt confident in every technical interview. The mock
                interviews and system design practice were game-changers."
              </blockquote>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg">
                  <div className="text-lg font-bold text-[#0E1F33] dark:text-[#F1F5F9]">$75K → $180K</div>
                  <div className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">Promotion</div>
                </div>
                <div className="text-center p-3 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg">
                  <div className="text-lg font-bold text-[#0E1F33] dark:text-[#F1F5F9]">6 months</div>
                  <div className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">To promotion</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">
                <span className="bg-[#0E1F33]/10 dark:bg-[#0EA5E9]/20 text-[#0E1F33] dark:text-[#F1F5F9] px-2 py-1 rounded-full text-xs">
                  Java Track
                </span>
                <span>•</span>
                <span>Junior → Lead</span>
              </div>
            </div>

            {/* Story 3 */}
            <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-[#0E1F33] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">DL</span>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9]">David Liu</h4>
                  <p className="text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">Staff Engineer at Airbnb</p>
                </div>
              </div>

              <div className="flex items-center space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4 fill-[#97C3CC] dark:fill-[#0EA5E9] text-[#97C3CC] dark:text-[#0EA5E9]"
                  />
                ))}
              </div>

              <blockquote className="text-[#0E1F33] dark:text-[#CBD5E1] mb-4">
                "Switched from frontend to backend using MB. The system design courses and real projects helped me land
                a staff engineer role. Best investment I ever made."
              </blockquote>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg">
                  <div className="text-lg font-bold text-[#0E1F33] dark:text-[#F1F5F9]">$120K → $220K</div>
                  <div className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">New role</div>
                </div>
                <div className="text-center p-3 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg">
                  <div className="text-lg font-bold text-[#0E1F33] dark:text-[#F1F5F9]">12 months</div>
                  <div className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">Transition time</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">
                <span className="bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 text-[#0E1F33] dark:text-[#F1F5F9] px-2 py-1 rounded-full text-xs">
                  Python Track
                </span>
                <span>•</span>
                <span>Frontend → Backend</span>
              </div>
            </div>
          </div>

          {/* Quick Testimonials */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] text-center mb-8">
              What Our Students Say
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-3 h-3 fill-[#97C3CC] dark:fill-[#0EA5E9] text-[#97C3CC] dark:text-[#0EA5E9]"
                    />
                  ))}
                </div>
                <p className="text-sm text-[#0E1F33] dark:text-[#CBD5E1] mb-3">
                  "Got hired at Amazon after 4 months. The projects in my portfolio were exactly what they were looking
                  for."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AK</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#0E1F33] dark:text-[#F1F5F9]">Alex Kim</p>
                    <p className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">Amazon</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-3 h-3 fill-[#97C3CC] dark:fill-[#0EA5E9] text-[#97C3CC] dark:text-[#0EA5E9]"
                    />
                  ))}
                </div>
                <p className="text-sm text-[#0E1F33] dark:text-[#CBD5E1] mb-3">
                  "The community is amazing. Always someone to help when you're stuck. Made learning so much easier."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">RM</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#0E1F33] dark:text-[#F1F5F9]">Rachel Martinez</p>
                    <p className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">Microsoft</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-3 h-3 fill-[#97C3CC] dark:fill-[#0EA5E9] text-[#97C3CC] dark:text-[#0EA5E9]"
                    />
                  ))}
                </div>
                <p className="text-sm text-[#0E1F33] dark:text-[#CBD5E1] mb-3">
                  "From $40K to $130K in 10 months. The ROI on this program is insane. Worth every penny."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#0E1F33] dark:bg-[#475569] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">JW</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#0E1F33] dark:text-[#F1F5F9]">James Wilson</p>
                    <p className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">Uber</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-3 h-3 fill-[#97C3CC] dark:fill-[#0EA5E9] text-[#97C3CC] dark:text-[#0EA5E9]"
                    />
                  ))}
                </div>
                <p className="text-sm text-[#0E1F33] dark:text-[#CBD5E1] mb-3">
                  "The interview prep is next level. I aced every system design question thanks to the practice
                  sessions."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">SP</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#0E1F33] dark:text-[#F1F5F9]">Sophia Patel</p>
                    <p className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">Meta</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Success by the Numbers */}
          <div className="glass-card p-8 rounded-2xl bg-[#0E1F33]/5 dark:bg-[#1E293B]/30">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-4">Success by the Numbers</h3>
              <p className="text-[#0E1F33]/60 dark:text-[#94A3B8] text-lg">
                Real results and engagement from our thriving community
              </p>
            </div>

            {/* Main Success Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div className="text-center group cursor-pointer">
                <div className="glass p-6 rounded-xl hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <div className="text-4xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-2 group-hover:text-[#13AECE] dark:group-hover:text-[#0EA5E9] transition-colors">
                    $89K
                  </div>
                  <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8] mb-1">Average salary increase</div>
                  <div className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">Based on 1,200+ graduates</div>
                  <div className="w-full bg-[#97C3CC]/20 dark:bg-[#475569]/30 rounded-full h-1 mt-3">
                    <div className="bg-[#13AECE] dark:bg-[#0EA5E9] h-1 rounded-full w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  </div>
                </div>
              </div>

              <div className="text-center group cursor-pointer">
                <div className="glass p-6 rounded-xl hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <div className="text-4xl font-bold text-[#13AECE] dark:text-[#0EA5E9] mb-2 group-hover:text-[#0E1F33] dark:group-hover:text-[#F1F5F9] transition-colors">
                    8.5
                  </div>
                  <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8] mb-1">Months to first job</div>
                  <div className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">Average time to employment</div>
                  <div className="w-full bg-[#97C3CC]/20 dark:bg-[#475569]/30 rounded-full h-1 mt-3">
                    <div className="bg-[#0E1F33] dark:bg-[#F1F5F9] h-1 rounded-full w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  </div>
                </div>
              </div>

              <div className="text-center group cursor-pointer">
                <div className="glass p-6 rounded-xl hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <div className="text-4xl font-bold text-[#13AECE] dark:text-[#0EA5E9] mb-2 group-hover:text-[#0E1F33] dark:group-hover:text-[#F1F5F9] transition-colors">
                    95%
                  </div>
                  <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8] mb-1">Job placement rate</div>
                  <div className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">Within 12 months</div>
                  <div className="w-full bg-[#97C3CC]/20 dark:bg-[#475569]/30 rounded-full h-1 mt-3">
                    <div className="bg-[#13AECE] dark:bg-[#0EA5E9] h-1 rounded-full w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  </div>
                </div>
              </div>

              <div className="text-center group cursor-pointer">
                <div className="glass p-6 rounded-xl hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <div className="text-4xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-2 group-hover:text-[#13AECE] dark:group-hover:text-[#0EA5E9] transition-colors">
                    4.9/5
                  </div>
                  <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8] mb-1">Student satisfaction</div>
                  <div className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">From 10,000+ reviews</div>
                  <div className="flex justify-center space-x-1 mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-3 h-3 fill-[#97C3CC] dark:fill-[#0EA5E9] text-[#97C3CC] dark:text-[#0EA5E9] group-hover:fill-[#13AECE] group-hover:text-[#13AECE] transition-colors"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Community Engagement Stats */}
            <div className="border-t border-[#97C3CC]/20 dark:border-[#475569]/20 pt-8">
              <h4 className="text-xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] text-center mb-8">
                Community Engagement
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center group cursor-pointer">
                  <div className="glass p-4 rounded-lg hover:shadow-md transition-all duration-300 group-hover:scale-105">
                    <div className="w-12 h-12 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-[#13AECE] dark:text-[#0EA5E9]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-1">50K+</div>
                    <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">Developers</div>
                  </div>
                </div>

                <div className="text-center group cursor-pointer">
                  <div className="glass p-4 rounded-lg hover:shadow-md transition-all duration-300 group-hover:scale-105">
                    <div className="w-12 h-12 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Code className="w-6 h-6 text-[#0E1F33] dark:text-[#F1F5F9]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-1">2.5M+</div>
                    <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">Playgrounds booted</div>
                  </div>
                </div>

                <div className="text-center group cursor-pointer">
                  <div className="glass p-4 rounded-lg hover:shadow-md transition-all duration-300 group-hover:scale-105">
                    <div className="w-12 h-12 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-6 h-6 text-[#13AECE] dark:text-[#0EA5E9]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-1">150K+</div>
                    <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">Doubts solved by Kap</div>
                  </div>
                </div>

                <div className="text-center group cursor-pointer">
                  <div className="glass p-4 rounded-lg hover:shadow-md transition-all duration-300 group-hover:scale-105">
                    <div className="w-12 h-12 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="w-6 h-6 text-[#0E1F33] dark:text-[#F1F5F9]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-1">1.2M+</div>
                    <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">Hours of learning</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project & Interview Stats */}
            <div className="border-t border-[#97C3CC]/20 dark:border-[#475569]/20 pt-8 mt-8">
              <h4 className="text-xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] text-center mb-8">
                Practical Experience
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center group cursor-pointer">
                  <div className="glass p-4 rounded-lg hover:shadow-md transition-all duration-300 group-hover:scale-105">
                    <div className="w-12 h-12 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Folder className="w-6 h-6 text-[#13AECE] dark:text-[#0EA5E9]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-1">25K+</div>
                    <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">Real projects built</div>
                  </div>
                </div>

                <div className="text-center group cursor-pointer">
                  <div className="glass p-4 rounded-lg hover:shadow-md transition-all duration-300 group-hover:scale-105">
                    <div className="w-12 h-12 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Briefcase className="w-6 h-6 text-[#0E1F33] dark:text-[#F1F5F9]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-1">18K+</div>
                    <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">Interviews solved</div>
                  </div>
                </div>

                <div className="text-center group cursor-pointer">
                  <div className="glass p-4 rounded-lg hover:shadow-md transition-all duration-300 group-hover:scale-105">
                    <div className="w-12 h-12 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Video className="w-6 h-6 text-[#13AECE] dark:text-[#0EA5E9]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-1">8.5K+</div>
                    <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">Mock interviews attended</div>
                  </div>
                </div>

                <div className="text-center group cursor-pointer">
                  <div className="glass p-4 rounded-lg hover:shadow-md transition-all duration-300 group-hover:scale-105">
                    <div className="w-12 h-12 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Target className="w-6 h-6 text-[#0E1F33] dark:text-[#F1F5F9]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-1">75K+</div>
                    <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">Challenges solved</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <h3 className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-4">
              Ready to Write Your Success Story?
            </h3>
            <p className="text-[#0E1F33]/60 dark:text-[#94A3B8] mb-8 max-w-2xl mx-auto">
              Join thousands of developers who have transformed their careers. Your success story could be next.
            </p>
            <a
              href="/auth/register"
              className="inline-block bg-[#13AECE] dark:bg-[#0EA5E9] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#13AECE]/90 dark:hover:bg-[#0284C7] transition-all transform hover:scale-105"
            >
              Start Your Transformation Today
            </a>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-20 bg-[#97C3CC]/5 dark:bg-[#1E293B]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-6">Latest from Our Blog</h2>
            <p className="text-xl text-[#0E1F33] dark:text-[#CBD5E1] max-w-3xl mx-auto">
              Stay updated with the latest backend development trends, tutorials, and career advice from industry
              experts.
            </p>
          </div>

          {/* Featured Blog Posts */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Blog Post 1 */}
            <a
              href="/blog/1"
              className="group glass-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-video bg-gradient-to-br from-[#13AECE]/20 to-[#97C3CC]/30 dark:from-[#0EA5E9]/20 dark:to-[#475569]/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/placeholder.svg?height=200&width=400')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-[#13AECE] dark:bg-[#0EA5E9] text-white px-3 py-1 rounded-full text-sm font-medium">
                    Python
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-3 group-hover:text-[#13AECE] dark:group-hover:text-[#0EA5E9] transition-colors">
                  Building Scalable APIs with FastAPI and PostgreSQL
                </h3>
                <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] mb-4 line-clamp-3">
                  Learn how to build production-ready APIs using FastAPI, PostgreSQL, and modern Python practices. This
                  comprehensive guide covers everything from setup to deployment.
                </p>
                <div className="flex items-center justify-between text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">KS</span>
                    </div>
                    <span>Kapehe Sevilleja</span>
                  </div>
                  <span>5 min read</span>
                </div>
              </div>
            </a>

            {/* Blog Post 2 */}
            <a
              href="/blog/2"
              className="group glass-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-video bg-gradient-to-br from-[#0E1F33]/20 to-[#97C3CC]/30 dark:from-[#475569]/20 dark:to-[#0EA5E9]/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/placeholder.svg?height=200&width=400')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-[#0E1F33] dark:bg-[#475569] text-white px-3 py-1 rounded-full text-sm font-medium">
                    Architecture
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-3 group-hover:text-[#13AECE] dark:group-hover:text-[#0EA5E9] transition-colors">
                  Microservices Architecture: A Complete Guide
                </h3>
                <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] mb-4 line-clamp-3">
                  Discover how to design and implement microservices architecture for scalable backend systems. Learn
                  about service communication, data management, and deployment strategies.
                </p>
                <div className="flex items-center justify-between text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-[#0E1F33] dark:bg-[#475569] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">KS</span>
                    </div>
                    <span>Kapehe Sevilleja</span>
                  </div>
                  <span>8 min read</span>
                </div>
              </div>
            </a>

            {/* Blog Post 3 */}
            <a
              href="/blog/3"
              className="group glass-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-video bg-gradient-to-br from-[#97C3CC]/20 to-[#13AECE]/30 dark:from-[#0EA5E9]/20 dark:to-[#475569]/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/placeholder.svg?height=200&width=400')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-[#97C3CC] dark:bg-[#475569] text-[#0E1F33] dark:text-white px-3 py-1 rounded-full text-sm font-medium">
                    Career
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-3 group-hover:text-[#13AECE] dark:group-hover:text-[#0EA5E9] transition-colors">
                  From Junior to Senior: Backend Developer Career Path
                </h3>
                <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] mb-4 line-clamp-3">
                  Navigate your backend development career with our comprehensive guide. Learn about skill progression,
                  salary expectations, and how to advance from junior to senior roles.
                </p>
                <div className="flex items-center justify-between text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-[#97C3CC] dark:bg-[#475569] rounded-full flex items-center justify-center">
                      <span className="text-[#0E1F33] dark:text-white text-xs font-bold">KS</span>
                    </div>
                    <span>Kapehe Sevilleja</span>
                  </div>
                  <span>12 min read</span>
                </div>
              </div>
            </a>
          </div>

          {/* Blog Categories */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] text-center mb-8">
              Explore by Category
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a
                href="/blog/category/python"
                className="group glass-card p-6 rounded-xl text-center hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-[#13AECE] dark:text-[#0EA5E9] font-bold text-lg">Py</span>
                </div>
                <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-1">Python</h4>
                <p className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">24 articles</p>
              </a>

              <a
                href="/blog/category/javascript"
                className="group glass-card p-6 rounded-xl text-center hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-[#97C3CC]/20 dark:bg-[#475569]/40 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-[#0E1F33] dark:text-[#F1F5F9] font-bold text-lg">JS</span>
                </div>
                <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-1">JavaScript</h4>
                <p className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">18 articles</p>
              </a>

              <a
                href="/blog/category/architecture"
                className="group glass-card p-6 rounded-xl text-center hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-[#0E1F33]/10 dark:bg-[#0EA5E9]/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-[#0E1F33] dark:text-[#0EA5E9] font-bold text-sm">Arc</span>
                </div>
                <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-1">Architecture</h4>
                <p className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">15 articles</p>
              </a>

              <a
                href="/blog/category/career"
                className="group glass-card p-6 rounded-xl text-center hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6 text-[#13AECE] dark:text-[#0EA5E9]" />
                </div>
                <h4 className="font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-1">Career</h4>
                <p className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">12 articles</p>
              </a>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-4">Want More Backend Insights?</h3>
            <p className="text-[#0E1F33]/60 dark:text-[#94A3B8] mb-8 max-w-2xl mx-auto">
              Explore our complete collection of tutorials, guides, and career advice to accelerate your backend
              development journey.
            </p>
            <a
              href="/blog"
              className="inline-flex items-center space-x-2 bg-[#13AECE] dark:bg-[#0EA5E9] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#13AECE]/90 dark:hover:bg-[#0284C7] transition-all transform hover:scale-105"
            >
              <BookOpen className="w-5 h-5" />
              <span>Explore All Articles</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-20 bg-[#0E1F33] dark:bg-[#0A0F1C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Join Our Thriving Community</h2>
          <p className="text-xl text-white/80 dark:text-[#CBD5E1] mb-12 max-w-3xl mx-auto">
            Connect with thousands of backend developers, get help when you need it, and celebrate your wins together.
          </p>

          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">50K+</div>
              <div className="text-white/70 dark:text-[#94A3B8]">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-white/70 dark:text-[#94A3B8]">Community Support</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">1K+</div>
              <div className="text-white/70 dark:text-[#94A3B8]">Weekly Discussions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">100+</div>
              <div className="text-white/70 dark:text-[#94A3B8]">Expert Mentors</div>
            </div>
          </div>

          <button className="bg-[#13AECE] dark:bg-[#0EA5E9] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#13AECE]/90 dark:hover:bg-[#0284C7] transition-all transform hover:scale-105">
            Join the Community
          </button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-[#0E1F33]/70 dark:text-[#94A3B8] mb-12">
            Join thousands of developers who have successfully transformed their careers with Masteringbackend.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <a
              href="/auth/register"
              className="bg-[#0E1F33] dark:bg-[#0EA5E9] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-all transform hover:scale-105"
            >
              Start Your Journey Today
            </a>
            <button className="flex items-center space-x-2 text-[#13AECE] dark:text-[#0EA5E9] hover:text-[#13AECE]/80 dark:hover:text-[#0284C7] transition-colors px-8 py-4">
              <MessageCircle className="w-5 h-5" />
              <span>Talk to Our Team</span>
            </button>
          </div>

          <p className="text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">
            30-day money-back guarantee • No long-term contracts • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0E1F33] dark:bg-[#0A0F1C] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <BrandLogo size="lg" showText={true} variant="white" />
              </div>
              <p className="text-white/80 dark:text-[#CBD5E1] mb-6 leading-relaxed">
                Transform your backend development career with our proven Learn → Build → Grow methodology. Join
                thousands of developers who have successfully landed their dream jobs.
              </p>

              {/* Newsletter Signup */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Stay Updated</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 bg-[#97C3CC]/10 dark:bg-[#1E293B] border border-[#97C3CC]/20 dark:border-[#475569]/20 rounded-lg text-white placeholder-white/60 dark:placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#13AECE] dark:focus:ring-[#0EA5E9] focus:border-transparent"
                  />
                  <button className="bg-[#13AECE] dark:bg-[#0EA5E9] text-white px-6 py-2 rounded-lg hover:bg-[#13AECE]/90 dark:hover:bg-[#0284C7] transition-all whitespace-nowrap">
                    Subscribe
                  </button>
                </div>
                <p className="text-white/80 dark:text-[#94A3B8] text-xs mt-2">
                  Get weekly tips, project ideas, and career advice
                </p>
              </div>

              {/* Social Media */}
              <div>
                <h4 className="text-white font-semibold mb-3">Follow Us</h4>
                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="w-10 h-10 bg-[#97C3CC]/10 dark:bg-[#1E293B] rounded-lg flex items-center justify-center hover:bg-[#13AECE] dark:hover:bg-[#0EA5E9] transition-colors group"
                  >
                    <svg
                      className="w-5 h-5 text-[#0E1F33]/60 dark:text-[#94A3B8] group-hover:text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-[#97C3CC]/10 dark:bg-[#1E293B] rounded-lg flex items-center justify-center hover:bg-[#13AECE] dark:hover:bg-[#0EA5E9] transition-colors group"
                  >
                    <svg
                      className="w-5 h-5 text-[#0E1F33]/60 dark:text-[#94A3B8] group-hover:text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-[#97C3CC]/10 dark:bg-[#1E293B] rounded-lg flex items-center justify-center hover:bg-[#13AECE] dark:hover:bg-[#0EA5E9] transition-colors group"
                  >
                    <svg
                      className="w-5 h-5 text-[#0E1F33]/60 dark:text-[#94A3B8] group-hover:text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-1">
              <h4 className="text-white font-semibold mb-4">Learn</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors">
                    Courses
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors">
                    Bootcamps
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors">
                    Roadmaps
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors">
                    Paths
                  </a>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-1">
              <h4 className="text-white font-semibold mb-4">Build</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors">
                    MB Projects
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors">
                    Project30
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors">
                    MB Lands
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors">
                    Portfolio
                  </a>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-1">
              <h4 className="text-white font-semibold mb-4">Grow</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors">
                    MB Interviews
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors">
                    Mock Interviews
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors">
                    Certifications
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors">
                    Community
                  </a>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-1">
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="/blog" className="text-white/70 hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/70 hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-white/60 text-sm mb-4 md:mb-0">© 2024 Masteringbackend. All rights reserved.</div>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-white/60 hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-white/60 hover:text-white transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-white/60 hover:text-white transition-colors">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
