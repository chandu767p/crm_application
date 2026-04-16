import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component scrolls the window to the top whenever the route changes.
 * This is important in single-page applications to ensure the user starts at the top
 * of the new page rather than staying at the scroll position of the previous page.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Instant scroll for better UX on route change
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
