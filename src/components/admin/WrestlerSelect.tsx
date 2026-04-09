import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export function invalidateWrestlerCache() {
  cachedWrestlers = null;
}

export function WrestlerSelect({ value, onChange, placeholder = "Select wrestler", excludeNames = [] }: WrestlerSelectProps) {
  const [open, setOpen] = useState(false);
  const [wrestlers, setWrestlers] = useState<WrestlerOption[]>(cachedWrestlers || []);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDivision, setNewDivision] = useState<"mens" | "womens">("mens");
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateWrestler = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-wrestlers", {
        body: {
          action: "create",
          data: {
            name: newName.trim(),
            division: newDivision,
            is_rumble_participant: false,
            is_confirmed: true,
          },
        },
      });
      if (error) throw error;
      const created: WrestlerOption = {
        name: newName.trim(),
        division: newDivision,
        image_url: null,
      };
      // Update local + cache
      const updated = [...wrestlers, created].sort((a, b) => a.name.localeCompare(b.name));
      setWrestlers(updated);
      cachedWrestlers = updated;
      // Select the new wrestler
      onChange(created.name, created.division);
      setShowCreate(false);
      setNewName("");
      setNewDivision("mens");
      setOpen(false);
      toast.success(`${created.name} added to roster`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create wrestler");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowCreate(false); }}>
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
      <PopoverContent className="w-[280px] p-0" align="start">
        {showCreate ? (
          <div className="p-3 space-y-3">
            <p className="text-sm font-medium">Quick Add Wrestler</p>
            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <Input
                placeholder="e.g., Roman Reigns"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Division</Label>
              <Select value={newDivision} onValueChange={(v) => setNewDivision(v as "mens" | "womens")}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mens">Men's</SelectItem>
                  <SelectItem value="womens">Women's</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setShowCreate(false)}
                disabled={isCreating}
              >
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1"
                onClick={handleCreateWrestler}
                disabled={!newName.trim() || isCreating}
              >
                {isCreating ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>
        ) : (
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
              <div className="border-t border-border p-1">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create new wrestler
                </button>
              </div>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
