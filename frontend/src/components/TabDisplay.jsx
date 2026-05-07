const TabDisplay = ({ tabs, instrument }) => {
    if (!tabs) {
        return (
            <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🎸</div>
                <p className="text-lg">No tabs available for this song yet...</p>
                <p className="text-sm mt-2">Try analyzing the song first!</p>
            </div>
        )
    }

    if (!tabs[instrument]) {
        return (
            <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">
                    {instrument === 'guitar' ? '🎸' : '🎵'}
                </div>
                <p className="text-lg">
                    {instrument.charAt(0).toUpperCase() + instrument.slice(1)} tabs not available yet.
                </p>
            </div>
        )
    }

    return (
        <div className="tab-display">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">
                    {instrument.charAt(0).toUpperCase() + instrument.slice(1)} Tabs
                </h2>
            </div>

            {/* Tabs Content */}
            <div className="bg-gray-50 rounded-lg p-6 overflow-x-auto">
                <pre className="font-mono text-sm leading-relaxed whitespace-pre">
                    {tabs[instrument]}
                </pre>
            </div>
        </div>
    )
}

export default TabDisplay