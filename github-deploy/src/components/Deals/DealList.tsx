import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, Euro, Briefcase } from 'lucide-react';
import { Deal } from '../../types';
import { dealService } from '../../services/dealService';
import DealForm from './DealForm';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import toast from 'react-hot-toast';

const DealList: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadDeals();
  }, []);

  const filterDeals = useCallback(() => {
    let filtered = deals;

    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.oggetto_trattativa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.client?.nome_azienda.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(deal => deal.stato_trattativa === statusFilter);
    }

    setFilteredDeals(filtered);
  }, [deals, searchTerm, statusFilter]);

  useEffect(() => {
    filterDeals();
  }, [filterDeals]);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const data = await dealService.getAll();
      setDeals(data);
    } catch (error) {
      console.error('Error loading deals:', error);
      toast.error('Errore nel caricamento delle trattative');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (dealData: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'client'>) => {
    try {
      if (editingDeal) {
        await dealService.update(editingDeal.id, dealData);
        toast.success('Trattativa aggiornata con successo!');
      } else {
        await dealService.create(dealData);
        toast.success('Trattativa creata con successo!');
      }
      await loadDeals();
      setShowForm(false);
      setEditingDeal(undefined);
    } catch (error) {
      console.error('Error saving deal:', error);
      toast.error('Errore nel salvataggio della trattativa');
    }
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa trattativa?')) {
      try {
        await dealService.delete(id);
        await loadDeals();
        toast.success('Trattativa eliminata con successo!');
      } catch (error) {
        console.error('Error deleting deal:', error);
        toast.error('Errore nell\'eliminazione della trattativa');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_corso': return 'bg-blue-100 text-blue-800';
      case 'vinta': return 'bg-green-100 text-green-800';
      case 'persa': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: it });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-16 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trattative</h1>
          <p className="text-gray-600 mt-1">Gestisci le tue opportunità commerciali</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuova Trattativa</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca trattative..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tutti gli stati</option>
            <option value="in_corso">In Corso</option>
            <option value="vinta">Vinta</option>
            <option value="persa">Persa</option>
          </select>
          <div className="text-sm text-gray-600 flex items-center">
            {filteredDeals.length} di {deals.length} trattative
          </div>
        </div>
      </div>

      {/* Deal List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredDeals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trattativa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valore
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{deal.oggetto_trattativa}</div>
                      {deal.note && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{deal.note}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{deal.client?.nome_azienda}</div>
                      <div className="text-sm text-gray-500">{deal.client?.figura_preposta}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Euro className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(deal.valore_stimato)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(deal.stato_trattativa)}`}>
                        {deal.stato_trattativa.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Aperta: {formatDate(deal.data_apertura)}</span>
                      </div>
                      {deal.scadenza_prossimo_contatto && (
                        <div className="flex items-center mt-1">
                          <Calendar className="w-4 h-4 mr-1 text-orange-500" />
                          <span className="text-orange-600">Follow-up: {formatDate(deal.scadenza_prossimo_contatto)}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(deal)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(deal.id)}
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
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna trattativa trovata</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Prova a modificare i filtri di ricerca'
                : 'Inizia aggiungendo una nuova trattativa'}
            </p>
          </div>
        )}
      </div>

      {showForm && (
        <DealForm
          deal={editingDeal}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingDeal(undefined);
          }}
        />
      )}
    </div>
  );
};

export default DealList;