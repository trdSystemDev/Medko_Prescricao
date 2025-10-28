import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { toast } from 'sonner';

export default function EditarPaciente() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/pacientes/:id');
  const patientId = params?.id ? parseInt(params.id) : null;

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    email: '',
    endereco: '',
  });

  // Buscar dados do paciente
  const { data: patient, isLoading } = trpc.patients.getById.useQuery(
    { id: patientId! },
    { enabled: !!patientId }
  );

  const updatePatient = trpc.patients.update.useMutation({
    onSuccess: () => {
      toast.success('Paciente atualizado com sucesso!');
      setLocation('/pacientes');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar paciente: ${error.message}`);
    },
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        nomeCompleto: patient.nomeCompleto || '',
        cpf: patient.cpf || '',
        dataNascimento: patient.dataNascimento || '',
        telefone: patient.telefone || '',
        email: patient.email || '',
        endereco: patient.endereco || '',
      });
    }
  }, [patient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) {
      toast.error('ID do paciente inválido');
      return;
    }

    if (!formData.nomeCompleto) {
      toast.error('Nome completo é obrigatório');
      return;
    }

    updatePatient.mutate({
      id: patientId,
      ...formData,
    });
  };

  if (!patientId) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600">ID do paciente inválido</p>
          <Button onClick={() => setLocation('/pacientes')} className="mt-4">
            Voltar para Pacientes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p>Carregando dados do paciente...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600">Paciente não encontrado</p>
          <Button onClick={() => setLocation('/pacientes')} className="mt-4">
            Voltar para Pacientes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation('/pacientes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Paciente</h1>
            <p className="text-gray-600 mt-2">Atualize os dados do paciente</p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Dados do Paciente</CardTitle>
              <CardDescription>Informações pessoais e de contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeCompleto">
                    Nome Completo <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="nomeCompleto"
                    value={formData.nomeCompleto}
                    onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                    placeholder="Nome completo do paciente"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setLocation('/pacientes')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updatePatient.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updatePatient.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
