"use client";

import React, { useState } from 'react';
import { 
  Scissors, 
  RotateCcw, 
  Zap, 
  ShieldCheck, 
  Upload, 
  Edit3, 
  Download, 
  Github, 
  Monitor, 
  Smartphone, 
  Youtube, 
  Instagram, 
  CheckCircle2,
  Cpu,
  Globe,
  Gauge
} from 'lucide-react';

export default function ReframeLanding() {
  const [activeTab, setActiveTab] = useState('social');

  const presets = [
    { name: "TikTok / Reels", ratio: "9:16", icon: <Smartphone size={20} />, platform: "social" },
    { name: "YouTube", ratio: "16:9", icon: <Youtube size={20} />, platform: "social" },
    { name: "Instagram Square", ratio: "1:1", icon: <Instagram size={20} />, platform: "social" },
    { name: "LinkedIn", ratio: "4:5", icon: <Monitor size={20} />, platform: "social" },
    { name: "X (Twitter)", ratio: "2:3", icon: <Globe size={20} />, platform: "social" },
    { name: "Cinematic", ratio: "21:9", icon: <Monitor size={20} />, platform: "pro" },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
            <span className="text-xl font-bold tracking-tight">Reframe</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/magic-peach/reframe" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-2 text-sm font-medium">
              <Github size={18} /> GitHub
            </a>
            <a href="/editor" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all">
              Launch Editor
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-8">
            <Zap size={14} /> Local-First Video Editing
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
            Your videos, <br />
            <span className="text-indigo-600">zero server uploads.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Reframe is a privacy-focused video tool that handles trimming, resizing, and speed adjustments directly in your browser. Fast, free, and completely secure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/editor" className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-indigo-700 hover:scale-[1.02] transition-all shadow-xl shadow-indigo-200">
              Try it free — no login needed
            </a>
            <a href="https://github.com/magic-peach/reframe" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto bg-white text-slate-700 border-2 border-slate-200 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-slate-50 transition-all">
              View Source
            </a>
          </div>
          
          {/* Subtle Frame Preview */}
          <div className="mt-20 max-w-5xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden aspect-video flex items-center justify-center p-8">
                <div className="text-slate-300 flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200 mb-4">
                        <Upload size={32} />
                    </div>
                    <p className="font-medium text-slate-400">Editor Preview Placeholder</p>
                </div>
            </div>
          </div>
        </div>
      </header>

      {/* Platform Presets Section */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl text-left">
              <h2 className="text-3xl font-bold mb-4">Optimized for every platform.</h2>
              <p className="text-lg text-slate-600">Stop guessing aspect ratios. Choose from 11+ built-in presets designed for modern social media and professional workflows.</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('social')} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'social' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Social</button>
              <button onClick={() => setActiveTab('pro')} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'pro' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Professional</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {presets.filter(p => p.platform === activeTab || activeTab === 'all').map((preset, i) => (
              <div key={i} className="group p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-center">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all">
                  {preset.icon}
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{preset.name}</h4>
                <p className="text-xs text-slate-500 font-mono">{preset.ratio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Callout */}
      <section className="py-24 bg-indigo-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-800 text-indigo-200 text-xs font-bold uppercase mb-6">
                <ShieldCheck size={14} /> Security First
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">Your data never leaves your device. Period.</h2>
              <p className="text-xl text-indigo-100/80 mb-10 leading-relaxed">
                Unlike traditional video editors that require multi-gigabyte uploads to a cloud server, Reframe processes everything locally using WebAssembly (WASM).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm">© 2026 Reframe Project. No cookies, no tracking.</p>
        </div>
      </footer>
    </div>
  );
}