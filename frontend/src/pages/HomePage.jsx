import { useRef, useState } from 'react'
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion'
import { FaUpload, FaRobot, FaMusic, FaGuitar, FaBolt, FaChartLine, FaSave, FaBullseye, FaRocket, FaArrowRight } from 'react-icons/fa'
import ChordStrip from '../components/ChordStrip'


const FadeUp = ({ children, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, delay }}
    >
        {children}
    </motion.div>
)


const StepCard = ({ icon: Icon, number, title, description, delay }) => (
    <FadeUp delay={delay}>
        <div className="text-center group">
            <motion.div
                whileHover={{ scale: 1.08, rotate: 3 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="bg-gradient-to-br from-purple-100 to-pink-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:shadow-md transition-shadow"
            >
                <Icon className="text-3xl text-primary" />
            </motion.div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">
                {number}. {title}
            </h3>
            <p className="text-gray-600">{description}</p>
        </div>
    </FadeUp>
)


const HomeCard = ({ icon: Icon, title, description, delay }) => (
    <FadeUp delay={delay}>
        <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-xl p-6 h-full shadow-md hover:shadow-xl transition-shadow border border-gray-100"
        >
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <Icon className="text-2xl text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-800">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </motion.div>
    </FadeUp>
)


const HomePage = () => {
    return (
        <div className="mb-8">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl py-16 md:py-24">
                <div className="container mx-auto px-6 md:px-4 grid md:grid-cols-2 gap-10 items-center">

                    {/* Brand & CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-left"
                    >
                        <div className="flex items-center gap-3">
                            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-normal">
                                Synx
                            </h1>
                        </div>

                        <p className="text-xl md:text-2xl text-gray-700 mb-4 font-light">
                            Turn any song into interactive tabs
                        </p>

                        <p className="text-base md:text-lg text-gray-600 mb-8 max-w-lg">
                            Upload your favorite songs and let AI detect chords, generate tabs,
                            and create an interactive learning experience.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <motion.a
                                href="/songs"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-third text-white px-7 py-3.5 rounded-full text-base font-semibold shadow-lg hover:shadow-2xl transition-shadow duration-300"
                            >
                                Get Started <FaArrowRight />
                            </motion.a>

                            <motion.a
                                href="#features"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center bg-white text-gray-800 px-7 py-3.5 rounded-full text-base font-semibold hover:shadow-lg transition-all duration-300 border-2 border-gray-200"
                            >
                                Learn More
                            </motion.a>
                        </div>
                    </motion.div>

                    {/* Chord Diagram Strip */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                    >
                        <ChordStrip />
                    </motion.div>
                </div>
            </section>

            {/* How It Works Section */}
            <div id="features" className="bg-white py-20 rounded-3xl scroll-mt-32">
                <div className="container mx-auto px-4">
                    <FadeUp>
                        <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">
                            How It Works
                        </h2>
                    </FadeUp>

                    <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        <StepCard
                            icon={FaUpload}
                            number={1}
                            title="Upload Your Song"
                            description="Drop any MP3 or audio file. We support all common formats."
                            delay={0}
                        />
                        <StepCard
                            icon={FaRobot}
                            number={2}
                            title="AI Chord Detection"
                            description="Our advanced algorithm analyzes the audio and detects chords with high accuracy."
                            delay={0.15}
                        />
                        <StepCard
                            icon={FaMusic}
                            number={3}
                            title="Interactive Tabs"
                            description="Get professional tabs with chord diagrams, ready to play along."
                            delay={0.3}
                        />
                    </div>
                </div>
            </div>

            {/* Features List */}
            <div className="bg-white py-20 my-10 rounded-3xl">
                <div className="container mx-auto px-4">
                    <FadeUp>
                        <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">
                            Features
                        </h2>
                    </FadeUp>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <HomeCard 
                            icon={FaGuitar} 
                            title="Multiple Instruments" 
                            description="Guitar tabs supported, with more coming soon" 
                            delay={0} 
                        />
                        <HomeCard 
                            icon={FaBolt} 
                            title="Instant Analysis" 
                            description="Chord detection completes in seconds, not minutes" 
                            delay={0.05} 
                        />
                        <HomeCard 
                            icon={FaChartLine} 
                            title="Chord Progression" 
                            description="See the full chord timeline for any song" 
                            delay={0.1} 
                        />
                        <HomeCard 
                            icon={FaSave} 
                            title="Save Your Library" 
                            description="Keep all your analyzed songs in one place" 
                            delay={0.15} 
                        />
                        <HomeCard 
                            icon={FaBullseye} 
                            title="Beginner Friendly" 
                            description="Simple chord diagrams perfect for learning"
                            delay={0.2} 
                        />
                        <HomeCard 
                            icon={FaRocket} 
                            title="Always Improving" 
                            description="Regular updates with new features and better accuracy" 
                            delay={0.25} 
                        />
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <FadeUp>
                <div className="bg-gradient-to-r from-primary via-secondary to-primary py-20 rounded-3xl">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Ready to start learning?
                        </h2>
                        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                            Join musicians who are learning their favorite songs faster with Synx
                        </p>
                        <motion.a
                            href="/songs"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className="inline-flex items-center gap-2 bg-white text-purple-600 px-10 py-4 rounded-full text-lg font-bold shadow-lg hover:shadow-2xl transition-shadow duration-300"
                        >
                            Start Analyzing Songs <FaArrowRight />
                        </motion.a>
                    </div>
                </div>
            </FadeUp>
        </div>
    )
}

export default HomePage