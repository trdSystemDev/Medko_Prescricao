import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Send } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function VisualizarPrescricao() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  
  const { data: prescription, isLoading } = trpc.prescriptions.getById.useQuery(
    { id: parseInt(id!) },
    { enabled: !!id }
  );

  const sendMutation = trpc.prescriptions.send.useMutation({
    onSuccess: () => {
      toast.success("Prescrição enviada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    },
  });

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
            {prescription.pdfUrl && (
              <Button variant="outline" asChild>
                <a href={prescription.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </a>
              </Button>
            )}
            <Button
              onClick={() => sendMutation.mutate({
                prescriptionId: prescription.id,
                channel: 'whatsapp'
              })}
              disabled={sendMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar via WhatsApp
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
