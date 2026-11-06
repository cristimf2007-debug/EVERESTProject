import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import "./button.css";

const buttonVariants = cva("control", {
  variants: {
    variant: {
      default: "control-primary",
      secondary: "control-secondary",
      outline: "control-outline",
      ghost: "control-ghost",
      destructive: "control-destructive",
      link: "control-link",
    },
    size: { default: "control-md", sm: "control-sm", lg: "control-lg", icon: "control-icon" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

const Button = React.forwardRef(function Button({ className, variant, size, asChild = false, loading = false, disabled = false, type = "button", children, onClick, ...props }, ref) {
  const blocked = loading || disabled;
  const content = <>{loading && <Loader2 className="control-spinner" aria-hidden="true" />}{children}</>;
  if (asChild) {
    const child = React.Children.only(children);
    const handleClick = (event) => {
      if (blocked) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      child.props.onClick?.(event);
      onClick?.(event);
    };
    return <Slot {...props} ref={ref} className={cn(buttonVariants({ variant, size }), className)}
      aria-disabled={blocked || child.props["aria-disabled"] || undefined} aria-busy={loading || undefined}
      tabIndex={blocked ? -1 : props.tabIndex ?? child.props.tabIndex}>
      {React.cloneElement(child, { onClick: handleClick }, loading ? <><Loader2 className="control-spinner" aria-hidden="true" />{child.props.children}</> : child.props.children)}
    </Slot>;
  }
  return <button {...props} ref={ref} type={type} disabled={blocked} aria-busy={loading || undefined}
    className={cn(buttonVariants({ variant, size }), className)} onClick={onClick}>{content}</button>;
});

export { Button, buttonVariants };
