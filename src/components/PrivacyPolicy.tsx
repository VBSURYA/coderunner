import React from "react";
import { Shield, ArrowLeft, Lock, FileText, Cpu, Eye, AlertCircle } from "lucide-react";

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-[#1e1e1e] text-[#cccccc] font-sans antialiased overflow-y-auto">
      {/* Header Area */}
      <header className="sticky top-0 z-50 bg-[#252526] border-b border-[#1e1e1e] px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-[#007acc]" />
          <span className="font-mono text-lg font-bold text-white tracking-wide uppercase">
            CodeRunner // Privacy Policy
          </span>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-[#333333] hover:bg-[#474749] text-white text-xs font-semibold tracking-wider uppercase transition cursor-pointer border border-[#454545]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Editor
        </button>
      </header>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-[#252526] rounded-xl border border-[#333333] p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 border-b border-[#333333] pb-4">
            <FileText className="w-8 h-8 text-[#007acc]" />
            Privacy Policy
          </h1>
          <p className="text-[11px] text-[#858585] font-mono mb-8">
            Last Updated: July 3, 2026
          </p>

          <div className="space-y-8 text-sm leading-relaxed">
            {/* Section 1: Overview */}
            <section className="bg-[#1e1e1e] p-6 rounded-lg border border-[#2d2d2d] transition-all hover:border-[#007acc]/40">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-[#007acc]" />
                1. Introduction
              </h2>
              <p className="text-gray-300">
                Welcome to <strong>CodeRunner</strong>. We are committed to protecting your privacy. This Privacy Policy describes how we collect, use, disclose, and protect your information when you use our web-based interactive development environment and services.
              </p>
            </section>

            {/* Section 2: Data Collection */}
            <section className="bg-[#1e1e1e] p-6 rounded-lg border border-[#2d2d2d] transition-all hover:border-[#007acc]/40">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-[#007acc]" />
                2. Data Collection and Usage
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                <li>
                  <strong>Workspace Files & Settings:</strong> All workspace files you create or modify, along with your editor settings, are stored directly in your browser's local storage (LocalStorage) to keep your project accessible between visits. We also sync these files with our workspace container APIs temporarily to allow code execution.
                </li>
                <li>
                  <strong>Execution Sandbox Logs:</strong> When you run code using our platform, the script context and input standard streams (stdin) are processed by our secure backend code runner to simulate stdout/stderr responses.
                </li>
                <li>
                  <strong>Usage Analytics:</strong> We use lightweight telemetry solutions, including Vercel Analytics and Google Tag Manager, to analyze traffic, visitor engagement, and app performance.
                </li>
              </ul>
            </section>

            {/* Section 3: Third Party Ads */}
            <section className="bg-[#1e1e1e] p-6 rounded-lg border border-[#2d2d2d] transition-all hover:border-[#007acc]/40">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-[#007acc]" />
                3. Advertising and Cookies
              </h2>
              <p className="text-gray-300 mb-3">
                To keep CodeRunner free, we show ads on our platform. We work with third-party advertising companies, including Google AdSense and other advertising networks:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                <li>
                  These third-party vendors may use cookies, web beacons, and other tracking technologies to serve ads based on your visits to our site and other sites across the internet.
                </li>
                <li>
                  Google's use of advertising cookies enables it and its partners to serve ads to users based on their visits to CodeRunner and/or other sites on the Internet.
                </li>
                <li>
                  You can opt out of personalized advertising by visiting your browser's ad settings or by adjusting settings via external initiatives such as <a href="https://optout.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-[#007acc] hover:underline font-semibold">AboutAds.info</a>.
                </li>
              </ul>
            </section>

            {/* Section 4: Data Security */}
            <section className="bg-[#1e1e1e] p-6 rounded-lg border border-[#2d2d2d] transition-all hover:border-[#007acc]/40">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-[#007acc]" />
                4. Data Security
              </h2>
              <p className="text-gray-300">
                We employ standard industry measures to safeguard your code executions and stored data. Since files are predominantly held in your browser's client-side cache, the security of your workspace also depends heavily on securing your personal device and browser session.
              </p>
            </section>

            {/* Section 5: Updates */}
            <section className="bg-[#1e1e1e] p-6 rounded-lg border border-[#2d2d2d] transition-all hover:border-[#007acc]/40">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-[#007acc]" />
                5. Changes to This Policy
              </h2>
              <p className="text-gray-300">
                We reserves the right to modify this Privacy Policy at any time. Any changes will be reflected immediately on this page, with an updated revision date. We encourage you to review this page periodically.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-6 border-t border-[#333333] flex justify-between items-center text-xs text-[#858585]">
            <span>© 2026 CodeRunner. All rights reserved.</span>
            <button
              onClick={onBack}
              className="text-[#007acc] hover:underline font-semibold cursor-pointer"
            >
              Return to Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
