const error = ({ error }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
            <div className="pb-44">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Error!</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        </div>
    )
}

export default error