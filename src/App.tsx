import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Camera, 
  Zap, 
  Download, 
  Save, 
  Trash2, 
  Settings, 
  User, 
  X,
  Loader2,
  Plus
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Generation {
  id: string;
  url: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  timestamp: number;
  isSaved: boolean;
}

interface ModelConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  supportsImage: boolean;
}

const MODELS: ModelConfig[] = [
  { 
    id: 'fazon-realistic', 
    name: 'Fazon Realistic Pro', 
    description: 'Extreme realism & photographic precision', 
    icon: <Camera className="w-5 h-5" />,
    supportsImage: true
  },
  { 
    id: 'fazon-photography', 
    name: 'Fazon Photography', 
    description: 'Aesthetic beauty & artistic harmony', 
    icon: <ImageIcon className="w-5 h-5" />,
    supportsImage: true
  },
  { 
    id: 'nano-banana-pro', 
    name: 'Nano Banana Pro', 
    description: 'Versatile general-purpose generator', 
    icon: <Zap className="w-5 h-5" />,
    supportsImage: true
  },
];

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1' },
  { label: '2:3', value: '2:3' },
  { label: '4:5', value: '4:5' },
  { label: '9:16', value: '9:16' },
  { label: '16:9', value: '16:9' },
];

// --- Components ---

const RobotLoader = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <motion.div
      animate={{
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="relative"
    >
      <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="30" width="50" height="40" rx="8" fill="#FF6B00" />
        <rect x="35" y="40" width="10" height="10" rx="2" fill="white" />
        <rect x="55" y="40" width="10" height="10" rx="2" fill="white" />
        <path d="M40 60 Q50 65 60 60" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <rect x="45" y="20" width="10" height="10" rx="2" fill="#FF6B00" />
        <line x1="50" y1="20" x2="50" y2="10" stroke="#FF6B00" strokeWidth="2" />
        <circle cx="50" cy="8" r="3" fill="#FF6B00" />
        {/* Walking Legs */}
        <motion.line 
          animate={{ x1: [35, 45, 35], x2: [35, 45, 35] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          x1="35" y1="70" x2="35" y2="90" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round" 
        />
        <motion.line 
          animate={{ x1: [65, 55, 65], x2: [65, 55, 65] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.25 }}
          x1="65" y1="70" x2="65" y2="90" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round" 
        />
      </svg>
    </motion.div>
    <p className="text-orange-primary font-bold tracking-widest animate-pulse">OPTIMIZING NEURAL PATHWAYS...</p>
  </div>
);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [imageInput, setImageInput] = useState<string | null>(null);
  const [tempGenerations, setTempGenerations] = useState<Generation[]>([]);
  const [savedGenerations, setSavedGenerations] = useState<Generation[]>([]);
  const [view, setView] = useState<'generate' | 'gallery' | 'profile' | 'admin'>('generate');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: selectedModel.id,
          aspectRatio: selectedRatio.value,
          imageInput
        })
      });
      const data = await response.json();
      if (data.imageUrl) {
        const newGen: Generation = {
          id: Math.random().toString(36).substr(2, 9),
          url: data.imageUrl,
          prompt,
          model: selectedModel.name,
          aspectRatio: selectedRatio.value,
          timestamp: Date.now(),
          isSaved: false
        };
        setTempGenerations([newGen, ...tempGenerations]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const saveToAccount = async (gen: Generation) => {
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generation: gen })
      });
      if (response.ok) {
        setSavedGenerations([{ ...gen, isAuth: true }, ...savedGenerations]);
        setTempGenerations(tempGenerations.filter(g => g.id !== gen.id));
      }
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const deleteGeneration = (id: string, isTemp: boolean) => {
    if (isTemp) {
      setTempGenerations(tempGenerations.filter(g => g.id !== id));
    } else {
      setSavedGenerations(savedGenerations.filter(g => g.id !== id));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageInput(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAdminLogin = async () => {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUser, password: adminPass })
    });
    const data = await response.json();
    if (data.success) {
      setIsAdmin(true);
    } else {
      alert("Invalid Admin Credentials");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-50">
        <RobotLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-primary selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between thick-glass px-6 py-3">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('generate')}>
            <div className="w-10 h-10 bg-orange-primary rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter italic">FLEX4GENZ</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => setView('generate')} className={cn("text-sm font-bold tracking-widest uppercase transition-colors", view === 'generate' ? "text-orange-primary" : "text-white/60 hover:text-white")}>Create</button>
            <button onClick={() => setView('gallery')} className={cn("text-sm font-bold tracking-widest uppercase transition-colors", view === 'gallery' ? "text-orange-primary" : "text-white/60 hover:text-white")}>Gallery</button>
            <button onClick={() => setView('profile')} className={cn("text-sm font-bold tracking-widest uppercase transition-colors", view === 'profile' ? "text-orange-primary" : "text-white/60 hover:text-white")}>Profile</button>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={() => setView('admin')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-white/60" />
            </button>
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
              <User className="w-6 h-6 text-white/40" />
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'generate' && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Controls */}
              <div className="lg:col-span-4 space-y-6">
                <div className="thick-glass p-6 space-y-6">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-3 block">Select Model</label>
                    <div className="space-y-2">
                      {MODELS.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedModel(m)}
                          className={cn(
                            "w-full flex items-center p-4 rounded-xl border transition-all text-left",
                            selectedModel.id === m.id 
                              ? "bg-orange-primary/10 border-orange-primary text-white" 
                              : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                          )}
                        >
                          <div className={cn("p-2 rounded-lg mr-4", selectedModel.id === m.id ? "bg-orange-primary text-white" : "bg-white/10")}>
                            {m.icon}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{m.name}</div>
                            <div className="text-[10px] opacity-60 uppercase tracking-tighter">{m.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-3 block">Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-2">
                      {ASPECT_RATIOS.map((r) => (
                        <button
                          key={r.value}
                          onClick={() => setSelectedRatio(r)}
                          className={cn(
                            "py-2 rounded-lg border text-xs font-bold transition-all",
                            selectedRatio.value === r.value
                              ? "bg-orange-primary border-orange-primary text-white"
                              : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                          )}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedModel.supportsImage && (
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-3 block">Image Reference</label>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload}
                          className="hidden" 
                          id="img-upload" 
                        />
                        <label 
                          htmlFor="img-upload"
                          className="w-full h-32 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all"
                        >
                          {imageInput ? (
                            <img src={imageInput} className="w-full h-full object-cover rounded-xl" alt="Preview" />
                          ) : (
                            <>
                              <Plus className="w-8 h-8 text-white/20 mb-2" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Upload Image</span>
                            </>
                          )}
                        </label>
                        {imageInput && (
                          <button 
                            onClick={() => setImageInput(null)}
                            className="absolute -top-2 -right-2 bg-red-500 p-1 rounded-full shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Generation Area */}
              <div className="lg:col-span-8 space-y-8">
                <div className="thick-glass p-8 space-y-6">
                  <div className="space-y-4">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your imagination in detail..."
                      className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-6 text-xl font-medium focus:border-orange-primary outline-none min-h-[160px] resize-none transition-all placeholder:text-white/20"
                    />
                    
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <AnimatePresence>
                          {imageInput && (
                            <motion.div 
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="relative group"
                            >
                              <img 
                                src={imageInput} 
                                className="w-16 h-16 object-cover rounded-lg border-2 border-orange-primary/50 shadow-lg" 
                                alt="Input Preview" 
                              />
                              <button 
                                onClick={() => setImageInput(null)}
                                className="absolute -top-2 -right-2 bg-red-500 p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {!imageInput && (
                          <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 italic">
                            No image reference attached
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleGenerate}
                        disabled={generating || !prompt.trim()}
                        className="liquid-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ml-auto"
                      >
                        {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        <span>{generating ? 'GENERATING...' : 'GENERATE'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Generations */}
                <div className="space-y-6">
                  <h2 className="text-xl font-black italic tracking-tighter flex items-center">
                    <Zap className="w-6 h-6 text-orange-primary mr-2" />
                    RECENT GENERATIONS
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tempGenerations.map((gen) => (
                      <motion.div
                        layout
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={gen.id}
                        className="thick-glass overflow-hidden group"
                      >
                        <div className="relative aspect-square">
                          <img src={gen.url} className="w-full h-full object-cover" alt={gen.prompt} referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                            <p className="text-xs line-clamp-2 mb-4 text-white/80 italic">"{gen.prompt}"</p>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => saveToAccount(gen)}
                                className="flex-1 bg-white text-black font-black text-[10px] py-2 rounded-lg hover:bg-orange-primary hover:text-white transition-all flex items-center justify-center uppercase tracking-widest"
                              >
                                <Save className="w-3 h-3 mr-2" /> Save to Account
                              </button>
                              <button 
                                onClick={() => deleteGeneration(gen.id, true)}
                                className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h1 className="text-6xl font-black italic tracking-tighter">COMMUNITY FEED</h1>
                <p className="text-white/40 uppercase tracking-[0.5em] text-xs">Explore generations from the Flex4Genz community</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Mock community images */}
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="thick-glass aspect-[3/4] overflow-hidden relative group">
                    <img 
                      src={`https://picsum.photos/seed/gen${i}/600/800`} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                      alt="Community" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-orange-primary" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">User_{i}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="thick-glass p-12 flex flex-col items-center text-center space-y-6">
                <div className="w-32 h-32 rounded-full bg-orange-primary flex items-center justify-center border-4 border-white/10 shadow-2xl shadow-orange-500/20">
                  <User className="w-16 h-16" />
                </div>
                <div>
                  <h2 className="text-4xl font-black italic tracking-tighter uppercase">Admin Creator</h2>
                  <p className="text-white/40 text-xs tracking-widest uppercase mt-2">Member since March 2026</p>
                </div>
                <div className="flex space-x-12">
                  <div className="text-center">
                    <div className="text-2xl font-black text-orange-primary">{savedGenerations.length}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-orange-primary">1.2k</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Followers</div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-black italic tracking-tighter uppercase border-b border-white/10 pb-4">Saved to Account</h3>
                {savedGenerations.length === 0 ? (
                  <div className="thick-glass p-20 text-center text-white/20 uppercase tracking-widest font-bold">No saved generations yet</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {savedGenerations.map((gen) => (
                      <div key={gen.id} className="thick-glass overflow-hidden group relative">
                        <img src={gen.url} className="w-full h-full object-cover" alt="Saved" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                          <button className="p-3 bg-white text-black rounded-full hover:bg-orange-primary hover:text-white transition-all">
                            <Download className="w-5 h-5" />
                          </button>
                          <button onClick={() => deleteGeneration(gen.id, false)} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              {!isAdmin ? (
                <div className="thick-glass p-12 space-y-8">
                  <div className="text-center space-y-2">
                    <Settings className="w-12 h-12 text-orange-primary mx-auto mb-4" />
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase">Admin Access</h2>
                    <p className="text-white/40 text-xs tracking-widest uppercase">Restricted area for platform administrators</p>
                  </div>
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Username" 
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-orange-primary transition-all" 
                    />
                    <input 
                      type="password" 
                      placeholder="Password" 
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-orange-primary transition-all" 
                    />
                    <button 
                      onClick={handleAdminLogin}
                      className="w-full liquid-button"
                    >
                      AUTHENTICATE
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="thick-glass p-8">
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-6">System Dashboard</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Active Keys</div>
                        <div className="text-3xl font-black text-orange-primary">9 / 9</div>
                      </div>
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Database</div>
                        <div className="text-sm font-black text-green-500 uppercase">CONNECTED (FULL POWER)</div>
                      </div>
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Total Gens</div>
                        <div className="text-3xl font-black text-orange-primary">1,429</div>
                      </div>
                    </div>
                  </div>

                  <div className="thick-glass p-8">
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-6">Referral Links</h2>
                    <div className="space-y-4">
                      {[
                        { link: 'flex4genz.com/ref/alpha', uses: 45 },
                        { link: 'flex4genz.com/ref/beta', uses: 12 },
                        { link: 'flex4genz.com/ref/gamma', uses: 89 },
                      ].map((ref, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <span className="text-sm font-mono text-white/60">{ref.link}</span>
                          <span className="text-xs font-black text-orange-primary uppercase">{ref.uses} USES</span>
                        </div>
                      ))}
                      <button className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-white/20 hover:text-white/40 hover:border-white/20 transition-all font-bold uppercase text-xs tracking-widest">
                        Generate New Link
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsAdmin(false)}
                    className="w-full py-4 bg-red-500/10 text-red-500 font-bold rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all uppercase text-xs tracking-[0.3em]"
                  >
                    Terminate Session
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between opacity-40">
          <div className="flex items-center space-x-2 mb-6 md:mb-0">
            <Sparkles className="w-5 h-5" />
            <span className="font-black italic tracking-tighter">FLEX4GENZ</span>
          </div>
          <div className="flex space-x-8 text-[10px] font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-orange-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-orange-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-orange-primary transition-colors">API Docs</a>
            <a href="#" className="hover:text-orange-primary transition-colors">Support</a>
          </div>
          <div className="mt-6 md:mt-0 text-[10px] font-bold uppercase tracking-widest">
            © 2026 FLEX4GENZ AI LABS
          </div>
        </div>
      </footer>

      {/* Netlify Instructions Modal (Mock) */}
      {isAdmin && (
        <div className="fixed bottom-8 right-8 z-50">
          <div className="thick-glass p-6 max-w-sm shadow-2xl border-orange-primary/50">
            <h4 className="text-orange-primary font-black text-sm uppercase tracking-widest mb-3">Deployment Guide</h4>
            <div className="text-[10px] text-white/60 space-y-2 leading-relaxed">
              <p>1. Go to Netlify Dashboard &gt; Site Settings &gt; Environment Variables.</p>
              <p>2. Add <code className="text-white">GEMINI_API_KEY_1</code> to <code className="text-white">9</code>.</p>
              <p>3. Add <code className="text-white">DATABASE_URL</code> (Neon PostgreSQL connection string).</p>
              <p>4. Add <code className="text-white">ADMIN_USER</code> and <code className="text-white">ADMIN_PASS</code>.</p>
              <p>5. Enable <code className="text-white">Netlify Blobs</code> in the "Integrations" tab for image storage.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
