import { Link } from 'react-router'
import HomeCard from '../components/HomeCard'

const HomePage = () => {
    return (
        <div className="mb-8">
            {/* Hero Section */}
            <div className="container mx-auto px-4 pt-10 pb-32">
                <div className="text-center max-w-4xl mx-auto">
                
                    {/* Headline */}
                    <h1 className="text-6xl pb-3 md:text-7xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
                        Synx
                    </h1>
                    
                    <p className="text-2xl md:text-3xl text-gray-700 mb-4 font-light">
                        Turn any song into interactive guitar tabs
                    </p>
                    
                    <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
                        Upload your favorite songs and let AI detect chords, generate tabs, 
                        and create an interactive learning experience. Perfect for guitarists 
                        of all levels.
                    </p>
                
                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link to="/songs" className="bg-gradient-to-r from-primary to-third text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300">
                            Get Started - It's Free! →
                        </Link>
                        
                        <a 
                        href="#features"
                        className="bg-white text-gray-800 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-lg transition-all duration-300 border-2 border-gray-200"
                        >
                        Learn More
                        </a>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div id="features" className="bg-white py-20 rounded-3xl scroll-mt-32">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">
                        How It Works
                    </h2>
                
                    <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {/* Feature 1 */}
                        <div className="text-center">
                            <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl">📤</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-gray-800">1. Upload Your Song</h3>
                            <p className="text-gray-600">
                                Drop any MP3 or audio file. We support all common formats.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="text-center">
                            <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl">🤖</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-gray-800">2. AI Chord Detection</h3>
                            <p className="text-gray-600">
                                Our advanced algorithm analyzes the audio and detects chords with high accuracy.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="text-center">
                            <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl">🎵</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-gray-800">3. Interactive Tabs</h3>
                            <p className="text-gray-600">
                                Get professional guitar tabs with chord diagrams, ready to play along.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features List */}
            <div className="bg-white py-20 my-10 rounded-3xl">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">
                        Powerful Features
                    </h2>
                    
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <HomeCard 
                        icon="🎸"
                        title="Multiple Instruments"
                        description="Guitar and ukulele tabs supported, with more coming soon"
                        />
                        <HomeCard 
                        icon="⚡"
                        title="Instant Analysis"
                        description="Chord detection completes in seconds, not minutes"
                        />
                        <HomeCard 
                        icon="📊"
                        title="Chord Progression"
                        description="See the full chord timeline for any song"
                        />
                        <HomeCard 
                        icon="💾"
                        title="Save Your Library"
                        description="Keep all your analyzed songs in one place"
                        />
                        <HomeCard 
                        icon="🎯"
                        title="Beginner Friendly"
                        description="Simple chord diagrams perfect for learning"
                        />
                        <HomeCard 
                        icon="🚀"
                        title="Always Improving"
                        description="Regular updates with new features and better accuracy"
                        />
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-primary via-secondary to-primary py-20 rounded-3xl">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to start learning?
                    </h2>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                        Join musicians who are learning their favorite songs faster with Synx
                    </p>
                    <Link to="/songs" className="inline-block bg-white text-purple-600 px-10 py-4 rounded-full text-lg font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300">
                        Start Analyzing Songs →
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <footer className="text-white pt-16">
                <div className="container mx-auto px-4 text-center">
                    <h3 className="text-2xl font-bold mb-2 text-gray-400">Synx</h3>
                    <p className="text-gray-400 mb-6">
                        AI-powered chord detection and tab generation
                    </p>
                    <div className="text-gray-500 text-sm">
                        © 2026 Synx
                    </div>
                </div>
            </footer>
        </div>
  )
}

export default HomePage