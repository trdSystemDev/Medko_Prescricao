import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Save } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { useState } from 'react';

/**
 * Página para agendar nova consulta
 */
export default function NovaConsulta() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);

  const [patientId, setPatientId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [motivo, setMotivo] = useState('');

  // Buscar lista de pacientes
  const { data: patients, isLoading: loadingPatients } = trpc.patients.list.useQuery();

  // Mutation para criar consulta
  const createAppointment = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success('Consulta agendada com sucesso!');
      navigate('/consultas');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao agendar consulta');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId || !scheduledDate || !scheduledTime) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Combinar data e hora
    const dateTime = `${scheduledDate}T${scheduledTime}:00`;

    try {
      await createAppointment.mutateAsync({
        patientId: parseInt(patientId),
        scheduledDate: dateTime,
        motivo: motivo || undefined,
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">Agendar Nova Consulta</h1>
        <p className="text-gray-600">Agende uma consulta de teleconsulta com seu paciente</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Consulta</CardTitle>
          <CardDescription>Preencha as informações para agendar a consulta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Paciente */}
            <div className="space-y-2">
              <Label htmlFor="patient">
                Paciente <span className="text-red-500">*</span>
              </Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger id="patient">
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {loadingPatients ? (
                    <SelectItem value="loading" disabled>
                      Carregando...
                    </SelectItem>
                  ) : patients && patients.length > 0 ? (
                    patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.nomeCompleto}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>
                      Nenhum paciente cadastrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="date">
                Data <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Hora */}
            <div className="space-y-2">
              <Label htmlFor="time">
                Hora <span className="text-red-500">*</span>
              </Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
              />
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da Consulta</Label>
              <Textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Descreva o motivo da consulta (opcional)"
                rows={4}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={createAppointment.isPending}
                className="flex-1 bg-[#F39C12] hover:bg-[#E67E22] text-white"
              >
                {createAppointment.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Agendando...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Agendar Consulta
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/consultas')}
                disabled={createAppointment.isPending}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
