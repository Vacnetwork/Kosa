import { cn } from "@/lib/cn";

/**
 * The page's signature move: each line rises from behind its own baseline.
 * Lines are authored, not wrapped by the browser, so the two-line rule is
 * guaranteed at every width.
 */
export function MaskedHeadline({
  lines,
  className,
  as: Tag = "h1",
}: {
  lines: string[];
  className?: string;
  as?: "h1" | "h2" | "p";
}) {
  return (
    <Tag className={cn("t-display uppercase", className)}>
      {lines.map((line, index) => (
        <span key={line} className="line-mask">
          <span style={{ animationDelay: `${index * 110}ms` }}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}
