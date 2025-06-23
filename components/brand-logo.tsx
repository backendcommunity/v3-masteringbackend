interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "default" | "white" | "dark";
}

export function BrandLogo({
  size = "md",
  showText = true,
  variant = "default",
}: BrandLogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-2xl",
  };

  const starSizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  // Updated color handling for dark mode
  const logoColors = {
    default: "bg-[#13aece] dark:bg-[#13AECE]",
    white: "bg-white",
    dark: "bg-[#13aece]",
  };

  const textColors = {
    default: "text-[#13aece] dark:text-[#F1F5F9]",
    white: "text-white",
    dark: "text-[#13aece]",
  };

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`${sizeClasses[size]} ${logoColors[variant]} rounded-lg flex items-center justify-center relative`}
      >
        <span
          className={`${
            variant === "white" ? "text-[#13aece]" : "text-white"
          } font-bold ${size === "sm" ? "text-xs" : "text-sm"}`}
        >
          <img src="/logo.png" alt="logo" />
        </span>
      </div>
      {showText && (
        <span
          className={`${textSizeClasses[size]} font-bold ${textColors[variant]}`}
        >
          Masteringbackend
        </span>
      )}
    </div>
  );
}
