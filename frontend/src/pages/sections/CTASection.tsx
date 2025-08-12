import React from 'react';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';

const CTASection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
          Ready to Accelerate Your Career?
        </h2>
        <p className="text-xl text-teal-100 mb-8 leading-relaxed">
          Join thousands of professionals who have transformed their careers through our mentorship program.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register">
          <Button variant="secondary" size="lg">
            Start Free Trial
          </Button>
          </Link>
          <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-teal-600">
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;