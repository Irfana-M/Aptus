import React from 'react';
import { Users, BookOpen, Award } from 'lucide-react';
import Card from '../../components/ui/Card';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Users className="w-8 h-8 text-teal-600" />,
      title: '1-on-1 Mentoring Sessions',
      description: 'Get personalized guidance from industry experts who understand your career goals and challenges.',
    },
    {
      icon: <BookOpen className="w-8 h-8 text-cyan-600" />,
      title: 'Comprehensive Learning Resources',
      description: 'Access curated learning materials, templates, and tools to accelerate your professional development.',
    },
    {
      icon: <Award className="w-8 h-8 text-blue-600" />,
      title: 'Flexible Learning Schedule',
      description: 'Learn at your own pace with flexible scheduling options that fit your busy lifestyle.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Mentora
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our mentorship platform connects you with the right mentor to unlock your potential and achieve your professional goals.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} hover className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;