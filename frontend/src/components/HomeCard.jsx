const HomeCard = ({ icon, title, description }) => {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-lg font-bold mb-2 text-gray-800">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    )
} 

export default HomeCard