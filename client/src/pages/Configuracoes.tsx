import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function Configuracoes() {
  const { user } = useAuth();
  const updateProfile = trpc.user.updateProfile.useMutation();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    crm: user?.crm || '',
    crmUf: user?.crmUf || '',
    especialidade: user?.especialidade || '',
    rqe: user?.rqe || '',
    endereco: user?.endereco || '',
    telefone: user?.telefone || '',
  });

  // Atualizar formData quando user mudar
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        crm: user.crm || '',
        crmUf: user.crmUf || '',
        especialidade: user.especialidade || '',
        rqe: user.rqe || '',
        endereco: user.endereco || '',
        telefone: user.telefone || '',
      });
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile.mutateAsync(formData);
      toast.success('Configurações salvas com sucesso!');
      // Recarregar página para atualizar dados do usuário
      window.location.reload();
    } catch (error) {
      toast.error('Erro ao salvar configurações. Tente novamente.');
      console.error(error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-2">Gerencie suas informações profissionais</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>Informações básicas do médico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Digite seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados Profissionais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Profissionais</CardTitle>
              <CardDescription>Informações do registro profissional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crm">CRM</Label>
                  <Input
                    id="crm"
                    value={formData.crm}
                    onChange={(e) => handleChange('crm', e.target.value)}
                    placeholder="123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crmUf">UF do CRM</Label>
                  <Input
                    id="crmUf"
                    value={formData.crmUf}
                    onChange={(e) => handleChange('crmUf', e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rqe">RQE</Label>
                  <Input
                    id="rqe"
                    value={formData.rqe}
                    onChange={(e) => handleChange('rqe', e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Input
                  id="especialidade"
                  value={formData.especialidade}
                  onChange={(e) => handleChange('especialidade', e.target.value)}
                  placeholder="Ex: Clínica Médica, Cardiologia, etc."
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados do Consultório */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Consultório</CardTitle>
              <CardDescription>Informações que aparecerão nos documentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Textarea
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleChange('endereco', e.target.value)}
                  placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </CardContent>
          </Card>

          {/* Assinatura Digital */}
          <Card>
            <CardHeader>
              <CardTitle>Assinatura Digital</CardTitle>
              <CardDescription>Configure seu certificado digital ICP-Brasil</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Certificado Digital:</strong> Para assinar documentos digitalmente, você
                  precisa de um certificado digital ICP-Brasil (A1, A3 ou em nuvem).
                </p>
                <Button variant="outline" className="mt-4" type="button">
                  Configurar Certificado
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Integração Zenvia */}
          <Card>
            <CardHeader>
              <CardTitle>Integração Zenvia</CardTitle>
              <CardDescription>Configure o envio de SMS e WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Zenvia:</strong> Configure sua conta Zenvia para enviar prescrições e
                  atestados por SMS ou WhatsApp.
                </p>
                <Button variant="outline" className="mt-4" type="button">
                  Configurar Zenvia
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
