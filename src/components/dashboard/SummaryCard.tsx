import { ReactNode } from "react";

type Props = {
  title: string;
  value?: number | string;
  icon?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
};

const SummaryCard = ({ title, value = "—", icon, footer, loading }: Props) => {
  return (
    <div className="p-4 rounded-2xl bg-card shadow border border-border">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        {icon}
      </div>
      <div className="mt-2">
        {loading ? (
          <div className="h-8 w-24 rounded bg-muted animate-pulse" />
        ) : (
          <h2 className="text-2xl font-bold">{value}</h2>
        )}
      </div>
      {footer && <div className="mt-3 text-xs text-muted-foreground">{footer}</div>}
    </div>
  );
};

export default SummaryCard;
