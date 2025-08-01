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
        {/* Content will go here */}
      </div>
      
      {/* Column 2 */}
      <div className="bg-white rounded-t-2xl shadow-sm flex-1 flex flex-col">
        <div className="px-4 py-5">
          <h3 className="font-primary font-semibold text-sm text-black mb-4">
            Outreach
          </h3>
          <hr className="border-0 border-t border-gray-800" />
        </div>
        {/* Content will go here */}
      </div>
      
      {/* Column 3 */}
      <div className="bg-white rounded-t-2xl shadow-sm flex-1 flex flex-col">
        <div className="px-4 py-5">
          <h3 className="font-primary font-semibold text-sm text-black mb-4">
            Book an insight call
          </h3>
          <hr className="border-0 border-t border-gray-800" />
        </div>
        {/* Content will go here */}
      </div>
      
      {/* Column 4 */}
      <div className="bg-white rounded-t-2xl shadow-sm flex-1 flex flex-col">
        <div className="px-4 py-5">
          <h3 className="font-primary font-semibold text-sm text-black mb-4">
            Rejected
          </h3>
          <hr className="border-0 border-t border-gray-800" />
        </div>
        {/* Content will go here */}
      </div>
      
      {/* Column 5 */}
      <div className="bg-white rounded-t-2xl shadow-sm flex-1 flex flex-col">
        <div className="px-4 py-5">
          <h3 className="font-primary font-semibold text-sm text-black mb-4">
            Received Insights
          </h3>
          <hr className="border-0 border-t border-gray-800" />
        </div>
        {/* Content will go here */}
      </div>
    </div>
  );
} 