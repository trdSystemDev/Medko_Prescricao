import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { trpc } from '@/lib/trpc';
import { FileText, Search, Eye, Download, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

export default function Historico() {
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLocation] = useLocation();
  const { data: prescriptions, isLoading } = trpc.prescriptions.list.useQuery();
  const { data: certificates, isLoading: loadingCertificates } = trpc.certificates.list.useQuery();

  const filteredPrescriptions = prescriptions?.filter((p) =>
    p.id.toString().includes(searchTerm)
  );

  const filteredCertificates = certificates?.filter((c: any) =>
    c.id.toString().includes(searchTerm)
  );

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      simples: 'Receita Simples',
      controle_especial: 'Controle Especial',
      azul: 'Receita Azul',
      amarela: 'Receita Amarela',
      retinoides: 'Retinóides',
      talidomida: 'Talidomida',
    };
    return labels[tipo] || tipo;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      rascunho: 'bg-gray-100 text-gray-800',
      assinada: 'bg-green-100 text-green-800',
      enviada: 'bg-blue-100 text-blue-800',
      cancelada: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || ''}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Histórico</h1>
          <p className="text-gray-600 mt-2">Visualize todos os documentos emitidos</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Prescriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Prescrições</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-gray-500">Carregando...</p>
            ) : filteredPrescriptions && filteredPrescriptions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.map((prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell className="font-medium">#{prescription.id}</TableCell>
                      <TableCell>
                        {new Date(prescription.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{getTipoLabel(prescription.tipoReceituario)}</TableCell>
                      <TableCell>{getStatusBadge('assinada')}</TableCell>
                      <TableCell>
                        {prescription.dataValidade
                          ? new Date(prescription.dataValidade).toLocaleDateString('pt-BR')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            title="Visualizar"
                            onClick={() => setLocation(`/prescricao/${prescription.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {prescription.pdfUrl && (
                            <Button variant="outline" size="sm" title="Download PDF">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {prescription.pdfUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              title="Enviar"
                              onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">
                  {searchTerm
                    ? 'Nenhuma prescrição encontrada'
                    : 'Nenhuma prescrição emitida ainda'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certificates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Atestados</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCertificates ? (
              <p className="text-center py-8 text-gray-500">Carregando...</p>
            ) : filteredCertificates && filteredCertificates.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates.map((certificate: any) => (
                    <TableRow key={certificate.id}>
                      <TableCell className="font-medium">#{certificate.id}</TableCell>
                      <TableCell>
                        {new Date(certificate.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {certificate.tipo === 'comparecimento' && 'Comparecimento'}
                        {certificate.tipo === 'afastamento' && 'Afastamento'}
                        {certificate.tipo === 'obito' && 'Óbito'}
                      </TableCell>
                      <TableCell>{getStatusBadge('assinada')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            title="Visualizar"
                            onClick={() => setLocation(`/atestados/${certificate.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {certificate.pdfUrl && (
                            <Button variant="outline" size="sm" title="Download PDF">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">
                  {searchTerm
                    ? 'Nenhum atestado encontrado'
                    : 'Nenhum atestado emitido ainda'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
