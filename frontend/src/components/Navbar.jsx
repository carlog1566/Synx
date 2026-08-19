import { Link } from 'react-router'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = ({ menuOpen, setMenuOpen}) => {

	useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)')

        const handleChange = (event) => {
            if (event.matches) {
                setMenuOpen(false)
            }
        }

        mediaQuery.addEventListener('change', handleChange)

        return () => {
            mediaQuery.removeEventListener('change', handleChange)
        }
    }, [])

  	const closeMenu = () => { 
		setMenuOpen(false) 
	}

	return (
		<header className="fixed w-full z-50 bg-white/70 backdrop-blur shadow-sm border-b border-gray-200 top-0 left-0">
			<div className=" px-4 sm:px-6 lg:px-8 py-6">
				<div className="flex items-center justify-between">
					{/* Name */}
					<div>
						<h1 className="text-4xl pb-1 font-bold text-transparent">
							<Link to="/" className="bg-gradient-to-r from-primary to-secondary bg-clip-text">
								Synx
							</Link>
						</h1>
						<p className="hidden md:block text-gray-600 mt-1">
							Your AI-powered music companion
						</p>
					</div>

					{/* Navigation Buttons */}
					<div className="mr-10 hidden md:flex">
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
					<div className="hidden md:flex">
						<Link to="/login" className="group inline-block px-4 py-2 mx-1 border border-third rounded-full text-sm font-bold text-primary transition-all duration-300 ease-in-out hover:bg-third hover:text-white">
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

					{/* Mobile Waffle Button */} 
					<motion.button 
						whileTap={{ scale: 0.9 }} 
						whileHover={{ scale: 1.05 }} 
						onClick={() => setMenuOpen(!menuOpen)} 
						className="md:hidden relative w-11 h-11 rounded-full flex items-center justify-center text-primary hover:bg-gray-100 transition-colors" 
						aria-label="Toggle navigation menu" 
						aria-expanded={menuOpen}
					> 
						<motion.div 
							animate={menuOpen ? "open" : "closed"} 
							className="flex flex-col gap-1.5" 
						> 
							<motion.span 
								variants={{ closed: { rotate: 0, y: 0 }, open: { rotate: 45, y: 6 } }} 
								className="block w-6 h-0.5 bg-current rounded-full" 
							/> 
							<motion.span 
								variants={{ closed: { opacity: 1 }, open: { opacity: 0 } }} 
								className="block w-6 h-0.5 bg-current rounded-full" 
							/> 
							<motion.span 
								variants={{ closed: { rotate: 0, y: 0 }, open: { rotate: -45, y: -10 } }} 
								className="block w-6 h-0.5 bg-current rounded-full" 
							/> 
						</motion.div> 
					</motion.button> 
				</div>

				<AnimatePresence> 
					{menuOpen && ( 
						<motion.div 
							initial={{ opacity: 0, height: 0, y: -10 }} 
							animate={{ opacity: 1, height: "auto", y: 0 }} 
							exit={{ opacity: 0, height: 0, y: -10 }} 
							transition={{ duration: 0.3, ease: "easeInOut" }} 
							className="lg:hidden overflow-hidden border-t border-gray-100 my-2" 
						> 
							<motion.div 
								initial="closed" 
								animate="open" 
								className="px-6 py-4 flex flex-col gap-2" 
							> 
								{/* Home */} 
								<motion.div 
									variants={{ closed: { opacity: 0, x: -20 }, 
									open: { opacity: 1, x: 0 } }} 
									transition={{ duration: 0.25 }} 
								> 
									<Link 
										to="/" 
										onClick={closeMenu} 
										className="block px-4 py-3 rounded-xl text-primary font-bold hover:bg-third hover:text-white hover:translate-x-1 transition-all duration-200" 
									> 
										Home 
									</Link> 
								</motion.div> 

								{/* Songs */} 
								<motion.div 
									variants={{ closed: { opacity: 0, x: -20 }, open: { opacity: 1, x: 0 } }} 
									transition={{ duration: 0.25, delay: 0.05 }} 
								> 
									<Link 
										to="/songs" 
										onClick={closeMenu} 
										className="block px-4 py-3 rounded-xl text-primary font-bold hover:bg-third hover:text-white hover:translate-x-1 transition-all duration-200" 
									> 
										Songs 
									</Link> 
								</motion.div> 
								
								{/* Divider */} 
								<motion.div 
									initial={{ opacity: 0 }} 
									animate={{ opacity: 1 }} 
									transition={{ delay: 0.15 }} 
									className="h-px bg-gray-200 my-2" 
								/> 
								
								{/* Sign In */} 
								<motion.div 
									variants={{ closed: { opacity: 0, x: -20 }, 
									open: { opacity: 1, x: 0 } }} 
									transition={{ duration: 0.25, delay: 0.1 }} 
								> 
									<Link 
										to="/" 
										onClick={closeMenu} 
										className="block px-4 py-3 rounded-xl text-primary font-bold border border-third text-center hover:bg-third hover:text-white transition-all duration-200" 
									> 
										Sign In 
									</Link> 
								</motion.div> 
								
								{/* Sign Up */} 
								<motion.div 
									variants={{ closed: { opacity: 0, x: -20 }, open: { opacity: 1, x: 0 } }} 
									transition={{ duration: 0.25, delay: 0.15 }}
								> 
									<Link 
										to="/" 
										onClick={closeMenu} 
										className="block px-4 py-3 rounded-xl bg-third text-white font-bold text-center hover:shadow-lg hover:scale-[1.02] transition-all duration-200" 
									> 
										Sign Up 
									</Link> 
								</motion.div> 
							</motion.div> 
						</motion.div> 
					)} 
				</AnimatePresence>
			</div>
		</header>
	)
}

export default Navbar