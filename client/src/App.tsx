import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { CareerConfidenceProvider } from "./contexts/CareerConfidenceContext";
import { LanguageProvider } from "./contexts/LanguageContext";
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
    <TooltipProvider>
      <LanguageProvider>
        <CareerConfidenceProvider>
          <Router />
        </CareerConfidenceProvider>
      </LanguageProvider>
    </TooltipProvider>
  );
}

export default App;
