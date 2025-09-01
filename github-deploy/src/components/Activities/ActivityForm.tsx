import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Activity, Client, Deal, ActivityType, ActivityOutcome } from '../../types';
import { clientService } from '../../services/clientService';
import { dealService } from '../../services/dealService';

interface ActivityFormProps {
  activity?: Activity;
  onSubmit: (activity: Omit<Activity, 'id' | 'created_at' | 'client' | 'deal'>) => void;
  onClose: () => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ activity, onSubmit, onClose }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [formData, setFormData] = useState({
    tipo_attivita: 'call' as ActivityType,
    data_ora: new Date().toISOString().slice(0, 16),
    esito: 'positiva' as ActivityOutcome,
    client_id: '',
    deal_id: '',
    note: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activity) {
      setFormData({
        tipo_attivita: activity.tipo_attivita,
        data_ora: activity.data_ora.slice(0, 16),
        esito: activity.esito,
        client_id: activity.client_id || '',
        deal_id: activity.deal_id || '',
        note: activity.note || ''
      });
    }
  }, [activity]);

  const loadData = async () => {
    try {
      const [clientsData, dealsData] = await Promise.all([
        clientService.getAll(),
        dealService.getAll()
      ]);
      setClients(clientsData);
      setDeals(dealsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const activityData = {
      ...formData,
      data_ora: new Date(formData.data_ora).toISOString(),
      client_id: formData.client_id || undefined,
      deal_id: formData.deal_id || undefined
    };
    
    onSubmit(activityData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {activity ? 'Modifica Attività' : 'Nuova Attività'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Attività *
              </label>
              <select
                name="tipo_attivita"
                value={formData.tipo_attivita}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="call">Chiamata</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data e Ora *
              </label>
              <input
                type="datetime-local"
                name="data_ora"
                value={formData.data_ora}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Esito *
              </label>
              <select
                name="esito"
                value={formData.esito}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="positiva">Positiva</option>
                <option value="da_richiamare">Da Richiamare</option>
                <option value="nessuna_risposta">Nessuna Risposta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleziona un cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nome_azienda} - {client.referente_principale}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trattativa
              </label>
              <select
                name="deal_id"
                value={formData.deal_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleziona una trattativa</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.oggetto_trattativa} - {deal.client?.nome_azienda}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={4}
              placeholder="Aggiungi dettagli sull'attività..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              {activity ? 'Aggiorna' : 'Crea'} Attività
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityForm;