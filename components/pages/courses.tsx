const CoursesPage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Courses</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Mobile-friendly search and filters */}
        <input type="text" placeholder="Search courses..." className="border p-2 rounded w-full sm:w-1/2" />
        <select className="border p-2 rounded w-full sm:w-1/4">
          <option>All Categories</option>
          <option>Web Development</option>
          <option>Data Science</option>
          <option>Mobile Development</option>
        </select>
        <select className="border p-2 rounded w-full sm:w-1/4">
          <option>All Levels</option>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Course cards */}
        <div className="card-hover mobile-padding border rounded p-4 shadow-md">
          <h2 className="text-lg font-semibold mb-2">Course Title 1</h2>
          <p className="text-gray-600">Course description goes here.</p>
          <div className="mobile-button-group mt-4 flex justify-between">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              View Details
            </button>
            <span className="text-green-500 font-bold">$99</span>
          </div>
        </div>

        <div className="card-hover mobile-padding border rounded p-4 shadow-md">
          <h2 className="text-lg font-semibold mb-2">Course Title 2</h2>
          <p className="text-gray-600">Course description goes here.</p>
          <div className="mobile-button-group mt-4 flex justify-between">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              View Details
            </button>
            <span className="text-green-500 font-bold">$149</span>
          </div>
        </div>

        <div className="card-hover mobile-padding border rounded p-4 shadow-md">
          <h2 className="text-lg font-semibold mb-2">Course Title 3</h2>
          <p className="text-gray-600">Course description goes here.</p>
          <div className="mobile-button-group mt-4 flex justify-between">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              View Details
            </button>
            <span className="text-green-500 font-bold">$79</span>
          </div>
        </div>
      </div>

      {/* Mobile specific content */}
      <div className="mobile-content">
        <div className="mobile-form">{/* Mobile form elements can be placed here */}</div>
      </div>

      <div className="mobile-grid">{/* Mobile grid layout can be defined here */}</div>
    </div>
  )
}

export default CoursesPage
