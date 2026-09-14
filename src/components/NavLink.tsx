import { Link, useLocation } from "react-router-dom";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const NavLink = ({ to, children, className = "", onClick }: NavLinkProps) => {
  const location = useLocation();

  const isActive =
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`nav-link ${isActive ? "active text-primary" : "text-muted-foreground hover:text-foreground"} ${className}`}
    >
      {children}
    </Link>
  );
};

export default NavLink;
