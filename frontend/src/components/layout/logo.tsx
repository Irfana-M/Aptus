import { GraduationCap } from "lucide-react"; // pick an icon you like


type LogoProps = {
  className?: string;
  withText?: boolean;
};

export default function Logo({ className, withText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      {/* Icon */}
      <GraduationCap className="h-8 w-8 text-blue-600" strokeWidth={2.5} />

      {/* Brand Text */}
      {withText && (
        <span className="font-extrabold text-xl tracking-tight">
          <span className="text-slate-900">Ment</span>
          <span className="text-blue-600">ora</span>
        </span>
      )}
    </div>
  );
}
