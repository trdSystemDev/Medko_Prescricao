import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download, Edit, FileText, Loader2, Send, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function VisualizarPedidoExame() {
  const { user, loading: authLoading } = useAuth();
  const [, params] = useRoute("/pedidos-exames/:id");
  const [, setLocation] = useLocation();
  const [editMode, setEditMode] = useState(false);

  const examRequestId = params?.id ? parseInt(params.id) : null;

  const { data: examRequest, isLoading, error } = trpc.examRequests.getById.useQuery(
    { id: examRequestId! },
    { enabled: !!examRequestId }
  );

  const { data: patient } = trpc.patients.getById.useQuery(
    { id: examRequest?.patientId! },
    { enabled: !!examRequest?.patientId }
  );

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !examRequest) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Pedido de exame não encontrado ou você não tem permissão para visualizá-lo.
            </p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => setLocation("/historico")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Histórico
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const exams = typeof examRequest.exames === 'string' 
    ? JSON.parse(examRequest.exames) 
    : examRequest.exames;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/historico")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Pedido de Exames #{examRequest.id}</h1>
              <p className="text-muted-foreground">
                Criado em {new Date(examRequest.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {examRequest.pdfUrl && (
              <Button variant="outline" onClick={() => window.open(examRequest.pdfUrl!, '_blank')}>
                <FileText className="mr-2 h-4 w-4" />
                Ver PDF
              </Button>
            )}
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={() => setEditMode(!editMode)}>
              <Edit className="mr-2 h-4 w-4" />
              {editMode ? 'Cancelar Edição' : 'Editar'}
            </Button>
          </div>
        </div>

        {editMode ? (
          <Card>
            <CardHeader>
              <CardTitle>Modo de Edição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Para editar este pedido de exames, você pode criar um novo pedido baseado neste.
              </p>
              <Button onClick={() => {
                setLocation(`/novo-pedido-exame?patientId=${examRequest.patientId}`);
                toast.info("Você pode copiar os dados do pedido anterior");
              }}>
                Criar Novo Pedido Baseado Neste
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Informações do Paciente */}
            {patient && (
              <Card>
                <CardHeader>
                  <CardTitle>Paciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Nome</div>
                      <div>{patient.nomeCompleto}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">CPF</div>
                      <div>{patient.cpf}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Data de Nascimento</div>
                      <div>{patient.dataNascimento ? new Date(patient.dataNascimento).toLocaleDateString('pt-BR') : 'N/A'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informações do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Data de Criação</div>
                    <div>{new Date(examRequest.createdAt).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>

                {examRequest.observacoes && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-muted-foreground">Observações</div>
                    <div className="mt-1 p-3 bg-muted rounded-md">{examRequest.observacoes}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exames Solicitados */}
            <Card>
              <CardHeader>
                <CardTitle>Exames Solicitados ({exams.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exams.map((exam: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="font-semibold text-lg mb-2">{exam.nome}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {exam.codigo && (
                          <div>
                            <span className="text-muted-foreground">Código:</span> {exam.codigo}
                          </div>
                        )}
                        {exam.tipo && (
                          <div>
                            <span className="text-muted-foreground">Tipo:</span> {exam.tipo}
                          </div>
                        )}
                      </div>
                      {exam.observacoes && (
                        <div className="mt-2">
                          <span className="text-muted-foreground">Observações:</span>
                          <div className="mt-1 p-2 bg-muted rounded text-sm">{exam.observacoes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Informações de Assinatura */}
            {examRequest.assinaturaData && (
              <Card>
                <CardHeader>
                  <CardTitle>Assinatura Digital</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Documento assinado digitalmente em {new Date(examRequest.createdAt).toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            )}


          </>
        )}
      </div>
    </DashboardLayout>
  );
}
