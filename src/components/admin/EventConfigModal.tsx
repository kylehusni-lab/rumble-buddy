import { useState } from "react";
import { X, Settings, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type EventWithRelations } from "@/hooks/useEventAdmin";
import { MatchesConfigTab } from "./MatchesConfigTab";
import { PropsConfigTab } from "./PropsConfigTab";
import { EventSettingsTab } from "./EventSettingsTab";

interface EventConfigModalProps {
  event: EventWithRelations;
  onClose: () => void;
}

export function EventConfigModal({ event, onClose }: EventConfigModalProps) {
  const [activeTab, setActiveTab] = useState("matches");

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Configure: {event.title}</h2>
            <p className="text-sm text-muted-foreground">
              {event.event_matches?.length || 0} matches, {event.event_props?.length || 0} props
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4 max-w-md">
            <TabsTrigger value="matches" className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="props" className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Props
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="matches" className="mt-0">
              <MatchesConfigTab event={event} />
            </TabsContent>

            <TabsContent value="props" className="mt-0">
              <PropsConfigTab event={event} />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <EventSettingsTab event={event} onClose={onClose} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
