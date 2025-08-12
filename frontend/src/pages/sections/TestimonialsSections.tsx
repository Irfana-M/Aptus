import React from 'react';
import { Star } from 'lucide-react';
import Card from '../../components/ui/Card';

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              What They Say?
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Hear from our successful mentees who have transformed their careers through our mentorship program.
            </p>
            <Card className="p-8">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-6 text-lg leading-relaxed">
                "The mentorship program completely transformed my approach to leadership. My mentor's guidance helped me secure a promotion within 6 months!"
              </blockquote>
              <div className="flex items-center">
                <img
                  src="/assets/images/avatar.jpg"
                  alt="Emily Chen"
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <div className="font-semibold text-gray-900">Emily Chen</div>
                  <div className="text-gray-600">Product Manager at TechCorp</div>
                </div>
              </div>
            </Card>
          </div>
          <div>
            <img
              src="/assets/images/mentee.jpg"
              alt="Happy mentee"
              className="rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;