import type React from "react"

const DashboardContent: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Section */}
      <div className="mobile-stats mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="mobile-padding card-hover bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold">Total Students</h3>
            <p className="text-2xl">1,250</p>
          </div>
          <div className="mobile-padding card-hover bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold">Active Courses</h3>
            <p className="text-2xl">25</p>
          </div>
          <div className="mobile-padding card-hover bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold">New Enrollments</h3>
            <p className="text-2xl">75</p>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="mobile-grid">
        <h2 className="text-2xl font-semibold mb-4">Popular Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="mobile-padding card-hover bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold">Web Development</h3>
            <p className="text-gray-600">Learn to build modern web applications.</p>
          </div>
          <div className="mobile-padding card-hover bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold">Data Science</h3>
            <p className="text-gray-600">Explore the world of data analysis and machine learning.</p>
          </div>
          <div className="mobile-padding card-hover bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold">Mobile App Development</h3>
            <p className="text-gray-600">Create native mobile apps for iOS and Android.</p>
          </div>
        </div>
      </div>

      {/* Announcements Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Announcements</h2>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p>Welcome to the new academic year! Check out the updated course catalog.</p>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
        <div className="mobile-table-wrapper">
          <table className="mobile-table w-full table-auto">
            <thead>
              <tr>
                <th className="text-left">Event</th>
                <th className="text-left">Date</th>
                <th className="text-left">Location</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Orientation Day</td>
                <td>August 28, 2023</td>
                <td>Main Auditorium</td>
              </tr>
              <tr>
                <td>Career Fair</td>
                <td>September 15, 2023</td>
                <td>Student Union</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mobile-button-group flex justify-center space-x-4">
        <button className="nav-item touch-target bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Previous
        </button>
        <button className="nav-item touch-target bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Next
        </button>
      </div>
    </div>
  )
}

export default DashboardContent
