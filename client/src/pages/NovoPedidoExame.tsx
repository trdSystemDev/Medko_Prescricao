import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { ArrowLeft, Plus, Trash2, FileText } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

interface Exam {
  examId: number;
  nomeExame: string;
  indicacao: string;
}

export default function NovoPedidoExame() {
  const [, setLocation] = useLocation();
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [searchPatient, setSearchPatient] = useState('');
  const [searchExam, setSearchExam] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [observacoes, setObservacoes] = useState('');

  const { data: patients } = trpc.patients.list.useQuery();
  const { data: examsSearch } = trpc.exams.search.useQuery(
    { query: searchExam },
    { enabled: searchExam.length > 2 }
  );

  const filteredPatients = patients?.filter((p) =>
    p.nomeCompleto.toLowerCase().includes(searchPatient.toLowerCase())
  );

  const addExam = (exam: any) => {
    const newExam: Exam = {
      examId: exam.id,
      nomeExame: exam.nome,
      indicacao: '',
    };
    setExams([...exams, newExam]);
    setSearchExam('');
  };

  const removeExam = (index: number) => {
    setExams(exams.filter((_, i) => i !== index));
  };

  const updateExam = (index: number, field: keyof Exam, value: string) => {
    const updated = [...exams];
    updated[index] = { ...updated[index], [field]: value };
    setExams(updated);
  };

  const handleSubmit = () => {
    if (!selectedPatientId) {
      toast.error('Selecione um paciente');
      return;
    }

    if (exams.length === 0) {
      toast.error('Adicione pelo menos um exame');
      return;
    }

    toast.success('Pedido de exame criado com sucesso!');
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
            <h1 className="text-3xl font-bold text-gray-900">Novo Pedido de Exame</h1>
            <p className="text-gray-600 mt-2">Solicitar exames laboratoriais</p>
          </div>
        </div>

        {/* Seleção de Paciente */}
        <Card>
          <CardHeader>
            <CardTitle>Paciente</CardTitle>
            <CardDescription>Selecione o paciente para o pedido de exame</CardDescription>
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

        {/* Exames */}
        <Card>
          <CardHeader>
            <CardTitle>Exames</CardTitle>
            <CardDescription>Adicione os exames solicitados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Busca de Exame */}
            <div className="space-y-2">
              <Label>Buscar Exame</Label>
              <Input
                value={searchExam}
                onChange={(e) => setSearchExam(e.target.value)}
                placeholder="Digite o nome do exame ou código TUSS/SUS..."
              />
            </div>

            {searchExam.length > 2 && examsSearch && examsSearch.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {examsSearch.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => addExam(exam)}
                  >
                    <p className="font-medium">{exam.nome}</p>
                    <p className="text-sm text-gray-600">
                      TUSS: {exam.codigoTuss || 'N/A'} | SUS: {exam.codigoSus || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Lista de Exames Adicionados */}
            {exams.length > 0 && (
              <div className="space-y-4 mt-6">
                {exams.map((exam, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{exam.nomeExame}</h4>
                      <Button variant="ghost" size="icon" onClick={() => removeExam(index)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Indicação Clínica</Label>
                      <Textarea
                        value={exam.indicacao}
                        onChange={(e) => updateExam(index, 'indicacao', e.target.value)}
                        placeholder="Descreva a indicação clínica para este exame..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {exams.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Plus className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Nenhum exame adicionado</p>
                <p className="text-sm">Busque e adicione exames acima</p>
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
              placeholder="Observações adicionais para o laboratório..."
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
            Criar Pedido
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
