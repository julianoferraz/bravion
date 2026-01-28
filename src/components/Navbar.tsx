import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const { user, signOut, canManageBlog } = useAuth();
  const location = useLocation();

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/#about", label: t.nav.about },
    { href: "/#services", label: t.nav.services },
    { href: "/#industries", label: t.nav.industries },
    { href: "/blog", label: t.nav.blog },
    { href: "/#contact", label: t.nav.contact },
  ];

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith("/#")) {
      const id = href.replace("/#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Bravion Global" className="h-10 w-10 object-contain" />
            <div className="flex items-center">
              <span className="text-xl font-bold text-primary">Bravion</span>
              <span className="text-xl font-light text-foreground">Global</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            
            {canManageBlog && (
              <Link
                to="/admin/blog"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {t.nav.admin}
              </Link>
            )}
          </div>

          {/* Right side: Language + Auth */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSelector />
            
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {user.email?.split("@")[0]}
                </span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  {t.auth.login}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSelector />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => handleNavClick(link.href)}
                className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                {link.label}
              </Link>
            ))}
            
            {canManageBlog && (
              <Link
                to="/admin/blog"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-primary hover:bg-muted rounded-md transition-colors"
              >
                {t.nav.admin}
              </Link>
            )}
            
            <div className="pt-4 border-t border-border">
              {user ? (
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => { signOut(); setIsOpen(false); }}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t.auth.logout}
                  </Button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full gap-2">
                    <LogIn className="h-4 w-4" />
                    {t.auth.login}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
