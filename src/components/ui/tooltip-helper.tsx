import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { InfoIcon } from "lucide-react"

interface TooltipHelperProps {
  text: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  className?: string
}

export function TooltipHelper({ 
  text, 
  side = "top", 
  align = "center",
  className = ""
}: TooltipHelperProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <InfoIcon className={`h-4 w-4 text-muted-foreground inline-block ml-1.5 cursor-help ${className}`} />
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className="max-w-[300px] text-sm">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}