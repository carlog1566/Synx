const Loading = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
            <div className="pb-44">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
                    <h1 className="text-2xl font-bold text-gray-800">Loading...</h1>
                </div>
            </div>
        </div>
    )
}

export default Loading