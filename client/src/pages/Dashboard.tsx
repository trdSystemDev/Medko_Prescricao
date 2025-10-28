import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { FileText, Users, ClipboardList, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';

export default function Dashboard() {
  const { data: prescriptions, isLoading: loadingPrescriptions } = trpc.prescriptions.list.useQuery();
  const { data: patients, isLoading: loadingPatients } = trpc.patients.list.useQuery();

  const stats = [
    {
      title: 'Total de Pacientes',
      value: patients?.length || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Prescrições este Mês',
      value: prescriptions?.length || 0,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Atestados este Mês',
      value: 0,
      icon: ClipboardList,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Crescimento',
      value: '+12%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const quickActions = [
    {
      title: 'Nova Prescrição',
      description: 'Criar prescrição médica',
      icon: FileText,
      href: '/prescricao/nova',
      color: 'bg-primary hover:bg-primary/90',
    },
    {
      title: 'Novo Atestado',
      description: 'Emitir atestado médico',
      icon: ClipboardList,
      href: '/atestado/novo',
      color: 'bg-accent hover:bg-accent/90',
    },
    {
      title: 'Cadastrar Paciente',
      description: 'Adicionar novo paciente',
      icon: Users,
      href: '/pacientes/novo',
      color: 'bg-green-600 hover:bg-green-700',
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
                    <Link href={`/prescricao/${prescription.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </Link>
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
      </div>
    </DashboardLayout>
  );
}
