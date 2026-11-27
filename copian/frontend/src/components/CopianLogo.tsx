import React from "react";

interface CopianLogoProps {
  variant?: "cobalt" | "white";
  className?: string;
}

export default function CopianLogo({ variant = "cobalt", className = "h-7 w-28" }: CopianLogoProps) {
  if (variant === "white") {
    return (
      <img
        src="/images/copian-logo.png"
        alt="COPIAN"
        className={`object-contain object-left ${className}`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label="COPIAN"
      className={`inline-block shrink-0 bg-light-primary ${className}`}
      style={{
        WebkitMaskImage: "url(/images/copian-logo.png)",
        maskImage: "url(/images/copian-logo.png)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "left center",
        maskPosition: "left center",
      }}
    />
  );
}
