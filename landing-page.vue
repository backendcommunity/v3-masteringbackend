<template>
  <div class="min-h-screen bg-white">
    <!-- Navigation -->
    <nav class="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">MB</span>
            </div>
            <span class="text-xl font-bold text-gray-900">Masteringbackend</span>
          </div>
          <div class="hidden md:flex items-center space-x-8">
            <a href="#learn" class="text-gray-600 hover:text-gray-900 transition-colors">Learn</a>
            <a href="#build" class="text-gray-600 hover:text-gray-900 transition-colors">Build</a>
            <a href="#grow" class="text-gray-600 hover:text-gray-900 transition-colors">Grow</a>
            <a href="#community" class="text-gray-600 hover:text-gray-900 transition-colors">Community</a>
            <button class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all">
              Get Started
            </button>
          </div>
          <button class="md:hidden">
            <Menu class="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h1 class="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your
            <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Backend Career
            </span>
          </h1>
          <p class="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            We don't just sell courses. We transform careers. Master backend development through our proven 
            <strong>Learn → Build → Grow</strong> methodology and land your dream job.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all transform hover:scale-105">
              Start Your Transformation
            </button>
            <button class="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Play class="w-5 h-5" />
              <span>Watch Success Stories</span>
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-900 mb-2">10K+</div>
            <div class="text-gray-600">Careers Transformed</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-900 mb-2">95%</div>
            <div class="text-gray-600">Job Placement Rate</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-900 mb-2">500+</div>
            <div class="text-gray-600">Real Projects</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-900 mb-2">24/7</div>
            <div class="text-gray-600">Community Support</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why We're Different -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-gray-900 mb-6">Why We're Different</h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            Other platforms sell courses. We sell career transformation. Here's how we do it differently.
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div class="space-y-8">
              <div class="flex items-start space-x-4">
                <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <X class="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">Traditional Platforms</h3>
                  <p class="text-gray-600">Sell courses → You're on your own → Hope for the best</p>
                </div>
              </div>
              <div class="flex items-start space-x-4">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check class="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">Masteringbackend</h3>
                  <p class="text-gray-600">Complete transformation → Practical experience → Job placement → Ongoing support</p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-white p-8 rounded-2xl shadow-lg">
            <h3 class="text-2xl font-bold text-gray-900 mb-6">Our Success Formula</h3>
            <div class="space-y-4">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <span class="text-gray-700">Structured Learning Path</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span class="text-purple-600 font-semibold text-sm">2</span>
                </div>
                <span class="text-gray-700">Real-World Projects</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span class="text-green-600 font-semibold text-sm">3</span>
                </div>
                <span class="text-gray-700">Interview Preparation</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span class="text-orange-600 font-semibold text-sm">4</span>
                </div>
                <span class="text-gray-700">Career Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Three Key Flows -->
    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-gray-900 mb-6">Your Complete Transformation Journey</h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            Follow our proven three-step methodology to go from beginner to job-ready backend engineer
          </p>
        </div>

        <!-- Flow 1: Learn -->
        <div id="learn" class="mb-20">
          <div class="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div class="flex items-center space-x-3 mb-6">
                <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen class="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <span class="text-blue-600 font-semibold text-sm uppercase tracking-wide">Step 1</span>
                  <h3 class="text-3xl font-bold text-gray-900">Learn & Master</h3>
                </div>
              </div>
              <p class="text-xl text-gray-600 mb-8">
                Start with structured learning through our comprehensive training programs designed by industry experts.
              </p>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <Video class="w-8 h-8 text-blue-600 mb-2" />
                  <h4 class="font-semibold text-gray-900 mb-1">Courses</h4>
                  <p class="text-sm text-gray-600">In-depth video courses</p>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <Zap class="w-8 h-8 text-blue-600 mb-2" />
                  <h4 class="font-semibold text-gray-900 mb-1">Bootcamps</h4>
                  <p class="text-sm text-gray-600">Intensive training programs</p>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <Map class="w-8 h-8 text-blue-600 mb-2" />
                  <h4 class="font-semibold text-gray-900 mb-1">Roadmaps</h4>
                  <p class="text-sm text-gray-600">Clear learning paths</p>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <Target class="w-8 h-8 text-blue-600 mb-2" />
                  <h4 class="font-semibold text-gray-900 mb-1">Paths</h4>
                  <p class="text-sm text-gray-600">Specialized tracks</p>
                </div>
              </div>
            </div>
            <div class="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
              <div class="bg-white p-6 rounded-xl shadow-sm mb-4">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="font-semibold text-gray-900">Python Backend Mastery</h4>
                  <span class="text-sm text-green-600 font-medium">92% Complete</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div class="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" style="width: 92%"></div>
                </div>
                <div class="flex items-center space-x-4 text-sm text-gray-600">
                  <span>45 Lessons</span>
                  <span>•</span>
                  <span>12 Projects</span>
                  <span>•</span>
                  <span>8 Quizzes</span>
                </div>
              </div>
              <div class="text-center">
                <p class="text-gray-600 mb-4">Next: Advanced Database Design</p>
                <button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Continue Learning
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Flow 2: Build/Apply -->
        <div id="build" class="mb-20">
          <div class="grid lg:grid-cols-2 gap-12 items-center">
            <div class="order-2 lg:order-1 bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl">
              <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-white p-4 rounded-xl shadow-sm">
                  <h4 class="font-semibold text-gray-900 mb-2">E-commerce API</h4>
                  <p class="text-sm text-gray-600 mb-3">Full-stack marketplace</p>
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span class="text-xs text-green-600">Completed</span>
                  </div>
                </div>
                <div class="bg-white p-4 rounded-xl shadow-sm">
                  <h4 class="font-semibold text-gray-900 mb-2">Chat System</h4>
                  <p class="text-sm text-gray-600 mb-3">Real-time messaging</p>
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span class="text-xs text-blue-600">In Progress</span>
                  </div>
                </div>
              </div>
              <div class="text-center">
                <p class="text-gray-600 mb-4">Build real-world projects that matter</p>
                <button class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  View All Projects
                </button>
              </div>
            </div>
            <div class="order-1 lg:order-2">
              <div class="flex items-center space-x-3 mb-6">
                <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Code class="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <span class="text-purple-600 font-semibold text-sm uppercase tracking-wide">Step 2</span>
                  <h3 class="text-3xl font-bold text-gray-900">Build & Apply</h3>
                </div>
              </div>
              <p class="text-xl text-gray-600 mb-8">
                Put your knowledge into practice with real-world projects and gain the experience employers want to see.
              </p>
              <div class="grid grid-cols-1 gap-4">
                <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div class="flex items-center space-x-3">
                    <Folder class="w-8 h-8 text-purple-600" />
                    <div>
                      <h4 class="font-semibold text-gray-900">MB Projects</h4>
                      <p class="text-sm text-gray-600">Industry-standard projects with real requirements</p>
                    </div>
                  </div>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div class="flex items-center space-x-3">
                    <Calendar class="w-8 h-8 text-purple-600" />
                    <div>
                      <h4 class="font-semibold text-gray-900">Project30</h4>
                      <p class="text-sm text-gray-600">30-day intensive project challenges</p>
                    </div>
                  </div>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div class="flex items-center space-x-3">
                    <Globe class="w-8 h-8 text-purple-600" />
                    <div>
                      <h4 class="font-semibold text-gray-900">MB Lands</h4>
                      <p class="text-sm text-gray-600">Deploy and showcase your projects</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Flow 3: Grow -->
        <div id="grow">
          <div class="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div class="flex items-center space-x-3 mb-6">
                <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp class="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <span class="text-green-600 font-semibold text-sm uppercase tracking-wide">Step 3</span>
                  <h3 class="text-3xl font-bold text-gray-900">Grow & Succeed</h3>
                </div>
              </div>
              <p class="text-xl text-gray-600 mb-8">
                Get job-ready with interview preparation, certifications, and ongoing career support from our community.
              </p>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <Briefcase class="w-8 h-8 text-green-600 mb-2" />
                  <h4 class="font-semibold text-gray-900 mb-1">MB Interviews</h4>
                  <p class="text-sm text-gray-600">Project-based interview prep</p>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <MessageCircle class="w-8 h-8 text-green-600 mb-2" />
                  <h4 class="font-semibold text-gray-900 mb-1">Mock Interviews</h4>
                  <p class="text-sm text-gray-600">Practice with real scenarios</p>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <Award class="w-8 h-8 text-green-600 mb-2" />
                  <h4 class="font-semibold text-gray-900 mb-1">Certifications</h4>
                  <p class="text-sm text-gray-600">Industry-recognized credentials</p>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <Users class="w-8 h-8 text-green-600 mb-2" />
                  <h4 class="font-semibold text-gray-900 mb-1">Community</h4>
                  <p class="text-sm text-gray-600">Lifelong network support</p>
                </div>
              </div>
            </div>
            <div class="bg-gradient-to-br from-green-50 to-blue-50 p-8 rounded-2xl">
              <div class="bg-white p-6 rounded-xl shadow-sm mb-4">
                <h4 class="font-semibold text-gray-900 mb-4">Interview Success Rate</h4>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-gray-600">Technical Interviews</span>
                  <span class="text-sm font-medium text-green-600">94%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div class="bg-green-500 h-2 rounded-full" style="width: 94%"></div>
                </div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-gray-600">System Design</span>
                  <span class="text-sm font-medium text-green-600">89%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-green-500 h-2 rounded-full" style="width: 89%"></div>
                </div>
              </div>
              <div class="text-center">
                <p class="text-gray-600 mb-4">Ready for your dream job?</p>
                <button class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Start Interview Prep
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Technology Tracks -->
    <section class="py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-gray-900 mb-6">Choose Your Technology Track</h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            Each track follows our proven Learn → Build → Grow methodology tailored to your chosen technology
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Python Track -->
          <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div class="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <span class="text-2xl font-bold text-blue-600">Py</span>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Python Backend</h3>
            <p class="text-gray-600 mb-6">Master Django, FastAPI, and Python ecosystem</p>
            
            <div class="space-y-3 mb-6">
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-blue-600 text-xs font-bold">1</span>
                </div>
                <span class="text-sm text-gray-700">Learn Django & FastAPI</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <span class="text-purple-600 text-xs font-bold">2</span>
                </div>
                <span class="text-sm text-gray-700">Build REST APIs & Microservices</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span class="text-green-600 text-xs font-bold">3</span>
                </div>
                <span class="text-sm text-gray-700">Practice Python interviews</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <span class="text-orange-600 text-xs font-bold">4</span>
                </div>
                <span class="text-sm text-gray-700">Join Python community</span>
              </div>
            </div>
            
            <button class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Start Python Track
            </button>
          </div>

          <!-- JavaScript Track -->
          <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div class="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
              <span class="text-2xl font-bold text-yellow-600">JS</span>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">JavaScript Backend</h3>
            <p class="text-gray-600 mb-6">Master Node.js, Express, and modern JS</p>
            
            <div class="space-y-3 mb-6">
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-blue-600 text-xs font-bold">1</span>
                </div>
                <span class="text-sm text-gray-700">Learn Node.js & Express</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <span class="text-purple-600 text-xs font-bold">2</span>
                </div>
                <span class="text-sm text-gray-700">Build GraphQL & REST APIs</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span class="text-green-600 text-xs font-bold">3</span>
                </div>
                <span class="text-sm text-gray-700">Practice JS interviews</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <span class="text-orange-600 text-xs font-bold">4</span>
                </div>
                <span class="text-sm text-gray-700">Join JS community</span>
              </div>
            </div>
            
            <button class="w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 transition-colors">
              Start JavaScript Track
            </button>
          </div>

          <!-- Java Track -->
          <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div class="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mb-6">
              <span class="text-2xl font-bold text-red-600">Java</span>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Java Backend</h3>
            <p class="text-gray-600 mb-6">Master Spring Boot and enterprise Java</p>
            
            <div class="space-y-3 mb-6">
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-blue-600 text-xs font-bold">1</span>
                </div>
                <span class="text-sm text-gray-700">Learn Spring Boot & JPA</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <span class="text-purple-600 text-xs font-bold">2</span>
                </div>
                <span class="text-sm text-gray-700">Build enterprise applications</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span class="text-green-600 text-xs font-bold">3</span>
                </div>
                <span class="text-sm text-gray-700">Practice Java interviews</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <span class="text-orange-600 text-xs font-bold">4</span>
                </div>
                <span class="text-sm text-gray-700">Join Java community</span>
              </div>
            </div>
            
            <button class="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors">
              Start Java Track
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Success Stories -->
    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-gray-900 mb-6">Success Stories</h2>
          <p class="text-xl text-gray-600">Real transformations from our community</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="bg-white p-8 rounded-2xl shadow-lg">
            <div class="flex items-center space-x-4 mb-6">
              <div class="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span class="text-white font-bold">SA</span>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900">Sarah Ahmed</h4>
                <p class="text-sm text-gray-600">Software Engineer at Google</p>
              </div>
            </div>
            <p class="text-gray-600 mb-4">
              "Masteringbackend didn't just teach me to code - they transformed my entire career. The real-world projects and interview prep made all the difference."
            </p>
            <div class="flex items-center space-x-2 text-sm text-gray-500">
              <span>Python Track</span>
              <span>•</span>
              <span>6 months</span>
            </div>
          </div>

          <div class="bg-white p-8 rounded-2xl shadow-lg">
            <div class="flex items-center space-x-4 mb-6">
              <div class="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                <span class="text-white font-bold">MJ</span>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900">Michael Johnson</h4>
                <p class="text-sm text-gray-600">Senior Developer at Netflix</p>
              </div>
            </div>
            <p class="text-gray-600 mb-4">
              "The community support and practical projects set Masteringbackend apart. I went from zero to senior developer in 18 months."
            </p>
            <div class="flex items-center space-x-2 text-sm text-gray-500">
              <span>JavaScript Track</span>
              <span>•</span>
              <span>18 months</span>
            </div>
          </div>

          <div class="bg-white p-8 rounded-2xl shadow-lg">
            <div class="flex items-center space-x-4 mb-6">
              <div class="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <span class="text-white font-bold">EP</span>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900">Emily Park</h4>
                <p class="text-sm text-gray-600">Backend Lead at Stripe</p>
              </div>
            </div>
            <p class="text-gray-600 mb-4">
              "The interview preparation was incredible. I felt confident in every technical interview and landed my dream job at Stripe."
            </p>
            <div class="flex items-center space-x-2 text-sm text-gray-500">
              <span>Java Track</span>
              <span>•</span>
              <span>8 months</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Community Section -->
    <section id="community" class="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-4xl font-bold text-white mb-6">Join Our Thriving Community</h2>
        <p class="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
          Connect with thousands of backend developers, get help when you need it, and celebrate your wins together.
        </p>

        <div class="grid md:grid-cols-4 gap-8 mb-12">
          <div class="text-center">
            <div class="text-3xl font-bold text-white mb-2">50K+</div>
            <div class="text-blue-100">Active Members</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-white mb-2">24/7</div>
            <div class="text-blue-100">Community Support</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-white mb-2">1K+</div>
            <div class="text-blue-100">Weekly Discussions</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-white mb-2">100+</div>
            <div class="text-blue-100">Expert Mentors</div>
          </div>
        </div>

        <button class="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all transform hover:scale-105">
          Join the Community
        </button>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-4xl font-bold text-gray-900 mb-6">Ready to Transform Your Career?</h2>
        <p class="text-xl text-gray-600 mb-12">
          Join thousands of developers who have successfully transformed their careers with Masteringbackend.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <button class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all transform hover:scale-105">
            Start Your Journey Today
          </button>
          <button class="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors px-8 py-4">
            <MessageCircle class="w-5 h-5" />
            <span>Talk to Our Team</span>
          </button>
        </div>

        <p class="text-sm text-gray-500">
          30-day money-back guarantee • No long-term contracts • Cancel anytime
        </p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div class="flex items-center space-x-2 mb-4">
              <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">MB</span>
              </div>
              <span class="text-xl font-bold">Masteringbackend</span>
            </div>
            <p class="text-gray-400 mb-4">
              Transform your backend development career with our proven methodology.
            </p>
            <div class="flex space-x-4">
              <div class="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                <span class="text-sm">𝕏</span>
              </div>
              <div class="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                <span class="text-sm">in</span>
              </div>
              <div class="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                <span class="text-sm">YT</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 class="font-semibold mb-4">Learn</h4>
            <ul class="space-y-2 text-gray-400">
              <li><a href="#" class="hover:text-white transition-colors">Courses</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Bootcamps</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Roadmaps</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Paths</a></li>
            </ul>
          </div>
          
          <div>
            <h4 class="font-semibold mb-4">Build</h4>
            <ul class="space-y-2 text-gray-400">
              <li><a href="#" class="hover:text-white transition-colors">MB Projects</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Project30</a></li>
              <li><a href="#" class="hover:text-white transition-colors">MB Lands</a></li>
            </ul>
          </div>
          
          <div>
            <h4 class="font-semibold mb-4">Grow</h4>
            <ul class="space-y-2 text-gray-400">
              <li><a href="#" class="hover:text-white transition-colors">MB Interviews</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Mock Interviews</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Certifications</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Community</a></li>
            </ul>
          </div>
        </div>
        
        <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p class="text-gray-400 text-sm">
            © 2024 Masteringbackend. All rights reserved.
          </p>
          <div class="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
            <a href="#" class="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" class="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" class="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { 
  Menu, Play, BookOpen, Video, Zap, Map, Target, Code, Folder, Calendar, Globe,
  TrendingUp, Briefcase, MessageCircle, Award, Users, Check, X
} from 'lucide-vue-next'
</script>

<style scoped>
/* Custom scrollbar for better UX */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

/* Animation for hover effects */
.transform {
  transition: transform 0.2s ease-in-out;
}

.hover\:scale-105:hover {
  transform: scale(1.05);
}
</style>
