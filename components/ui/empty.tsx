import { cn } from "@/lib/utils";

export function Empty({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center",
        className,
      )}
    >
      {icon}
      <div className="text-base font-semibold">{title}</div>
      {description ? (
        <div className="max-w-sm text-sm text-muted-foreground">{description}</div>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
