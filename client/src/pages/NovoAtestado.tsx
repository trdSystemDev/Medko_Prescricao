import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileText } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export default function NovoAtestado() {
  const [, setLocation] = useLocation();
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [searchPatient, setSearchPatient] = useState('');
  const [tipoAtestado, setTipoAtestado] = useState<string>('comparecimento');
  const [cid, setCid] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const { data: patients } = trpc.patients.list.useQuery();

  const filteredPatients = patients?.filter((p) =>
    p.nomeCompleto.toLowerCase().includes(searchPatient.toLowerCase())
  );

  const handleSubmit = () => {
    if (!selectedPatientId) {
      toast.error('Selecione um paciente');
      return;
    }

    if (tipoAtestado === 'afastamento' && (!dataInicio || !dataFim)) {
      toast.error('Preencha o período de afastamento');
      return;
    }

    toast.success('Atestado criado com sucesso!');
    setLocation('/historico');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Novo Atestado</h1>
            <p className="text-gray-600 mt-2">Emitir atestado médico</p>
          </div>
        </div>

        {/* Seleção de Paciente */}
        <Card>
          <CardHeader>
            <CardTitle>Paciente</CardTitle>
            <CardDescription>Selecione o paciente para o atestado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar Paciente</Label>
              <Input
                value={searchPatient}
                onChange={(e) => setSearchPatient(e.target.value)}
                placeholder="Digite o nome do paciente..."
              />
            </div>
            {searchPatient && filteredPatients && filteredPatients.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 ${
                      selectedPatientId === patient.id ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => {
                      setSelectedPatientId(patient.id);
                      setSearchPatient(patient.nomeCompleto);
                    }}
                  >
                    <p className="font-medium">{patient.nomeCompleto}</p>
                    <p className="text-sm text-gray-600">{patient.cpf || 'CPF não informado'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tipo de Atestado */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Atestado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select
                value={tipoAtestado}
                onChange={(e) => setTipoAtestado(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="comparecimento">Atestado de Comparecimento</option>
                <option value="afastamento">Atestado de Afastamento</option>
                <option value="obito">Declaração de Óbito</option>
              </select>
            </div>

            {tipoAtestado === 'afastamento' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataInicio">Data de Início *</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataFim">Data de Término *</Label>
                    <Input
                      id="dataFim"
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cid">CID (opcional)</Label>
                  <Input
                    id="cid"
                    value={cid}
                    onChange={(e) => setCid(e.target.value)}
                    placeholder="Ex: M54.5"
                  />
                  <p className="text-xs text-gray-500">
                    Código Internacional de Doenças (opcional conforme legislação)
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre o atestado..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setLocation('/')}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            <FileText className="h-4 w-4 mr-2" />
            Emitir Atestado
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
