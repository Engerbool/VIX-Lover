import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Loader2, Sparkles } from 'lucide-react';

const GeminiInsight: React.FC = () => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    setInsight('');

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API Key not found");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Provide a concise, professional financial summary of what the VIX index is, how it is calculated derived from S&P 500 options, and why it is called the 'fear gauge'. Keep it under 150 words. Focus on tone suitable for a professional dashboard.",
        config: {
            temperature: 0.7,
        }
      });
      
      const text = response.text;
      if (text) {
          setInsight(text);
      } else {
          throw new Error("No response generated");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to retrieve AI analysis at this time.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-8 text-center">
        <div className="max-w-2xl border border-white/20 bg-zinc-900/40 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.05)]">
            {/* Top Light Edge */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80 shadow-[0_0_15px_white]"></div>
            
            {/* Ambient Background Light */}
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>

            <Sparkles className="w-12 h-12 text-white mx-auto mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            
            <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">AI Market Insight</h2>
            
            {!insight && !loading && !error && (
                <div className="space-y-6 relative z-10">
                    <p className="text-zinc-300">Generate a real-time AI summary of VIX fundamental concepts.</p>
                    <button 
                        onClick={fetchInsight}
                        className="group relative px-8 py-3 bg-white/5 text-white font-bold rounded-full overflow-hidden border border-white/20 transition-all hover:bg-white/10 hover:border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    >
                        {/* Bright Gradient Text (Monochrome) */}
                        <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-white group-hover:text-white transition-colors">
                            Generate Analysis
                        </span>
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-4 relative z-10">
                    <Loader2 className="w-10 h-10 text-white animate-spin mb-2 drop-shadow-[0_0_10px_white]" />
                    <span className="text-sm text-white/70 animate-pulse">Consulting Gemini...</span>
                </div>
            )}

            {error && (
                <div className="relative z-10 text-red-200 bg-red-950/40 border border-red-500/30 p-4 rounded-xl text-sm backdrop-blur-md">
                    {error}
                </div>
            )}

            {insight && (
                <div className="relative z-10 animate-in fade-in duration-700 slide-in-from-bottom-4 text-left">
                    <div className="text-zinc-100 leading-relaxed text-sm md:text-base border-l-[3px] border-white/30 pl-6 py-2 bg-white/5 rounded-r-xl shadow-inner">
                        {insight}
                    </div>
                    <div className="flex justify-center">
                        <button 
                            onClick={() => setInsight('')}
                            className="mt-6 text-xs text-white/60 hover:text-white uppercase tracking-widest font-bold transition-all hover:drop-shadow-[0_0_5px_white]"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default GeminiInsight;