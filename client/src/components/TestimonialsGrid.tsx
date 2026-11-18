export const TestimonialsGrid: React.FC = () => {
  const testimonials = [
    {
      quote:
        'TBO Optima completely transformed how we approach forward hotel commitments. The LightGBM quantile sizing alone prevented over $120,000 in perishable stockout losses during peak Q4.',
      name: 'Elena Rostova',
      role: 'VP of Global Hotel Sourcing',
      company: 'Northstar Travel Group',
    },
    {
      quote:
        'The TreeSHAP Reason Cards are the breakthrough. Our procurement managers won’t touch black-box recommendations, but seeing exact feature attribution gave us the confidence to approve pre-buys within minutes.',
      name: 'Rachel Adams',
      role: 'Director of Revenue Management',
      company: 'Horizon Bedbank',
    },
    {
      quote:
        'Having the 2,000-run Monte Carlo risk check directly connected to our hard budget caps gives our executive committee complete peace of mind. We maintain a sub-45 Risk Dial while expanding into new corridors.',
      name: 'James Miller',
      role: 'Chief Commercial Officer',
      company: 'Vanguard Destinations',
    },
    {
      quote:
        'The closed-loop pacing curve and dynamic markdown triggers eliminated unsold room distress. When demand lagged on Goa inventory at T-14d, the automated clearance sold out all 35 rooms with positive margin.',
      name: 'Sophia Carter',
      role: 'Head of Distribution Intelligence',
      company: 'Forma Digital Travel',
    },
  ];

  return (
    <section className="w-full bg-[#f8fafc] text-slate-900 py-24 px-6 md:px-12 border-t border-slate-200/60">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
        
        {/* Section Heading in Editorial Serif */}
        <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-slate-900 max-w-3xl leading-[1.1] mb-5">
          Less stockouts. Higher gross margins.
        </h2>
        
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed mb-16">
          See how leading travel distributors, OTA networks, and wholesale aggregators maximize capital efficiency with TBO Optima.
        </p>

        {/* Testimonial Cards Grid (Matching Video 00:19) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col justify-between"
            >
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{t.name}</h4>
                  <p className="text-[11px] text-slate-400">{t.role} • {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
