import { BookOpen } from "lucide-react";

type LogoProps = {
  className?: string;
  withText?: boolean;
};

export default function Logo({ className, withText = true }: LogoProps) {
  return (
    <div
      className={`flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg ${className || ""}`}
    >
      {/* Icon with colored background */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: "#49BBBD" }}
      >
        <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
      </div>

      {/* Brand Text */}
      {withText && (
        <span className="text-xl font-bold text-gray-800">
          Mentora
        </span>
      )}
    </div>
  );
}
