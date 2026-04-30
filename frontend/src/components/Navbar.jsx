import { Link } from 'react-router'

const Navbar = () => {
    return (
      <header className="fixed w-full z-50 bg-white/70 backdrop-blur shadow-sm border-b border-gray-200">
        <div className=" px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Synx
              </h1>
              <p className="text-gray-600 mt-1">Your AI-powered music companion</p>
            </div>
            <Link to="/songs" className="group inline-block px-4 py-2 mr-40 rounded-full text-sm font-bold text-primary transition-all duration-500 ease-in-out hover:bg-third hover:text-gray-100">
              <span className="text-lg">Home</span>
            </Link>
            <Link to="/songs" className="group inline-block px-4 py-2 rounded-full text-sm font-bold text-primary transition-all duration-500 ease-in-out hover:bg-third hover:text-gray-100">
              <span className="text-lg">Sign Up</span>
            </Link>
          </div>
        </div>
      </header>
    )
}

export default Navbar