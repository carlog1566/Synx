import { Link } from 'react-router'

const Navbar = () => {
    return (
      <header className="fixed w-full z-50 bg-white/70 backdrop-blur shadow-sm border-b border-gray-200">
        <div className=" px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
             
            {/* Name */}
            <div>
              <h1 className="text-4xl pb-1 font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                <Link to="/">
                  Synx
                </Link>
              </h1>
              <p className="text-gray-600 mt-1">
                Your AI-powered music companion
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="mr-10">
              <Link to="/" className="group inline-block px-4 py-2 mx-1 rounded-full text-sm font-bold text-primary transition-all duration-300 ease-in-out hover:bg-third hover:text-white">
                <span className="text-lg">
                  Home
                </span>
              </Link>
              <Link to="/songs" className="group inline-block px-4 py-2 mx-1 rounded-full text-sm font-bold text-primary transition-all duration-300 ease-in-out hover:bg-third hover:text-white">
                <span className="text-lg">
                  Songs
                </span>
              </Link>
            </div>

            {/* Sign In/Up Buttons */}
            <div>
              <Link to="/" className="group inline-block px-4 py-2 mx-1 border border-third rounded-full text-sm font-bold text-primary transition-all duration-300 ease-in-out hover:bg-third hover:text-white">
                <span className="text-lg">
                  Sign In
                </span>
              </Link>
              <Link to="/" className="group inline-block px-4 py-2 mx-1 rounded-full text-sm font-bold bg-third text-white transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105">
                <span className="text-lg">
                  Sign Up
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>
    )
}

export default Navbar