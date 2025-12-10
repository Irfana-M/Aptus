import aptusLogo from "../../assets/images/aptusLogo.jpeg";

type LogoProps = {
  className?: string;
  withText?: boolean;
};

export default function Logo({ className, withText = true }: LogoProps) {
  const newLocal = "h-10 w-auto object-contain";
  return (
    <div
      className={`flex items-center gap-2 ${className || ""}`}
    >
      <img 
        src={aptusLogo} 
        alt="Aptus Logo" 
        className={newLocal} 
      />

      {withText && (
        <span className="text-xl font-bold text-gray-800">Aptus</span>
      )}
    </div>
  );
}
