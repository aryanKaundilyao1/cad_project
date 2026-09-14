import { useLocation } from "react-router-dom";
import { useEffect, useState, useRef, ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<"enter" | "exit">("enter");
  const prevLocation = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevLocation.current) {
      prevLocation.current = location.pathname;
      setTransitionStage("exit");

      setTimeout(() => {
        setTransitionStage("enter");
        // Scroll to top on route change
        window.scrollTo({ top: 0, behavior: "instant" });
        
        // Fix Radix UI body scroll lock bug when unmounting Dialog/Sheet during navigation
        document.body.style.pointerEvents = "";
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
        document.body.removeAttribute("data-scroll-locked");
      }, 200);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (transitionStage === "enter") {
      setDisplayChildren(children);
    }
  }, [children, transitionStage]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${transitionStage === "enter"
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-1"
        }`}
    >
      {displayChildren}
    </div>
  );
};

export default PageTransition;
