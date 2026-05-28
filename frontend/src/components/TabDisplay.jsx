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

    const tabData = tabs[instrument];

    if (tabData.length <= 0) {
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
                <div className="font-mono text-sm leading-relaxed whitespace-pre">
                    {tabData.map((item, index) => (
                        <div key={index}>
                            <p>
                                Time: {item['time']}
                            </p>
                            <p>
                                Chord: {item['chord']}
                            </p>
                            <p>
                                Positions: <br></br>{item['positions']['E']}<br></br>{item['positions']['A']}<br></br>{item['positions']['D']}<br></br>{item['positions']['G']}<br></br>{item['positions']['B']}<br></br>{item['positions']['e']}
                            </p>
                            <br></br>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default TabDisplay