import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Mail, Phone, Users, Filter, ChevronUp, ChevronDown, Upload } from 'lucide-react';
import { Client } from '../../types';
import { clientService } from '../../services/clientService';
import ClientForm from './ClientForm';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof Client>('nome_azienda');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const filterClients = useCallback(() => {
    const filtered = clients.filter((client: Client) => {
      const matchesSearch = searchTerm === '' || 
        client.nome_azienda.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.figura_preposta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.indirizzo_mail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contatti.includes(searchTerm) ||
        (client.tipologia_proposta && client.tipologia_proposta.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || client.stato_trattativa === statusFilter;
      const matchesSource = sourceFilter === 'all' || client.tipologia_proposta === sourceFilter;
      const matchesSector = sectorFilter === 'all' || client.frequenza === sectorFilter;
      
      return matchesSearch && matchesStatus && matchesSource && matchesSector;
    });
    
    setFilteredClients(filtered);
  }, [clients, searchTerm, statusFilter, sourceFilter, sectorFilter]);

  useEffect(() => {
    filterClients();
  }, [filterClients]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientService.getAll();
      setClients(data);
    } catch (error) {
      console.error('Errore nel caricamento dei clienti:', error);
      toast.error('Errore nel caricamento dei clienti');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSourceFilter('all');
    setSectorFilter('all');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const loadingToast = toast.loading('Importazione in corso...');
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(worksheet) as Array<{
        'Nome Azienda'?: string;
        'Azienda'?: string;
        'Company'?: string;
        [key: string]: unknown;
      }>;
      
      // Filtra solo i clienti con almeno nome azienda
      const validClients = rawData.filter((client: { [key: string]: unknown }) => {
        const nomeAzienda = client['Nome Azienda'] || client['Azienda'] || client['Company'];
        return nomeAzienda?.toString().trim();
      });

      // Sostituire questa parte nella funzione handleFileImport:
      if (validClients.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('Nessun cliente valido trovato nel file. Assicurati che ci sia almeno una colonna "Nome Azienda".');
        return;
      }

      // Importa i clienti uno per uno
      let successCount = 0;
      let errorCount = 0;

      for (const clientData of validClients) {
        try {
           await clientService.create(clientData as Omit<Client, 'id' | 'created_at' | 'updated_at'>);
           successCount++;
        } catch (error) {
          console.error('Errore durante l\'importazione del cliente:', clientData.nome_azienda, error);
          errorCount++;
        }
      }

      alert(`Importazione completata!\n✅ ${successCount} clienti importati con successo\n❌ ${errorCount} errori`);
      
      // Ricarica la lista clienti
      loadClients();
    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      toast.dismiss(loadingToast);
      toast.error('Errore durante l\'importazione del file. Assicurati che sia un file Excel valido.');
    } finally {
      setImporting(false);
      // Reset input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSort = (field: keyof Client) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedClients = [...filteredClients].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === undefined || bValue === undefined) return 0;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_corso':
        return 'bg-blue-100 text-blue-800';
      case 'vinta':
        return 'bg-green-100 text-green-800';
      case 'persa':
        return 'bg-red-100 text-red-800';
      case 'sospesa':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };



  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = async (clientId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo cliente?')) {
      try {
        await clientService.delete(clientId);
        await loadClients();
        toast.success('Cliente eliminato con successo!');
      } catch (error) {
        console.error('Errore nell\'eliminazione del cliente:', error);
        toast.error('Errore nell\'eliminazione del cliente');
      }
    }
  };

  const handleSubmit = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingClient) {
        await clientService.update(editingClient.id, clientData);
        toast.success('Cliente aggiornato con successo!');
      } else {
        await clientService.create(clientData);
        toast.success('Cliente creato con successo!');
      }
      await loadClients();
      setShowForm(false);
      setEditingClient(undefined);
    } catch (error) {
      console.error('Errore nel salvataggio del cliente:', error);
      toast.error('Errore nel salvataggio del cliente');
    }
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clienti</h1>
          <p className="text-gray-600 mt-1">Gestisci la tua anagrafica clienti</p>
          
          {/* Quick Stats */}
          <div className="flex items-center space-x-6 mt-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-sm text-gray-600">
                {clients.filter(c => c.stato_trattativa === 'in_corso').length} In Corso
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-600">
                {clients.filter(c => c.stato_trattativa === 'vinta').length} Vinte
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-sm text-gray-600">
                {clients.filter(c => c.stato_trattativa === 'persa').length} Perse
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-md"
          >
            <Upload className="w-4 h-4" />
            <span>{importing ? 'Importando...' : 'Importa Excel'}</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Cliente</span>
          </button>
        </div>
      </div>

      {/* Hidden file input */}
       <input
         ref={fileInputRef}
         type="file"
         accept=".xlsx,.xls,.csv"
         onChange={handleFileImport}
         style={{ display: 'none' }}
       />

       {/* Informazioni formato Excel */}
       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
         <h3 className="text-sm font-medium text-blue-900 mb-2">📋 Formato Excel per l'importazione</h3>
         <p className="text-sm text-blue-700 mb-2">
           Il file Excel deve contenere le seguenti colonne (i nomi possono variare):
         </p>
         <div className="text-xs text-blue-800">
           <p className="mb-2"><strong>Colonne obbligatorie:</strong></p>
           <ul className="list-disc list-inside mb-3 space-y-1">
             <li>Nome Azienda</li>
             <li>Figura preposta</li>
             <li>Contatti</li>
             <li>Indirizzo Mail</li>
           </ul>
           <p className="mb-2"><strong>Colonne opzionali:</strong></p>
           <ul className="list-disc list-inside space-y-1">
             <li>Data Invio Prop. (formato: YYYY-MM-DD)</li>
             <li>Proposta presentata</li>
             <li>Tipologia Proposta (consulenza, formazione, audit, implementazione, manutenzione, altro)</li>
             <li>Frequenza (una_tantum, mensile, trimestrale, semestrale, annuale)</li>
             <li>Valore Mensile (numero)</li>
             <li>Valore Spot (numero)</li>
             <li>Stato Trattativa (in_corso, vinta, persa, sospesa)</li>
             <li>Data Fine (formato: YYYY-MM-DD)</li>
             <li>Giorni Gestazione (numero)</li>
             <li>Durata</li>
             <li>Fine Lavori</li>
             <li>Estensione</li>
           </ul>
         </div>
       </div>

      {/* Filtri */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Filtri</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca clienti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tutti gli stati</option>
            <option value="in_corso">In Corso</option>
            <option value="vinta">Vinta</option>
            <option value="persa">Persa</option>
            <option value="sospesa">Sospesa</option>
          </select>

          {/* Tipologia Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tutte le tipologie</option>
            <option value="consulenza">Consulenza</option>
            <option value="formazione">Formazione</option>
            <option value="audit">Audit</option>
            <option value="implementazione">Implementazione</option>
            <option value="manutenzione">Manutenzione</option>
            <option value="altro">Altro</option>
          </select>

          {/* Frequenza Filter */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tutte le frequenze</option>
            <option value="una_tantum">Una tantum</option>
            <option value="mensile">Mensile</option>
            <option value="trimestrale">Trimestrale</option>
            <option value="semestrale">Semestrale</option>
            <option value="annuale">Annuale</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' || sectorFilter !== 'all') && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors mt-3"
          >
            Cancella filtri
          </button>
        )}
      </div>

      {/* Risultati e contatore */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          Mostrando {sortedClients.length} di {clients.length} clienti
        </p>
        {(searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' || sectorFilter !== 'all') && (
          <p className="text-sm text-blue-600">
            Filtri attivi
          </p>
        )}
      </div>

      {/* Client List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {sortedClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('nome_azienda')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Azienda</span>
                      {sortField === 'nome_azienda' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('figura_preposta')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Figura Preposta</span>
                      {sortField === 'figura_preposta' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contatti
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('stato_trattativa')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Stato Trattativa</span>
                      {sortField === 'stato_trattativa' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valore
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client.nome_azienda}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.figura_preposta}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-3 h-3 mr-1" />
                          <span className="truncate max-w-xs">{client.indirizzo_mail}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-3 h-3 mr-1" />
                          <span>{client.contatti}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.stato_trattativa)}`}>
                        {client.stato_trattativa === 'in_corso' ? 'In Corso' : 
                         client.stato_trattativa === 'vinta' ? 'Vinta' : 
                         client.stato_trattativa === 'persa' ? 'Persa' : 'Sospesa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col space-y-1">
                        {client.valore_mensile && (
                          <div>Mensile: €{client.valore_mensile.toLocaleString()}</div>
                        )}
                        {client.valore_spot && (
                          <div>Spot: €{client.valore_spot.toLocaleString()}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {clients.length === 0 ? 'Nessun cliente trovato' : 'Nessun risultato'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {clients.length === 0 
                ? 'Inizia aggiungendo il tuo primo cliente.' 
                : 'Prova a modificare i filtri di ricerca.'}
            </p>
            {clients.length === 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Aggiungi primo cliente
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <ClientForm
          client={editingClient}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingClient(undefined);
          }}
        />
      )}
    </div>
  );
};

export default ClientList;