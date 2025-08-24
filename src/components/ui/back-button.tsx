import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  to?: string;
  className?: string;
  variant?: "default" | "ghost" | "outline" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
}

export function BackButton({ 
  to, 
  className, 
  variant = "ghost", 
  size = "sm",
  children = "Back" 
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn("flex items-center gap-2", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Button>
  );
}