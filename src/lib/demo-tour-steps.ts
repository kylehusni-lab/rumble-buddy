import { TourStep } from "@/components/tour/TourContext";

export const HOST_SETUP_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: "[data-tour='event-status']",
    title: "Welcome to Demo Mode",
    content: "This is your Host Dashboard where you manage the watch party. We've pre-loaded 6 players with random picks so you can see everything in action.",
    placement: "bottom",
  },
  {
    id: "guests-joined",
    target: "[data-tour='guests-count']",
    title: "Guest Tracking",
    content: "See how many guests have joined and how many have completed their picks. In a real party, this updates in real-time as friends join.",
    placement: "bottom",
  },
  {
    id: "my-picks",
    target: "[data-tour='my-picks']",
    title: "Your Picks",
    content: "As the host, you're also a player. Tap Edit to make your own predictions for matches, Rumble winners, and prop bets.",
    placement: "bottom",
  },
  {
    id: "guests-list",
    target: "[data-tour='guests-list']",
    title: "Guest Status",
    content: "Track each guest's progress. Green means they've completed all picks. You can expand this to see everyone's status.",
    placement: "top",
  },
  {
    id: "tv-mode",
    target: "[data-tour='tv-mode']",
    title: "TV Display",
    content: "Cast this to your TV during the event. It shows the leaderboard, everyone's picks, and updates live as matches are scored.",
    placement: "top",
  },
  {
    id: "start-event",
    target: "[data-tour='start-event']",
    title: "Start the Event",
    content: "When everyone's ready, hit Start Event. This locks picks, distributes Rumble entry numbers, and takes you to the live scoring dashboard.",
    placement: "top",
  },
];

export const PLAYER_PICKS_TOUR_STEPS: TourStep[] = [
  {
    id: "pick-card",
    target: "[data-tour='pick-card']",
    title: "Making Picks",
    content: "Swipe through cards to make your predictions. Each card is a different category - matches, Rumble winners, and prop bets.",
    placement: "bottom",
  },
  {
    id: "progress",
    target: "[data-tour='progress-bar']",
    title: "Track Progress",
    content: "The progress bar shows how many picks you've completed. Fill the bar to be ready for the event.",
    placement: "bottom",
  },
];

export const HOST_CONTROL_TOUR_STEPS: TourStep[] = [
  {
    id: "scoring-tabs",
    target: "[data-tour='scoring-tabs']",
    title: "Live Scoring",
    content: "Use these tabs to switch between Matches, Men's Rumble, and Women's Rumble scoring panels.",
    placement: "bottom",
  },
  {
    id: "match-scoring",
    target: "[data-tour='match-card']",
    title: "Score Matches",
    content: "As each match ends, tap the winner to award points to everyone who picked correctly.",
    placement: "bottom",
  },
];
