import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export interface WrestlerOption {
  name: string;
  division: string;
  image_url: string | null;
}

interface WrestlerSelectProps {
  value: string;
  onChange: (name: string, division: string) => void;
  placeholder?: string;
  excludeNames?: string[];
}

let cachedWrestlers: WrestlerOption[] | null = null;

export function WrestlerSelect({ value, onChange, placeholder = "Select wrestler", excludeNames = [] }: WrestlerSelectProps) {
  const [open, setOpen] = useState(false);
  const [wrestlers, setWrestlers] = useState<WrestlerOption[]>(cachedWrestlers || []);

  useEffect(() => {
    if (cachedWrestlers) return;
    (async () => {
      const { data } = await supabase
        .from("wrestlers")
        .select("name, division, image_url")
        .eq("is_active", true)
        .order("name");
      if (data) {
        cachedWrestlers = data;
        setWrestlers(data);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const lowerExclude = new Set(excludeNames.map(n => n.toLowerCase()));
    return wrestlers.filter(w => !lowerExclude.has(w.name.toLowerCase()) || w.name.toLowerCase() === value.toLowerCase());
  }, [wrestlers, excludeNames, value]);

  const selected = wrestlers.find(w => w.name.toLowerCase() === value.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-9 text-sm"
        >
          {value ? (
            <span className="flex items-center gap-2 truncate">
              {selected && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                  {selected.division === "womens" ? "W" : "M"}
                </Badge>
              )}
              <span className="truncate">{value}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <div className="flex items-center gap-1 shrink-0">
            {value && (
              <X
                className="w-3 h-3 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("", "");
                }}
              />
            )}
            <ChevronsUpDown className="w-3 h-3 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search wrestlers..." className="h-8" />
          <CommandList>
            <CommandEmpty>No wrestler found.</CommandEmpty>
            <CommandGroup className="max-h-[200px]">
              {filtered.map((w) => (
                <CommandItem
                  key={w.name}
                  value={w.name}
                  onSelect={() => {
                    onChange(w.name, w.division);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-3 w-3", value.toLowerCase() === w.name.toLowerCase() ? "opacity-100" : "opacity-0")}
                  />
                  <Badge variant="outline" className="text-[10px] px-1 py-0 mr-2 shrink-0">
                    {w.division === "womens" ? "W" : "M"}
                  </Badge>
                  <span className="truncate">{w.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
