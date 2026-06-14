import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { buildWhatsAppUrl } from "@/lib/format";

interface WhatsAppButtonProps {
  phone: string;
  name?: string;
  message?: string;
  label?: string;
  size?: ButtonProps["size"];
  variant?: "default" | "ghost" | "outline";
  onAction?: () => void;
  className?: string;
}

export function WhatsAppButton({
  phone,
  name,
  message,
  label = "تواصل عبر واتساب",
  size,
  variant = "default",
  onAction,
  className,
}: WhatsAppButtonProps) {
  const defaultMessage = `مرحباً${name ? " " + name + "،" : ""} أتواصل معك من منصة نِفال العقارية`;
  const url = buildWhatsAppUrl(phone, message ?? defaultMessage);

  function handleClick() {
    onAction?.();
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Button
      size={size}
      variant={variant === "default" ? "default" : variant}
      onClick={handleClick}
      className={cn(
        variant === "default" &&
          "bg-[var(--color-whatsapp)] hover:bg-[var(--color-whatsapp)]/90 text-white border-transparent",
        className,
      )}
    >
      <MessageCircle className="h-4 w-4 me-1.5" />
      {label}
    </Button>
  );
}
