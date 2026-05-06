import { useNavigate } from "react-router"

const SongDetailNav = () => {
    const navigate = useNavigate()

    return (
        <nav className="bg-white shadow-md border-b border-gray-200">
            <div className="container px-8 py-4">
                <div className="flex items-center">
                    <button onClick={() => navigate('/songs')} className="flex items-center gap-2 text-gray-600 hover:text-third transition-colors cursor-pointer">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Library
                    </button>
                </div>
            </div>
        </nav>
    )
}

export default SongDetailNav