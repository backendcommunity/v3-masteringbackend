import type React from "react"

const CommunityPage: React.FC = () => {
  return (
    <div className="mobile-content">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-semibold mb-4">Community</h1>

        {/* Navigation and Filters */}
        <div className="mb-6 mobile-form">
          {/* Example Filters - Replace with actual filter components */}
          <input type="text" placeholder="Search..." className="w-full p-2 border rounded mb-2" />
          <select className="w-full p-2 border rounded">
            <option>Sort by: Newest</option>
            <option>Sort by: Popular</option>
          </select>
        </div>

        {/* Post Grid */}
        <div className="space-y-4 sm:space-y-6">
          {/* Example Community Cards - Replace with actual data */}
          <div className="mobile-padding card-hover bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-2">Post Title 1</h2>
            <p className="text-gray-700">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua.
            </p>
            <div className="mt-2">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                View Post
              </button>
            </div>
          </div>

          <div className="mobile-padding card-hover bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-2">Post Title 2</h2>
            <p className="text-gray-700">
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
              consequat.
            </p>
            <div className="mt-2">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                View Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommunityPage
