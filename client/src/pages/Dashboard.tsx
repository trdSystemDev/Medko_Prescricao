import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { FileText, Users, ClipboardList, TrendingUp, Download, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'wouter';

export default function Dashboard() {
  const { data: prescriptions, isLoading: loadingPrescriptions } = trpc.prescriptions.list.useQuery();
  const { data: patients, isLoading: loadingPatients } = trpc.patients.list.useQuery();
  const { data: certificates, isLoading: loadingCertificates } = trpc.certificates.list.useQuery();

  const generatePdfMutation = trpc.prescriptions.generatePDF.useMutation({
    onSuccess: (data) => {
      toast.success('PDF gerado com sucesso!');
      window.location.reload();
    },
    onError: (error) => {
      toast.error(`Erro ao gerar PDF: ${error.message}`);
    },
  });

  const handleSendWhatsApp = (pdfUrl: string) => {
    const message = `Olá! Segue a prescrição médica: ${pdfUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const stats = [
    {
      title: 'Total de Pacientes',
      value: patients?.length || 0,
      description: 'Pacientes cadastrados',
      icon: Users,
      color: 'text-[#2C3E50]',
      bgColor: 'bg-[#2C3E50]/10',
    },
    {
      title: 'Prescrições este Mês',
      value: prescriptions?.length || 0,
      description: 'Últimas prescrições emitidas',
      icon: FileText,
      color: 'text-[#F39C12]',
      bgColor: 'bg-[#F39C12]/10',
    },
    {
      title: 'Atestados este Mês',
      value: certificates?.length || 0,
      description: 'Atestados médicos emitidos',
      icon: ClipboardList,
      color: 'text-[#F39C12]',
      bgColor: 'bg-[#F39C12]/10',
    },
    {
      title: 'Crescimento',
      value: '+12%',
      description: 'Comparação com mês anterior',
      icon: TrendingUp,
      color: 'text-[#2C3E50]',
      bgColor: 'bg-[#2C3E50]/10',
    },
  ];

  const quickActions = [
    {
      title: 'Nova Prescrição',
      description: 'Criar prescrição médica',
      icon: FileText,
      href: '/prescricao/nova',
      color: 'bg-[#2C3E50] hover:bg-[#2C3E50]/90',
    },
    {
      title: 'Novo Atestado',
      description: 'Emitir atestado médico',
      icon: ClipboardList,
      href: '/atestado/novo',
      color: 'bg-[#F39C12] hover:bg-[#F39C12]/90',
    },
    {
      title: 'Cadastrar Paciente',
      description: 'Adicionar novo paciente',
      icon: Users,
      href: '/pacientes/novo',
      color: 'bg-[#F39C12] hover:bg-[#F39C12]/90',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Bem-vindo ao Medko - Sua plataforma completa de prescrição médica digital</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${action.color} text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{action.title}</CardTitle>
                          <CardDescription>{action.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Prescrições Recentes</CardTitle>
            <CardDescription>Últimas prescrições emitidas</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPrescriptions ? (
              <p className="text-gray-500">Carregando...</p>
            ) : prescriptions && prescriptions.length > 0 ? (
              <div className="space-y-4">
                {prescriptions.slice(0, 5).map((prescription) => (
                  <div
                    key={prescription.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">Prescrição #{prescription.id}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(prescription.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!prescription.pdfUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generatePdfMutation.mutate({ prescriptionId: prescription.id })}
                          disabled={generatePdfMutation.isPending}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          {generatePdfMutation.isPending ? 'Gerando...' : 'Gerar PDF'}
                        </Button>
                      )}
                      {prescription.pdfUrl && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a href={prescription.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-1" />
                              PDF
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendWhatsApp(prescription.pdfUrl!)}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            WhatsApp
                          </Button>
                        </>
                      )}
                      <Link href={`/prescricao/${prescription.id}`}>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Nenhuma prescrição encontrada</p>
                <Link href="/prescricao/nova">
                  <Button className="mt-4">Criar Primeira Prescrição</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Certificates */}
        <Card>
          <CardHeader>
            <CardTitle>Atestados Recentes</CardTitle>
            <CardDescription>Últimos atestados emitidos</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCertificates ? (
              <p className="text-gray-500">Carregando...</p>
            ) : certificates && certificates.length > 0 ? (
              <div className="space-y-4">
                {certificates.slice(0, 5).map((certificate) => (
                  <div
                    key={certificate.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">Atestado #{certificate.id}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(certificate.createdAt).toLocaleDateString('pt-BR')} - {certificate.tipo}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {certificate.pdfUrl && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a href={certificate.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-1" />
                              PDF
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const message = `Olá! Segue o atestado médico: ${certificate.pdfUrl}`;
                              window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                            }}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            WhatsApp
                          </Button>
                        </>
                      )}
                      <Link href={`/atestados/${certificate.id}`}>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Nenhum atestado encontrado</p>
                <Link href="/atestado/novo">
                  <Button className="mt-4">Criar Primeiro Atestado</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
