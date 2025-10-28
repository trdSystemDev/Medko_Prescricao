import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { ArrowLeft, Plus, Trash2, FileText, Send } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

interface Medication {
  medicamentoId: number;
  nomeMedicamento: string;
  dosagem: string;
  frequencia: string;
  duracao: string;
  viaAdministracao: string;
  orientacoes: string;
}

export default function NovaPrescricao() {
  const [, setLocation] = useLocation();
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [searchPatient, setSearchPatient] = useState('');
  const [searchMedication, setSearchMedication] = useState('');
  const [tipoPrescricao, setTipoPrescricao] = useState<string>('simples');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [observacoes, setObservacoes] = useState('');

  const { data: patients } = trpc.patients.list.useQuery();
  const { data: medicationsSearch } = trpc.medications.search.useQuery(
    { query: searchMedication },
    { enabled: searchMedication.length > 2 }
  );

  const createPrescription = trpc.prescriptions.create.useMutation({
    onSuccess: (data) => {
      toast.success('Prescrição criada com sucesso!');
      setLocation(`/prescricao/${data.prescription.id}`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar prescrição: ${error.message}`);
    },
  });

  const filteredPatients = patients?.filter((p) =>
    p.nomeCompleto.toLowerCase().includes(searchPatient.toLowerCase())
  );

  const addMedication = (med: any) => {
    const newMed: Medication = {
      medicamentoId: med.id,
      nomeMedicamento: med.nomeProduto,
      dosagem: '',
      frequencia: '',
      duracao: '',
      viaAdministracao: '',
      orientacoes: '',
    };
    setMedications([...medications, newMed]);
    setSearchMedication('');
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleSubmit = () => {
    if (!selectedPatientId) {
      toast.error('Selecione um paciente');
      return;
    }

    if (medications.length === 0) {
      toast.error('Adicione pelo menos um medicamento');
      return;
    }

    // Validar campos obrigatórios dos medicamentos
    for (const med of medications) {
      if (!med.dosagem || !med.frequencia || !med.duracao) {
        toast.error('Preencha todos os campos obrigatórios dos medicamentos');
        return;
      }
    }

    createPrescription.mutate({
      patientId: selectedPatientId,
      tipoReceituario: tipoPrescricao as any,
      medications: medications.map((m) => ({
        medicationId: m.medicamentoId,
        tarja: 'livre',
        nomeProduto: m.nomeMedicamento,
        dose: m.dosagem,
        frequencia: m.frequencia,
        duracao: m.duracao,
        orientacoes: m.orientacoes,
      })),
      observacoes,
    });
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
            <h1 className="text-3xl font-bold text-gray-900">Nova Prescrição</h1>
            <p className="text-gray-600 mt-2">Criar prescrição médica</p>
          </div>
        </div>

        {/* Seleção de Paciente */}
        <Card>
          <CardHeader>
            <CardTitle>Paciente</CardTitle>
            <CardDescription>Selecione o paciente para a prescrição</CardDescription>
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

        {/* Tipo de Prescrição */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Receituário</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={tipoPrescricao}
              onChange={(e) => setTipoPrescricao(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="simples">Receita Simples</option>
              <option value="controle_especial">Receita de Controle Especial (C)</option>
              <option value="azul">Receita Azul (B1/B2)</option>
              <option value="amarela">Receita Amarela (A)</option>
              <option value="retinoides">Receita para Retinóides (C2)</option>
              <option value="talidomida">Receita para Talidomida (C3)</option>
            </select>
          </CardContent>
        </Card>

        {/* Medicamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Medicamentos</CardTitle>
            <CardDescription>Adicione os medicamentos prescritos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Busca de Medicamento */}
            <div className="space-y-2">
              <Label>Buscar Medicamento</Label>
              <Input
                value={searchMedication}
                onChange={(e) => setSearchMedication(e.target.value)}
                placeholder="Digite o nome do medicamento..."
              />
            </div>

            {searchMedication.length > 2 && medicationsSearch && medicationsSearch.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {medicationsSearch.map((med) => (
                  <div
                    key={med.id}
                    className="p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => addMedication(med)}
                  >
                    <p className="font-medium">{med.nomeProduto}</p>
                    <p className="text-sm text-gray-600">{med.principioAtivo}</p>
                    <p className="text-xs text-gray-500">Tarja: {med.tarja || 'Livre'}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Lista de Medicamentos Adicionados */}
            {medications.length > 0 && (
              <div className="space-y-4 mt-6">
                {medications.map((med, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{med.nomeMedicamento}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMedication(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Dosagem *</Label>
                        <Input
                          value={med.dosagem}
                          onChange={(e) => updateMedication(index, 'dosagem', e.target.value)}
                          placeholder="Ex: 500mg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Frequência *</Label>
                        <Input
                          value={med.frequencia}
                          onChange={(e) => updateMedication(index, 'frequencia', e.target.value)}
                          placeholder="Ex: 8/8h"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duração *</Label>
                        <Input
                          value={med.duracao}
                          onChange={(e) => updateMedication(index, 'duracao', e.target.value)}
                          placeholder="Ex: 7 dias"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Via de Administração</Label>
                        <Input
                          value={med.viaAdministracao}
                          onChange={(e) =>
                            updateMedication(index, 'viaAdministracao', e.target.value)
                          }
                          placeholder="Ex: Oral"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Orientações</Label>
                        <Input
                          value={med.orientacoes}
                          onChange={(e) => updateMedication(index, 'orientacoes', e.target.value)}
                          placeholder="Ex: Tomar com água"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {medications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Plus className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Nenhum medicamento adicionado</p>
                <p className="text-sm">Busque e adicione medicamentos acima</p>
              </div>
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
              placeholder="Observações adicionais para o paciente..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setLocation('/')}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createPrescription.isPending}>
            {createPrescription.isPending ? (
              'Criando...'
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Criar Prescrição
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
