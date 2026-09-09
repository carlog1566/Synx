import { Link } from 'react-router'

const Success = ({ title, subText=null, text, path }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">{title}</h1>
                {(subText !== null) ? (
                    <>
                        <p className="text-gray-600">
                            {subText}
                        </p> 
                        <Link to={path} className="mt-6 inline-block text-primary hover:text-third transition-colors duration-200">
                            {text}
                        </Link>
                    </>
                ) : (
                    <Link to={path} className="inline-block text-primary hover:text-third transition-colors duration-200">
                        {text}
                    </Link>
                )}
            </div>
        </div>
    )
}

export default Success