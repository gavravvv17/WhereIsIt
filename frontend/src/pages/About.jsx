import React from 'react';
import {
  Luggage,
  Sparkles,
  Search,
  MapPin,
  Layers,
  Info
} from 'lucide-react';

const About = () => {
  return (
    <div className="space-y-8 pb-16 md:pb-8 font-sans w-full">
      {/* Header */}
      <div className="border-b border-theme-border pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary-text">About WhereIsIt</h1>
        <p className="text-sm text-secondary-text mt-1">Learn more about your smart packing and item-tracking assistant.</p>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-soft-mint to-white border border-theme-border rounded-[18px] shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-green text-white rounded-[16px] flex items-center justify-center text-3xl font-black shadow-md shrink-0">
          ✈️
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-black text-dark-green">WhereIsIt</h2>
          <p className="text-sm md:text-base text-primary-text font-medium leading-relaxed">
            WhereIsIt is a comprehensive smart packing assistant designed to simplify your travel preparation. 
            It helps you compile personalized packing lists, remembers exactly where you stored your belongings 
            within your bags, and uses AI to recommend travel essentials.
          </p>

        </div>
      </div>

      {/* Core Features Grid */}
      <div className="space-y-4">
        <h3 className="font-bold text-dark-green uppercase tracking-wider text-xs flex items-center gap-2 px-1">
          <Layers size={14} />
          Core Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              icon: Luggage,
              title: "Trip Management",
              desc: "Create and organize packing lists customized for different trips, including destination details, travel dates, and category-wise checklists."
            },
            {
              icon: MapPin,
              title: "Location Memory (WhereIsIt)",
              desc: "Map items to hierarchical storage locations (e.g., 'Main Case > Front Pocket'). Never rummage blindly through your luggage again."
            },
            {
              icon: Sparkles,
              title: "AI Packing Assistant",
              desc: "Get context-aware packing suggestions tailored to your travel destination, duration, weather forecasts, and activity types."
            },
            {
              icon: Search,
              title: "Instant Search",
              desc: "Find which suitcase, pocket, or bag contains a specific item in seconds with a fast, responsive global item finder."
            }
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-theme-border rounded-[18px] p-5 shadow-2xs hover:shadow-soft transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-soft-mint text-dark-green rounded-[12px] flex items-center justify-center shrink-0 group-hover:bg-primary-green group-hover:text-white transition-colors duration-300">
                  <Icon size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-primary-text">{title}</h4>
                  <p className="text-xs leading-relaxed text-secondary-text">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Info Footnote */}
      <div className="bg-soft-mint border border-primaryGreen/20 rounded-[18px] p-5 flex items-center gap-3">
        <Info className="text-dark-green shrink-0" size={20} />
        <p className="text-xs text-dark-green font-medium">
          WhereIsIt is open source and designed to make preparation for your next adventure stress-free. Happy packing!
        </p>
      </div>
    </div>
  );
};

export default About;
