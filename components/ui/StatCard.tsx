import { cn } from "@/lib/utils";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  href?: string;
  accent?: string; // hex color
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  urgent?: boolean;
}

export function StatCard({ title, value, description, href, accent, icon, urgent }: StatCardProps) {
  const content = (
    <div
      className={cn(
        "bg-white rounded-xl border shadow-sm p-5 transition-all duration-150",
        href ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : "",
        urgent && Number(value) > 0 ? "border-amber-300 bg-amber-50" : "border-gray-200"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
            {title}
          </p>
          <p
            className={cn(
              "mt-1.5 text-3xl font-bold",
              urgent && Number(value) > 0 ? "text-amber-700" : "text-gray-900"
            )}
          >
            {value}
          </p>
          {description && (
            <p className="mt-1 text-xs text-gray-400 truncate">{description}</p>
          )}
        </div>

        {icon && (
          <div
            className="ml-3 flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: accent ? `${accent}20` : "#f3f4f6", color: accent ?? "#6b7280" }}
          >
            {icon}
          </div>
        )}
      </div>

      {accent && (
        <div className="mt-3 h-1 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full w-1/3 rounded-full" style={{ backgroundColor: accent }} />
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
