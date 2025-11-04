import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
}) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-lg ${
        hover ? "hover:shadow-2xl transition-shadow duration-300" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
