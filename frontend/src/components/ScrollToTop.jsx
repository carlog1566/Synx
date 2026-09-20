import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Scrolls the window to the top on every route change.
 * 
 * react-router doesn't reset scroll position between navigations by default, so without this
 * navigating from a scrolled-down page would land on the next page still scrolled down.
 */
const ScrollToTop = () => {
    const { pathname } = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])

    return null
}

export default ScrollToTop