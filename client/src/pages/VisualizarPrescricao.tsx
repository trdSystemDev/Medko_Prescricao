import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Send, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function VisualizarPrescricao() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  
  const { data: prescription, isLoading } = trpc.prescriptions.getById.useQuery(
    { id: parseInt(id!) },
    { enabled: !!id }
  );

  const generatePdfMutation = trpc.prescriptions.generatePDF.useMutation({
    onSuccess: (data) => {
      toast.success("PDF gerado com sucesso!");
      if (data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      }
    },
    onError: (error) => {
      toast.error(`Erro ao gerar PDF: ${error.message}`);
    },
  });

  const handleSendWhatsApp = () => {
    if (!prescription?.pdfUrl) {
      toast.error('Gere o PDF primeiro antes de enviar');
      return;
    }
    const message = `Olá! Segue a prescrição médica: ${prescription.pdfUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

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

  if (!prescription) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-muted-foreground">Prescrição não encontrada</div>
          <Button onClick={() => setLocation("/historico")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Histórico
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const medicamentos = JSON.parse(prescription.medicamentos as string);

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
              <h1 className="text-3xl font-bold">Prescrição #{prescription.id}</h1>
              <p className="text-muted-foreground">
                {new Date(prescription.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => generatePdfMutation.mutate({ prescriptionId: prescription.id })}
              disabled={generatePdfMutation.isPending}
            >
              <FileText className="w-4 h-4 mr-2" />
              {generatePdfMutation.isPending ? 'Gerando...' : 'Gerar PDF'}
            </Button>
            
            {prescription.pdfUrl && (
              <Button variant="outline" asChild>
                <a href={prescription.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </a>
              </Button>
            )}
            
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            
            {prescription.pdfUrl && (
              <Button
                onClick={handleSendWhatsApp}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar via WhatsApp
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Nome</div>
                <div>Paciente ID: {prescription.patientId}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipo de Receituário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{prescription.tipoReceituario}</div>
              {prescription.dataValidade && (
                <div className="text-sm text-muted-foreground mt-2">
                  Válida até: {new Date(prescription.dataValidade).toLocaleDateString('pt-BR')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Medicamentos Prescritos</CardTitle>
            <CardDescription>{medicamentos.length} medicamento(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {medicamentos.map((med: any, index: number) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <div className="font-semibold">{med.nome}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <div><strong>Posologia:</strong> {med.posologia}</div>
                    {med.orientacoes && (
                      <div className="mt-1"><strong>Orientações:</strong> {med.orientacoes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {prescription.orientacoes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{prescription.orientacoes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
