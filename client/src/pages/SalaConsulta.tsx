import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Video as VideoIcon, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Send,
  Loader2 
} from 'lucide-react';
import { useLocation, useRoute } from 'wouter';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import TwilioVideo, { Room, LocalVideoTrack, LocalAudioTrack, RemoteParticipant } from 'twilio-video';

/**
 * Página de Sala de Videochamada
 * Interface de videochamada com Twilio Video + Chat
 */
export default function SalaConsulta() {
  const [, params] = useRoute('/consulta/:id');
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  
  const appointmentId = params?.id ? parseInt(params.id) : null;

  const [room, setRoom] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localTracksRef = useRef<(LocalVideoTrack | LocalAudioTrack)[]>([]);

  // Buscar dados da consulta
  const { data: appointment, isLoading } = trpc.appointments.getById.useQuery(
    { id: appointmentId! },
    { enabled: !!appointmentId }
  );

  // Buscar mensagens do chat
  const { data: chatMessages, refetch: refetchMessages } = trpc.consultationChat.getMessages.useQuery(
    { appointmentId: appointmentId! },
    { 
      enabled: !!appointmentId,
      refetchInterval: 3000, // Atualizar a cada 3 segundos
    }
  );

  // Mutation para enviar mensagem
  const sendMessage = trpc.consultationChat.sendMessage.useMutation({
    onSuccess: () => {
      setChatMessage('');
      refetchMessages();
    },
    onError: (error) => {
      toast.error('Erro ao enviar mensagem');
    },
  });

  // Mutation para finalizar consulta
  const endAppointment = trpc.appointments.end.useMutation({
    onSuccess: () => {
      toast.success('Consulta finalizada');
      navigate('/consultas');
    },
    onError: (error) => {
      toast.error('Erro ao finalizar consulta');
    },
  });

  // Conectar à sala Twilio
  useEffect(() => {
    if (!appointment || !appointment.twilioRoomName) return;

    const connectToRoom = async () => {
      try {
        setIsConnecting(true);

        // Obter token do backend (médico já iniciou, então usamos join)
        const response = await fetch('/api/trpc/appointments.join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointmentId }),
        });

        if (!response.ok) {
          throw new Error('Erro ao obter token');
        }

        const data = await response.json();
        const token = data.result.data.token;

        // Conectar à sala
        const connectedRoom = await TwilioVideo.connect(token, {
          name: appointment.twilioRoomName,
          audio: true,
          video: { width: 640, height: 480 },
        });

        setRoom(connectedRoom);

        // Anexar vídeo local
        connectedRoom.localParticipant.videoTracks.forEach((publication) => {
          if (publication.track && localVideoRef.current) {
            const track = publication.track as LocalVideoTrack;
            localTracksRef.current.push(track);
            localVideoRef.current.appendChild(track.attach());
          }
        });

        // Anexar áudio local
        connectedRoom.localParticipant.audioTracks.forEach((publication) => {
          if (publication.track) {
            const track = publication.track as LocalAudioTrack;
            localTracksRef.current.push(track);
          }
        });

        // Lidar com participantes remotos
        connectedRoom.on('participantConnected', handleParticipantConnected);
        connectedRoom.on('participantDisconnected', handleParticipantDisconnected);

        // Participantes já conectados
        connectedRoom.participants.forEach(handleParticipantConnected);

        setIsConnecting(false);
        toast.success('Conectado à consulta');
      } catch (error: any) {
        console.error('Error connecting to room:', error);
        toast.error(error.message || 'Erro ao conectar');
        setIsConnecting(false);
      }
    };

    connectToRoom();

    return () => {
      // Cleanup ao desmontar
      if (room) {
        room.disconnect();
      }
      localTracksRef.current.forEach((track) => {
        track.stop();
      });
    };
  }, [appointment]);

  // Atualizar mensagens
  useEffect(() => {
    if (chatMessages) {
      setMessages(chatMessages);
    }
  }, [chatMessages]);

  const handleParticipantConnected = (participant: RemoteParticipant) => {
    console.log('Participant connected:', participant.identity);

    participant.on('trackSubscribed', (track) => {
      if (track.kind === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.appendChild(track.attach());
      }
    });

    participant.tracks.forEach((publication) => {
      if (publication.isSubscribed && publication.track) {
        if (publication.track.kind === 'video' && remoteVideoRef.current) {
          remoteVideoRef.current.appendChild(publication.track.attach());
        }
      }
    });
  };

  const handleParticipantDisconnected = (participant: RemoteParticipant) => {
    console.log('Participant disconnected:', participant.identity);
    toast.info('Participante desconectou');
  };

  const toggleVideo = () => {
    if (room) {
      room.localParticipant.videoTracks.forEach((publication) => {
        if (publication.track) {
          if (isVideoEnabled) {
            publication.track.disable();
          } else {
            publication.track.enable();
          }
        }
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (room) {
      room.localParticipant.audioTracks.forEach((publication) => {
        if (publication.track) {
          if (isAudioEnabled) {
            publication.track.disable();
          } else {
            publication.track.enable();
          }
        }
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const handleEndCall = async () => {
    if (room) {
      room.disconnect();
    }
    
    if (appointmentId) {
      await endAppointment.mutateAsync({ appointmentId });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !appointmentId) return;

    await sendMessage.mutateAsync({
      appointmentId,
      message: chatMessage,
    });
  };

  if (isLoading || !appointment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#2C3E50] mx-auto mb-4" />
          <p className="text-gray-600">Carregando consulta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-[#2C3E50] text-white p-4">
        <div className="container flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Consulta - {appointment.patient?.nomeCompleto}</h1>
            <p className="text-sm text-gray-300">
              {isConnecting ? 'Conectando...' : 'Em andamento'}
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Área de Vídeo */}
        <div className="flex-1 p-4 flex flex-col gap-4">
          {/* Vídeo Remoto (Participante) */}
          <Card className="flex-1 bg-black">
            <CardContent className="p-0 h-full relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                className="w-full h-full object-cover"
              />
              {isConnecting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <Loader2 className="h-12 w-12 animate-spin text-white" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vídeo Local (Você) */}
          <Card className="w-64 h-48 bg-black absolute bottom-24 right-8">
            <CardContent className="p-0 h-full relative">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                Você
              </div>
            </CardContent>
          </Card>

          {/* Controles */}
          <div className="flex items-center justify-center gap-4 pb-4">
            <Button
              onClick={toggleAudio}
              size="lg"
              variant={isAudioEnabled ? 'default' : 'destructive'}
              className="rounded-full h-14 w-14"
            >
              {isAudioEnabled ? <Mic /> : <MicOff />}
            </Button>

            <Button
              onClick={toggleVideo}
              size="lg"
              variant={isVideoEnabled ? 'default' : 'destructive'}
              className="rounded-full h-14 w-14"
            >
              {isVideoEnabled ? <VideoIcon /> : <VideoOff />}
            </Button>

            <Button
              onClick={handleEndCall}
              size="lg"
              variant="destructive"
              className="rounded-full h-14 w-14"
              disabled={endAppointment.isPending}
            >
              <PhoneOff />
            </Button>
          </div>
        </div>

        {/* Chat Lateral */}
        <div className="w-80 bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-[#2C3E50]">Chat</h2>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.senderType === 'doctor' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.senderType === 'doctor'
                      ? 'bg-[#F39C12] text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input de Mensagem */}
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Digite uma mensagem..."
                disabled={sendMessage.isPending}
              />
              <Button
                type="submit"
                disabled={sendMessage.isPending || !chatMessage.trim()}
                className="bg-[#F39C12] hover:bg-[#E67E22]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
