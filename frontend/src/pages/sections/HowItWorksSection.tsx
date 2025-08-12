import React from 'react';
import Card from '../../components/ui/Card';

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Choose Your Path',
      description: 'Select from our diverse range of mentorship programs tailored to your industry and career goals.',
      image: '/assets/images/step1.jpg',
    },
    {
      step: '02',
      title: 'Get Matched',
      description: 'Our AI-powered matching system connects you with the perfect mentor based on your profile and objectives.',
      image: '/assets/images/step2.jpg',
    },
    {
      step: '03',
      title: 'Start Growing',
      description: 'Begin your mentorship journey with structured sessions and personalized learning plans.',
      image: '/assets/images/step3.jpg',
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <Card hover className="p-8 mb-6">
                <img
                  src={step.image}
                  alt={`Step ${step.step}`}
                  className="w-full h-48 object-cover rounded-lg mb-6"
                />
                <div className="text-4xl font-bold text-teal-600 mb-4">{step.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;