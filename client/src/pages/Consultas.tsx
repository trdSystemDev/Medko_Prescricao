import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Calendar, Clock, User } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { useState } from 'react';

/**
 * Página de Consultas de Hoje do Médico
 * Lista consultas agendadas para o dia atual
 * Permite iniciar videochamada com cada paciente
 */
export default function Consultas() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const [startingAppointment, setStartingAppointment] = useState<number | null>(null);

  // Buscar consultas de hoje
  const today = new Date().toISOString().split('T')[0];
  const { data: appointments, isLoading, refetch } = trpc.appointments.list.useQuery({ date: today });

  // Mutation para iniciar consulta
  const startAppointment = trpc.appointments.start.useMutation({
    onSuccess: (data, variables) => {
      toast.success('Sala de vídeo criada!');
      // Redirecionar para página de videochamada
      navigate(`/consulta/${variables.appointmentId}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao iniciar consulta');
      setStartingAppointment(null);
    },
  });

  const handleStartConsultation = async (appointmentId: number) => {
    setStartingAppointment(appointmentId);
    try {
      await startAppointment.mutateAsync({ appointmentId });
    } catch (error) {
      console.error('Error starting consultation:', error);
    }
  };

  // Filtrar consultas de hoje
  const todayAppointments = appointments?.filter((apt) => {
    const aptDate = new Date(apt.scheduledDate).toISOString().split('T')[0];
    return aptDate === today;
  }) || [];

  // Separar por status
  const agendadas = todayAppointments.filter((apt) => apt.status === 'agendada');
  const emAndamento = todayAppointments.filter((apt) => apt.status === 'em_andamento');
  const finalizadas = todayAppointments.filter((apt) => apt.status === 'finalizada');

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada':
        return 'text-blue-600 bg-blue-50';
      case 'em_andamento':
        return 'text-green-600 bg-green-50';
      case 'finalizada':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'agendada':
        return 'Agendada';
      case 'em_andamento':
        return 'Em Andamento';
      case 'finalizada':
        return 'Finalizada';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C3E50] mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando consultas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">Consultas de Hoje</h1>
        <p className="text-gray-600">
          Gerencie suas consultas agendadas e inicie videochamadas com seus pacientes
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Agendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{agendadas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{emAndamento.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Finalizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{finalizadas.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de consultas */}
      {todayAppointments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma consulta agendada para hoje
              </h3>
              <p className="text-gray-600 mb-6">
                Você não tem consultas agendadas para hoje. Agende uma nova consulta para começar.
              </p>
              <Button
                onClick={() => navigate('/nova-consulta')}
                className="bg-[#F39C12] hover:bg-[#E67E22] text-white"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Agendar Consulta
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {todayAppointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-[#2C3E50]" />
                        <span className="font-semibold text-lg text-[#2C3E50]">
                          {appointment.patient?.nomeCompleto || 'Paciente'}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(appointment.scheduledDate)}</span>
                      </div>
                      {appointment.motivo && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Motivo:</span>
                          <span>{appointment.motivo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {appointment.status === 'agendada' && (
                      <Button
                        onClick={() => handleStartConsultation(appointment.id)}
                        disabled={startingAppointment === appointment.id}
                        className="bg-[#F39C12] hover:bg-[#E67E22] text-white"
                      >
                        {startingAppointment === appointment.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Iniciando...
                          </>
                        ) : (
                          <>
                            <Video className="mr-2 h-4 w-4" />
                            Iniciar Consulta
                          </>
                        )}
                      </Button>
                    )}

                    {appointment.status === 'em_andamento' && (
                      <Button
                        onClick={() => navigate(`/consulta/${appointment.id}`)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Video className="mr-2 h-4 w-4" />
                        Entrar na Sala
                      </Button>
                    )}

                    {appointment.status === 'finalizada' && (
                      <span className="text-sm text-gray-500">Consulta finalizada</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
