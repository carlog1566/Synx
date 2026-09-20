import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'

/**
 * App entry point. Wraps the app with StrictMode (dev-only double-invocation to catch missing
 * missing effect cleanups), GoogleOAuthProvider (required context for the GoogleLogin button
 * components), and BrowserRouter (provides router context - actual route matching happens once,
 * inside App.jsx, not here).
 */
createRoot(document.getElementById('root')).render(
	<StrictMode>
		<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
			<BrowserRouter>
				<ScrollToTop />
				<App />
			</BrowserRouter>
		</GoogleOAuthProvider>
	</StrictMode>
)
