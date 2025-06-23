"use client";

export function HeroVideo() {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#13aece] to-[#13AECE] opacity-90"></div>

      {/* Animated Code Simulation */}
      <div className="absolute inset-0 p-6 text-green-400 font-mono text-sm overflow-hidden">
        <div className="space-y-2 animate-pulse">
          <div className="text-blue-300">
            // Building scalable backend systems
          </div>
          <div className="text-white">const server = express();</div>
          <div className="text-yellow-300">app.use('/api', routes);</div>
          <div className="text-green-300">server.listen(3000);</div>
          <div className="text-purple-300">
            console.log('Server running...');
          </div>
          <div className="mt-4 text-blue-300">// Database connection</div>
          <div className="text-white">mongoose.connect(DB_URL);</div>
          <div className="text-green-300">✓ Connected to MongoDB</div>
          <div className="mt-4 text-orange-300">// API endpoints ready</div>
          <div className="text-white">GET /api/users ✓</div>
          <div className="text-white">POST /api/auth ✓</div>
          <div className="text-white">PUT /api/projects ✓</div>
        </div>
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
    </div>
  );
}
