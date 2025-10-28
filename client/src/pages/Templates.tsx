import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { FileText, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function Templates() {
  const { data: prescricaoTemplates, refetch: refetchPrescricao } = trpc.templates.list.useQuery({
    tipo: 'prescricao',
  });
  const { data: atestadoTemplates, refetch: refetchAtestado } = trpc.templates.list.useQuery({
    tipo: 'atestado',
  });
  const { data: exameTemplates, refetch: refetchExame } = trpc.templates.list.useQuery({
    tipo: 'exame',
  });

  const deleteTemplate = trpc.templates.delete.useMutation({
    onSuccess: () => {
      toast.success('Modelo excluído com sucesso');
      refetchPrescricao();
      refetchAtestado();
      refetchExame();
    },
    onError: () => {
      toast.error('Erro ao excluir modelo');
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este modelo?')) {
      deleteTemplate.mutate({ id });
    }
  };

  const renderTemplateList = (templates: any[] | undefined, tipo: string) => {
    if (!templates || templates.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>Nenhum modelo salvo</p>
          <p className="text-sm mt-1">
            Crie um modelo ao salvar uma {tipo === 'prescricao' ? 'prescrição' : tipo === 'atestado' ? 'atestado' : 'pedido de exame'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.nome}</CardTitle>
                  <CardDescription>
                    Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" title="Visualizar">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(template.id)}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 p-3 rounded">
                  {JSON.stringify(JSON.parse(template.dados), null, 2).substring(0, 200)}...
                </pre>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modelos Salvos</h1>
          <p className="text-gray-600 mt-2">Gerencie seus modelos de prescrições, atestados e pedidos de exames</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="prescricao" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="prescricao">
              Prescrições ({prescricaoTemplates?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="atestado">
              Atestados ({atestadoTemplates?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="exame">
              Pedidos de Exames ({exameTemplates?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prescricao" className="mt-6">
            {renderTemplateList(prescricaoTemplates, 'prescricao')}
          </TabsContent>

          <TabsContent value="atestado" className="mt-6">
            {renderTemplateList(atestadoTemplates, 'atestado')}
          </TabsContent>

          <TabsContent value="exame" className="mt-6">
            {renderTemplateList(exameTemplates, 'exame')}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
