import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';

export const PricingTiers: React.FC = () => {
  const [isYearly, setIsYearly] = useState(true);

  const tiers = [
    {
      name: 'Corridor Starter',
      priceMonthly: 1200,
      priceYearly: 960,
      description: 'Everything you need to launch intelligent pre-buys on core domestic corridors.',
      features: [
        'Up to $50,000 Hard Budget Cap',
        'LightGBM P10/P50 Demand Quantiles',
        'Look-to-Book (L2B) Ratio Analytics',
        'Basic Booking Pacing Dashboard',
        'Email & Slack Support',
      ],
      isPopular: false,
      ctaText: 'Get Started',
    },
    {
      name: 'Enterprise Optimizer',
      priceMonthly: 2800,
      priceYearly: 2240,
      description: 'Advanced optimization designed specifically for multi-destination travel wholesalers.',
      features: [
        'Up to $500,000 Hard Budget Cap',
        'Full PuLP MILP Budget Optimizer',
        '2,000-run Monte Carlo Simulation & Risk Dial',
        'TreeSHAP Attribution Reason Cards',
        'Automated Dynamic Markdown Clearance',
        'Closed-Loop Feature Store Retraining',
      ],
      isPopular: true,
      ctaText: 'Start 14-Day Free Trial',
    },
    {
      name: 'Global Sovereign',
      priceMonthly: 5500,
      priceYearly: 4400,
      description: 'Custom infrastructure built for high-throughput global bedbanks and OTAs.',
      features: [
        'Unlimited Budget Allocation Cap',
        'Direct Extranet & GDS API Sync',
        'Custom Elasticity & Pricing Webhooks',
        'Dedicated ML Quant Support',
        'Custom Loss Function Tuning',
        'SLA 99.95% Guaranteed Uptime',
      ],
      isPopular: false,
      ctaText: 'Contact Enterprise Desk',
    },
  ];

  return (
    <section className="w-full bg-white text-slate-900 py-24 px-6 md:px-12 border-t border-slate-200/60">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
        
        {/* Section Heading in Editorial Serif */}
        <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-slate-900 max-w-3xl leading-[1.1] mb-5">
          Simple plans. Maximum capital efficiency.
        </h2>
        
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed mb-10">
          Scale your procurement intelligence as your travel inventory commitments expand.
        </p>

        {/* Monthly / Yearly Toggle (Matching Video 00:21) */}
        <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-full border border-slate-200 mb-16 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-4 py-1.5 rounded-full transition ${
              !isYearly ? 'bg-white text-slate-900 shadow-sm font-bold' : 'hover:text-slate-900'
            }`}
          >
            Monthly
          </button>
          
          <button
            onClick={() => setIsYearly(true)}
            className={`px-4 py-1.5 rounded-full transition flex items-center gap-1.5 ${
              isYearly ? 'bg-slate-900 text-white shadow-sm font-bold' : 'hover:text-slate-900'
            }`}
          >
            <span>Yearly</span>
            <span className="text-[10px] bg-cyan-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full">
              SAVE 20%
            </span>
          </button>
        </div>

        {/* 3 Tier Cards Grid (Matching Video 00:20 - 00:22) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
          {tiers.map((tier, idx) => {
            const price = isYearly ? tier.priceYearly : tier.priceMonthly;

            return (
              <div
                key={idx}
                className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  tier.isPopular
                    ? 'bg-[#0f172a] text-white shadow-2xl scale-100 md:scale-105 border border-slate-700 relative'
                    : 'bg-[#f8fafc] text-slate-900 border border-slate-200/80 shadow-xs'
                }`}
              >
                <div>
                  {/* Popular Badge */}
                  {tier.isPopular && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-4">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </div>
                  )}

                  <h3 className={`text-xl font-bold mb-2 ${tier.isPopular ? 'text-white' : 'text-slate-900'}`}>
                    {tier.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 my-4">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                      ${price.toLocaleString()}
                    </span>
                    <span className={`text-xs ${tier.isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                      / month {isYearly && '(billed yearly)'}
                    </span>
                  </div>

                  <p className={`text-xs leading-relaxed mb-6 ${tier.isPopular ? 'text-slate-300' : 'text-slate-500'}`}>
                    {tier.description}
                  </p>

                  {/* Feature List */}
                  <div className={`pt-6 border-t space-y-3 mb-8 ${tier.isPopular ? 'border-slate-800' : 'border-slate-200'}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider ${tier.isPopular ? 'text-slate-400' : 'text-slate-400'}`}>
                      Includes:
                    </p>
                    {tier.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs">
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tier.isPopular ? 'text-cyan-400' : 'text-blue-600'}`} />
                        <span className={tier.isPopular ? 'text-slate-200' : 'text-slate-700'}>
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className={`w-full py-3 rounded-full font-bold text-xs sm:text-sm transition-all duration-200 shadow-sm ${
                    tier.isPopular
                      ? 'bg-white hover:bg-slate-100 text-slate-950 shadow-md'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {tier.ctaText}
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
