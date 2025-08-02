// Expert Card Component
const ExpertCard = ({ name, title }: { name: string; title: string }) => (
  <div className="bg-black/5 border border-black/20 rounded-2xl p-4">
    <h4 className="font-primary font-semibold text-sm text-black mb-1">
      {name}
    </h4>
    <p className="font-secondary text-xs text-gray-600">
      {title}
    </p>
  </div>
);

export default function ExpertList() {
  return (
    <div className="h-full flex gap-4">
      {/* Column 1 */}
      <div className="bg-white rounded-t-2xl shadow-sm flex-1 flex flex-col">
        <div className="px-4 py-5">
          <h3 className="font-primary font-semibold text-sm text-black mb-4">
            Experts Identified
          </h3>
          <hr className="border-0 border-t border-gray-800" />
        </div>
        
        {/* Expert Cards */}
        <div className="px-4 pb-4 flex-1 space-y-3">
          <ExpertCard name="Johnny Teunissen" title="Senior Software Engineer at Expion Health" />
          <ExpertCard name="Sarah Chen" title="Principal Data Scientist at HealthTech Solutions" />
          <ExpertCard name="Michael Rodriguez" title="VP of Engineering at MedDevice Inc" />
          <ExpertCard name="Emily Zhang" title="Head of AI Research at BioInnovations" />
          <ExpertCard name="David Thompson" title="Senior Product Manager at HealthOS" />
        </div>
      </div>
      
      {/* Column 2 */}
      <div className="bg-white rounded-t-2xl shadow-sm flex-1 flex flex-col">
        <div className="px-4 py-5">
          <h3 className="font-primary font-semibold text-sm text-black mb-4">
            Outreach
          </h3>
          <hr className="border-0 border-t border-gray-800" />
        </div>
        
        {/* Cards container */}
        <div className="px-4 pb-4 flex-1 space-y-3">
          {/* Cards will go here */}
        </div>
      </div>
      
      {/* Column 3 */}
      <div className="bg-white rounded-t-2xl shadow-sm flex-1 flex flex-col">
        <div className="px-4 py-5">
          <h3 className="font-primary font-semibold text-sm text-black mb-4">
            Book an insight call
          </h3>
          <hr className="border-0 border-t border-gray-800" />
        </div>
        
        {/* Cards container */}
        <div className="px-4 pb-4 flex-1 space-y-3">
          {/* Cards will go here */}
        </div>
      </div>
      
      {/* Column 4 */}
      <div className="bg-white rounded-t-2xl shadow-sm flex-1 flex flex-col">
        <div className="px-4 py-5">
          <h3 className="font-primary font-semibold text-sm text-black mb-4">
            Received Insights
          </h3>
          <hr className="border-0 border-t border-gray-800" />
        </div>
        
        {/* Cards container */}
        <div className="px-4 pb-4 flex-1 space-y-3">
          {/* Cards will go here */}
        </div>
      </div>
    </div>
  );
} 