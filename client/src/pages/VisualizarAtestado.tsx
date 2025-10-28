import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Send, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function VisualizarAtestado() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  
  const { data: certificate, isLoading } = trpc.certificates.getById.useQuery(
    { id: parseInt(id!) },
    { enabled: !!id }
  );

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!certificate) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-muted-foreground">Atestado não encontrado</div>
          <Button onClick={() => setLocation("/historico")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Histórico
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/historico")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Atestado #{certificate.id}</h1>
              <p className="text-muted-foreground">
                {new Date(certificate.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {certificate.pdfUrl && (
              <Button variant="outline" asChild>
                <a href={certificate.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </a>
              </Button>
            )}
            
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Paciente</div>
                <div>ID: {certificate.patientId}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipo de Atestado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold capitalize">{certificate.tipo}</div>
            </CardContent>
          </Card>
        </div>

        {certificate.tipo === 'afastamento' && (
          <Card>
            <CardHeader>
              <CardTitle>Período de Afastamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {certificate.dataInicio && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Data Início</div>
                  <div>{new Date(certificate.dataInicio).toLocaleDateString('pt-BR')}</div>
                </div>
              )}
              {certificate.dataFim && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Data Fim</div>
                  <div>{new Date(certificate.dataFim).toLocaleDateString('pt-BR')}</div>
                </div>
              )}

            </CardContent>
          </Card>
        )}

        {certificate.cid && (
          <Card>
            <CardHeader>
              <CardTitle>CID</CardTitle>
            </CardHeader>
            <CardContent>
              <div>{certificate.cid}</div>
            </CardContent>
          </Card>
        )}

        {certificate.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{certificate.observacoes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
