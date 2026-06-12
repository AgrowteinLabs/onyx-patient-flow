import { useState } from "react";
import { X } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}

export const PermissionMultiSelect = ({ options, value, onChange, placeholder }: Props) => {
  const [open, setOpen] = useState(false);

  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((p) => p !== v));
    else onChange([...value, v]);
  };

  return (
    <div className="relative">
      <div
        onClick={() => setOpen(!open)}
        className="border rounded-md p-2 cursor-pointer bg-background min-h-[42px] flex flex-wrap gap-2"
      >
        {value.length === 0 ? (
          <span className="text-muted-foreground text-sm">{placeholder || "Select permissions"}</span>
        ) : (
          value.map((v) => {
            const item = options.find((o) => o.value === v);
            return (
              <span
                key={v}
                className="bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center gap-1 text-sm"
              >
                {item?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(v);
                  }}
                />
              </span>
            );
          })
        )}
      </div>

      {open && (
        <div className="absolute mt-1 bg-popover border rounded-md shadow-lg w-full z-20">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted ${
                value.includes(opt.value) ? "bg-muted" : ""
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
