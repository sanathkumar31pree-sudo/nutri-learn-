export default function Footer() {
    return (
        <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 mt-auto">
            <div className="max-w-6xl mx-auto px-6 py-10">
                <div className="grid md:grid-cols-3 gap-8 items-start">

                    {/* Branding */}
                    <div>
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shadow-lg">
                                <span className="text-white font-caveat text-base font-bold">N</span>
                            </div>
                            <div>
                                <span className="text-white font-caveat text-lg font-bold">Nutri<span className="text-[#FF8C00]">Learn</span></span>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed text-white/50 font-outfit">
                            A 90-Day Gamified Nutrition Intervention System. Research-grade. Clinically intentional.
                        </p>
                    </div>

                    {/* Tagline */}
                    <div className="md:col-span-2 md:text-right">
                        <p className="text-white/50 text-sm font-outfit">
                            A 90-day gamified nutrition intervention platform.
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-2">
                    <p className="font-mono text-[11px] text-white/30 tracking-wider">
                        © NutriLearn
                    </p>

                </div>
            </div>
        </footer>
    )
}
