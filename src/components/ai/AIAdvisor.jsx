import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sovereign } from '@/api/apiClient';

export default function AIAdvisor() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your ShopTheBarber AI Style Advisor. I can help you find the perfect cut, recommend barbers, or explain grooming services. How can I assist you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Get some context about the current view if possible
            const context = "User is currently browsing the Explore page.";
            const res = await sovereign.functions.invoke('ai-advisor', {
                prompt: input,
                context
            });

            const rawResponse = res.response || "I'm having trouble connecting to my brain right now.";

            // Remove <think> tags if they exist (Grok/Qwen specific), handle unclosed tags
            const cleanResponse = rawResponse
                .replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '')
                .trim();

            setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse }]);
        } catch (error) {
            console.error('AI Advisor Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm sorry, I'm currently offline. Please ensure your local AI server is running."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary via-purple-500/20 to-primary group-hover:animate-pulse" />
                        <Sparkles className="w-6 h-6 relative z-10" />

                        {/* Tooltip */}
                        <span className="absolute -top-12 right-0 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700 shadow-xl">
                            Ask AI Style Advisor
                        </span>
                    </motion.button>
                )}

                {isOpen && (
                    <motion.div
                        initial={{ y: 20, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.95 }}
                        className="w-[350px] sm:w-[400px] h-[500px] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
                                    <Bot className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white leading-none">Style Advisor</h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] text-slate-400 font-medium">Local Grok Engine Active</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                        >
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-400'
                                            }`}>
                                            {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                                        </div>
                                        <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-primary text-white rounded-tr-none shadow-lg'
                                            : 'bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-tl-none shadow-sm'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                                        <span className="text-xs text-slate-400 italic">Grok is thinking...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about styles, barbers..."
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={isLoading || !input.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl disabled:opacity-50 disabled:grayscale hover:scale-105 active:scale-95 transition-all shadow-lg"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-center text-slate-600 mt-3 font-medium">
                                Free high-performance local AI. Powered by your device.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
