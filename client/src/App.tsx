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
import VisualizarPrescricao from "./pages/VisualizarPrescricao";
import VisualizarAtestado from "./pages/VisualizarAtestado";
import VisualizarPedidoExame from "./pages/VisualizarPedidoExame";
import Templates from "./pages/Templates";
import EditarPaciente from "./pages/EditarPaciente";
import Consultas from "./pages/Consultas";
import NovaConsulta from "./pages/NovaConsulta";
import SalaConsulta from "./pages/SalaConsulta";

function Router() {
  // Rotas do sistema Medko - Páginas de visualização implementadas
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path="/pacientes" component={Pacientes} />
      <Route path="/pacientes/novo" component={NovoPaciente} />
      <Route path="/pacientes/:id" component={EditarPaciente} />
      <Route path="/prescricao/nova" component={NovaPrescricao} />
      <Route path="/prescricao/:id" component={VisualizarPrescricao} />
      <Route path="/atestado/novo" component={NovoAtestado} />
      <Route path="/atestados/:id" component={VisualizarAtestado} />
      <Route path="/novo-pedido-exame" component={NovoPedidoExame} />
      <Route path="/pedidos-exames/:id" component={VisualizarPedidoExame} />
      <Route path="/historico" component={Historico} />
      <Route path="/medicamentos" component={Medicamentos} />
      <Route path="/configuracoes" component={Configuracoes} />
      <Route path="/templates" component={Templates} />
      <Route path="/consultas" component={Consultas} />
      <Route path="/nova-consulta" component={NovaConsulta} />
      <Route path="/consulta/:id" component={SalaConsulta} />
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
