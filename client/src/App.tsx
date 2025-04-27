import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { CareerConfidenceProvider } from "./contexts/CareerConfidenceContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <CareerConfidenceProvider>
            <Router />
          </CareerConfidenceProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
