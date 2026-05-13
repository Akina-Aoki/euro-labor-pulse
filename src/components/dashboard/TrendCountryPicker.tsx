import { X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface Props {
  countries: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  helperText: string;
}

export function TrendCountryPicker({ countries, selected, onChange, helperText }: Props) {
  const toggle = (c: string) =>
    onChange(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]);

  return (
    <div className="rounded-lg border border-dashed border-border bg-[var(--elms-canvas)]/40 p-3 mb-4">
      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{helperText}</p>
      <div className="flex flex-wrap items-start gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 font-normal">
              {selected.length === 0 ? "Select countries…" : `${selected.length} selected`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <div className="max-h-72 overflow-auto p-2">
              {countries.map((c) => (
                <label
                  key={c}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/10 cursor-pointer text-sm"
                >
                  <Checkbox checked={selected.includes(c)} onCheckedChange={() => toggle(c)} />
                  {c}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {selected.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--elms-plum)]/10 text-[var(--elms-plum)]"
          >
            {c}
            <button type="button" onClick={() => toggle(c)} className="hover:opacity-70">
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
