import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { Search, FileText, Eye } from 'lucide-react';
import { useState } from 'react';

export default function Medicamentos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [showBulaDialog, setShowBulaDialog] = useState(false);

  const { data: medications, isLoading } = trpc.medications.search.useQuery(
    { query: searchTerm },
    { enabled: searchTerm.length > 2 }
  );

  const handleViewBula = (medication: any) => {
    setSelectedMedication(medication);
    setShowBulaDialog(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medicamentos</h1>
          <p className="text-gray-600 mt-2">Busque medicamentos e visualize bulas</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Digite o nome do medicamento ou princípio ativo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searchTerm.length > 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados da Busca</CardTitle>
              <CardDescription>
                {isLoading
                  ? 'Buscando...'
                  : medications
                  ? `${medications.length} medicamento(s) encontrado(s)`
                  : 'Nenhum resultado'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8 text-gray-500">Carregando...</p>
              ) : medications && medications.length > 0 ? (
                <div className="space-y-4">
                  {medications.map((med) => (
                    <div
                      key={med.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{med.nomeProduto}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Princípio Ativo:</span>{' '}
                            {med.principioAtivo}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Empresa:</span> {med.empresaNome}
                          </p>
                          <div className="flex gap-4 mt-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {med.tarja || 'Livre'}
                            </span>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                              {med.categoriaRegulatoria}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                              {med.situacaoRegistro}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewBula(med)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Bula
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Nenhum medicamento encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bula Dialog */}
        <Dialog open={showBulaDialog} onOpenChange={setShowBulaDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{selectedMedication?.nomeProduto}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="paciente" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paciente">Bula do Paciente</TabsTrigger>
                <TabsTrigger value="profissional">Bula do Profissional</TabsTrigger>
              </TabsList>
              <TabsContent value="paciente" className="mt-4">
                {selectedMedication?.bula_pdf_url ? (
                  <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                    <iframe
                      src={selectedMedication.bula_pdf_url}
                      className="w-full h-full"
                      title="Bula do Paciente"
                    />
                  </div>
                ) : selectedMedication?.bula_txt ? (
                  <div className="border rounded-lg p-4 max-h-[600px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {selectedMedication.bula_txt}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Bula do paciente não disponível</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="profissional" className="mt-4">
                {selectedMedication?.bula_pdf_profissional_url ? (
                  <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                    <iframe
                      src={selectedMedication.bula_pdf_profissional_url}
                      className="w-full h-full"
                      title="Bula do Profissional"
                    />
                  </div>
                ) : selectedMedication?.bula_txt_profissional ? (
                  <div className="border rounded-lg p-4 max-h-[600px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {selectedMedication.bula_txt_profissional}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Bula do profissional não disponível</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
