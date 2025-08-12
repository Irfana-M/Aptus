import React from 'react';
import { BookOpen, Menu, X } from 'lucide-react';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

const handleRegisterClick = () => {
  navigate('/register');
}

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">Mentora</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors">
              Home
            </a>
            <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors">
              About
            </a>
            <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors">
              Services
            </a>
            <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors">
              Contact
            </a>
          </nav>
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" size="sm">
              Log In
            </Button>
            <Button size="sm" onClick={handleRegisterClick}>Get Started</Button>
          </div>
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors">
                Home
              </a>
              <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors">
                About
              </a>
              <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors">
                Services
              </a>
              <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors">
                Contact
              </a>
              <div className="pt-4 space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  Log In
                </Button>
                <Button size="sm" className="w-full" onClick={handleRegisterClick}>
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;