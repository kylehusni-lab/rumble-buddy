import { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEventAdmin, type EventWithRelations, type DbEventMatch } from "@/hooks/useEventAdmin";
import { WrestlerSelect } from "./WrestlerSelect";

interface MatchFormModalProps {
  event: EventWithRelations;
  match: DbEventMatch | null;
  defaultNight: string | null;
  onClose: () => void;
}

const MATCH_TYPES = [
  { value: "singles", label: "Singles", minOptions: 2, maxOptions: 2 },
  { value: "tag", label: "Tag Team", minOptions: 1, maxOptions: 5, isTag: true },
  { value: "triple_threat", label: "Triple Threat", minOptions: 3, maxOptions: 3 },
  { value: "fatal_four", label: "Fatal Four Way", minOptions: 4, maxOptions: 4 },
  { value: "ladder", label: "Ladder Match", minOptions: 2, maxOptions: 8 },
  { value: "rumble", label: "Royal Rumble", minOptions: 0, maxOptions: 0 },
  { value: "battle_royal", label: "Battle Royal", minOptions: 4, maxOptions: 30 },
  { value: "other", label: "Other", minOptions: 2, maxOptions: 10 },
];

const MENS_TITLES = [
  "Undisputed WWE Championship",
  "World Heavyweight Championship",
  "United States Championship",
  "Intercontinental Championship",
  "World Tag Team Championship",
];

const WOMENS_TITLES = [
  "WWE Women's Championship",
  "Women's World Championship",
  "Women's Intercontinental Championship",
  "WWE Women's Tag Team Championship",
];

function parseTagTeams(options: string[]): [string[], string[]] {
  if (options.length === 2) {
    const t1 = options[0].split(" & ").map(s => s.trim()).filter(Boolean);
    const t2 = options[1].split(" & ").map(s => s.trim()).filter(Boolean);
    return [t1.length ? t1 : [""], t2.length ? t2 : [""]];
  }
  return [[""], [""]];
}

function flattenTagTeams(team1: string[], team2: string[]): string[] {
  const t1 = team1.filter(s => s.trim());
  const t2 = team2.filter(s => s.trim());
  return [t1.join(" & "), t2.join(" & ")];
}

export function MatchFormModal({ event, match, defaultNight, onClose }: MatchFormModalProps) {
  const { createMatch, updateMatch } = useEventAdmin();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    match_id: "",
    title: "",
    match_type: "singles",
    options: ["", ""],
    night: defaultNight || "",
    is_active: true,
    is_title_match: false,
    championship_name: "",
  });

  // Tag team state
  const [team1, setTeam1] = useState<string[]>([""]);
  const [team2, setTeam2] = useState<string[]>([""]);

  // Track divisions of selected wrestlers
  const [wrestlerDivisions, setWrestlerDivisions] = useState<Record<string, string>>({});

  // Seed wrestler divisions from cache for existing names
  useEffect(() => {
    const allNames = isTag
      ? [...team1, ...team2].filter(n => n.trim())
      : formData.options.filter(n => n.trim());
    if (allNames.length === 0) return;
    // Import cached wrestlers from WrestlerSelect module
    import("./WrestlerSelect").then(() => {
      // cachedWrestlers is module-level; fetch fresh if needed
      supabase
        .from("wrestlers")
        .select("name, division")
        .eq("is_active", true)
        .then(({ data }) => {
          if (!data) return;
          const divMap: Record<string, string> = {};
          data.forEach(w => {
            if (allNames.some(n => n.toLowerCase() === w.name.toLowerCase())) {
              divMap[w.name] = w.division;
            }
          });
          if (Object.keys(divMap).length > 0) {
            setWrestlerDivisions(prev => ({ ...prev, ...divMap }));
          }
        });
    });
  }, [formData.options, team1, team2, isTag]);

  useEffect(() => {
    if (match) {
      const isTagMatch = match.match_type === "tag";
      const opts = match.options?.length > 0 ? match.options : ["", ""];
      setFormData({
        match_id: match.match_id,
        title: match.title,
        match_type: match.match_type,
        options: isTag ? ["", ""] : opts,
        night: match.night || "",
        is_active: match.is_active,
        is_title_match: match.is_title_match || false,
        championship_name: match.championship_name || "",
      });
      if (isTag) {
        const [t1, t2] = parseTagTeams(opts);
        setTeam1(t1);
        setTeam2(t2);
      }
    }
  }, [match]);

  const isTag = formData.match_type === "tag";

  const generateMatchId = (title: string, eventId: string) => {
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return `${eventId}_${base}`;
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      match_id: prev.match_id || generateMatchId(title, event.id),
    }));
  };

  const handleTypeChange = (type: string) => {
    const config = MATCH_TYPES.find(t => t.value === type);
    if (type === "tag") {
      setTeam1([""]);
      setTeam2([""]);
      setFormData(prev => ({ ...prev, match_type: type, options: [] }));
    } else {
      let newOptions = [...formData.options];
      if (config && type !== "rumble") {
        while (newOptions.length < config.minOptions) newOptions.push("");
        if (config.maxOptions > 0 && newOptions.length > config.maxOptions)
          newOptions = newOptions.slice(0, config.maxOptions);
      }
      setFormData(prev => ({
        ...prev,
        match_type: type,
        options: type === "rumble" ? [] : newOptions,
      }));
    }
  };

  const handleWrestlerChange = (index: number, name: string, division: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = name;
    setFormData(prev => ({ ...prev, options: newOptions }));
    if (name && division) {
      setWrestlerDivisions(prev => ({ ...prev, [name]: division }));
    }
  };

  const handleTeamMemberChange = (team: 1 | 2, index: number, name: string, division: string) => {
    const setter = team === 1 ? setTeam1 : setTeam2;
    setter(prev => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
    if (name && division) {
      setWrestlerDivisions(prev => ({ ...prev, [name]: division }));
    }
  };

  const addTeamMember = (team: 1 | 2) => {
    const setter = team === 1 ? setTeam1 : setTeam2;
    setter(prev => [...prev, ""]);
  };

  const removeTeamMember = (team: 1 | 2, index: number) => {
    const setter = team === 1 ? setTeam1 : setTeam2;
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const addOption = () => {
    setFormData(prev => ({ ...prev, options: [...prev.options, ""] }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  // Determine detected division from all selected wrestlers
  const detectedDivision = useMemo(() => {
    const allNames = isTag
      ? [...team1, ...team2].filter(n => n.trim())
      : formData.options.filter(n => n.trim());
    if (allNames.length === 0) return "all";
    const divs = new Set(allNames.map(n => wrestlerDivisions[n]).filter(Boolean));
    if (divs.size === 1) return divs.values().next().value;
    return "all";
  }, [isTag, team1, team2, formData.options, wrestlerDivisions]);

  const availableTitles = useMemo(() => {
    if (detectedDivision === "mens") return MENS_TITLES;
    if (detectedDivision === "womens") return WOMENS_TITLES;
    return [...MENS_TITLES, ...WOMENS_TITLES];
  }, [detectedDivision]);

  // All selected wrestler names for exclude list
  const allSelectedNames = useMemo(() => {
    if (isTag) return [...team1, ...team2].filter(n => n.trim());
    return formData.options.filter(n => n.trim());
  }, [isTag, team1, team2, formData.options]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalOptions = isTag
      ? flattenTagTeams(team1, team2)
      : formData.options.filter(o => o.trim());

    const nextSortOrder = match
      ? match.sort_order
      : (event.event_matches?.filter(m => m.night === (formData.night || null)).length || 0);

    const payload = {
      event_id: event.id,
      match_id: formData.match_id,
      title: formData.title,
      match_type: formData.match_type,
      options: finalOptions,
      night: formData.night || null,
      sort_order: nextSortOrder,
      is_active: formData.is_active,
      is_title_match: formData.is_title_match,
      championship_name: formData.is_title_match ? formData.championship_name || null : null,
    };

    let success = false;
    if (match) {
      success = await updateMatch(match.id, payload);
    } else {
      success = await createMatch(payload);
    }

    setIsSubmitting(false);
    if (success) onClose();
  };

  const matchTypeConfig = MATCH_TYPES.find(t => t.value === formData.match_type);
  const showOptions = formData.match_type !== "rumble" && !isTag;
  const canAddOption = matchTypeConfig && !matchTypeConfig.isTag && formData.options.length < matchTypeConfig.maxOptions;
  const canRemoveOption = matchTypeConfig && !matchTypeConfig.isTag && formData.options.length > matchTypeConfig.minOptions;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background">
          <h2 className="text-lg font-semibold">
            {match ? "Edit Match" : "Add Match"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Match Title</Label>
            <Input
              id="title"
              placeholder="e.g., WWE Championship Match"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="match_id">Match ID</Label>
            <Input
              id="match_id"
              placeholder="e.g., mania_42_wwe_title"
              value={formData.match_id}
              onChange={(e) => setFormData(prev => ({ ...prev, match_id: e.target.value }))}
              required
              className="font-mono text-sm"
              disabled={!!match}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Match Type</Label>
              <Select value={formData.match_type} onValueChange={handleTypeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MATCH_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {event.nights?.length > 0 && (
              <div className="space-y-2">
                <Label>Night</Label>
                <Select
                  value={formData.night}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, night: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select night" /></SelectTrigger>
                  <SelectContent>
                    {event.nights.map(night => (
                      <SelectItem key={night.id} value={night.id}>{night.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Title Match Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="is_title_match" className="font-medium">Title Match</Label>
              <p className="text-xs text-muted-foreground">Championship on the line</p>
            </div>
            <Switch
              id="is_title_match"
              checked={formData.is_title_match}
              onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_title_match: v, championship_name: v ? prev.championship_name : "" }))}
            />
          </div>

          {formData.is_title_match && (
            <div className="space-y-2">
              <Label>Championship</Label>
              <Select
                value={formData.championship_name}
                onValueChange={(v) => setFormData(prev => ({ ...prev, championship_name: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select championship" /></SelectTrigger>
                <SelectContent>
                  {availableTitles.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tag Team Layout */}
          {isTag && (
            <div className="space-y-4">
              {([1, 2] as const).map(teamNum => {
                const members = teamNum === 1 ? team1 : team2;
                return (
                  <div key={teamNum} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <Label className="text-sm font-semibold">Team {teamNum}</Label>
                    {members.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1">
                          <WrestlerSelect
                            value={member}
                            onChange={(name, div) => handleTeamMemberChange(teamNum, idx, name, div)}
                            placeholder={`Member ${idx + 1}`}
                            excludeNames={allSelectedNames.filter(n => n !== member)}
                          />
                        </div>
                        {members.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeTeamMember(teamNum, idx)} className="shrink-0">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {members.length < 5 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => addTeamMember(teamNum)}>
                        <Plus className="w-4 h-4 mr-1" /> Add Member
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Standard Options */}
          {showOptions && (
            <div className="space-y-2">
              <Label>Participants</Label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <WrestlerSelect
                        value={option}
                        onChange={(name, div) => handleWrestlerChange(index, name, div)}
                        placeholder={`Participant ${index + 1}`}
                        excludeNames={allSelectedNames.filter(n => n !== option)}
                      />
                    </div>
                    {canRemoveOption && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)} className="shrink-0">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                {canAddOption && (
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="w-4 h-4 mr-1" /> Add Participant
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="is_active" className="font-medium">Active</Label>
              <p className="text-xs text-muted-foreground">Include in picks</p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !formData.match_id || !formData.title}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              ) : match ? "Update Match" : "Add Match"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
