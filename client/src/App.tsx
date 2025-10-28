import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Pacientes from "./pages/Pacientes";
import NovoPaciente from "./pages/NovoPaciente";
import NovaPrescricao from "./pages/NovaPrescricao";
import Historico from "./pages/Historico";
import Medicamentos from "./pages/Medicamentos";
import NovoAtestado from "./pages/NovoAtestado";
import Configuracoes from "./pages/Configuracoes";
import NovoPedidoExame from "./pages/NovoPedidoExame";
import Templates from "./pages/Templates";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path="/pacientes" component={Pacientes} />
      <Route path="/pacientes/novo" component={NovoPaciente} />
      <Route path="/prescricao/nova" component={NovaPrescricao} />
      <Route path="/historico" component={Historico} />
      <Route path="/medicamentos" component={Medicamentos} />
      <Route path="/atestado/novo" component={NovoAtestado} />
       <Route path="/configuracoes" component={Configuracoes} />
      <Route path="/novo-pedido-exame" component={NovoPedidoExame} />
      <Route path="/templates" component={Templates} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
