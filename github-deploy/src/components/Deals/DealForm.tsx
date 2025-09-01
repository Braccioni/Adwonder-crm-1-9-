import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Deal, Client, DealStatus } from '../../types';
import { clientService } from '../../services/clientService';
import { dealSchema } from '../../utils/validation';
import { z } from 'zod';
import toast from 'react-hot-toast';

interface DealFormProps {
  deal?: Deal;
  onSubmit: (deal: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'client'>) => void;
  onClose: () => void;
}

const DealForm: React.FC<DealFormProps> = ({ deal, onSubmit, onClose }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    oggetto_trattativa: '',
    valore_stimato: 0,
    data_apertura: new Date().toISOString().split('T')[0],
    stato_trattativa: 'in_corso' as DealStatus,
    scadenza_prossimo_contatto: '',
    note: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (deal) {
      setFormData({
        client_id: deal.client_id,
        oggetto_trattativa: deal.oggetto_trattativa,
        valore_stimato: deal.valore_stimato,
        data_apertura: deal.data_apertura.split('T')[0],
        stato_trattativa: deal.stato_trattativa,
        scadenza_prossimo_contatto: deal.scadenza_prossimo_contatto?.split('T')[0] || '',
        note: deal.note || ''
      });
    }
  }, [deal]);

  const loadClients = async () => {
    try {
      const data = await clientService.getAll();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Errore nel caricamento dei clienti');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      // Validate with Zod
      const validationData = {
        client_id: formData.client_id,
        oggetto_trattativa: formData.oggetto_trattativa,
        valore_stimato: formData.valore_stimato,
        data_apertura: formData.data_apertura,
        stato_trattativa: formData.stato_trattativa,
        scadenza_prossimo_contatto: formData.scadenza_prossimo_contatto || undefined,
        note: formData.note || undefined,
      };
      
      dealSchema.parse(validationData);
      
      const dealData = {
        ...formData,
        data_apertura: new Date(formData.data_apertura).toISOString(),
        scadenza_prossimo_contatto: formData.scadenza_prossimo_contatto 
          ? new Date(formData.scadenza_prossimo_contatto).toISOString()
          : undefined,
        user_id: 'default-user'
      };
      
      onSubmit(dealData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error('Controlla i campi del form');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'valore_stimato' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {deal ? 'Modifica Trattativa' : 'Nuova Trattativa'}
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
                Cliente *
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.client_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seleziona un cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nome_azienda} - {client.figura_preposta}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valore Stimato (€) *
              </label>
              <input
                type="number"
                name="valore_stimato"
                value={formData.valore_stimato}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Oggetto Trattativa *
              </label>
              <input
                type="text"
                name="oggetto_trattativa"
                value={formData.oggetto_trattativa}
                onChange={handleChange}
                required
                placeholder="es: E-commerce + ADV"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Apertura *
              </label>
              <input
                type="date"
                name="data_apertura"
                value={formData.data_apertura}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stato Trattativa *
              </label>
              <select
                name="stato_trattativa"
                value={formData.stato_trattativa}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="in_corso">In Corso</option>
                <option value="vinta">Vinta</option>
                <option value="persa">Persa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scadenza Prossimo Contatto
              </label>
              <input
                type="date"
                name="scadenza_prossimo_contatto"
                value={formData.scadenza_prossimo_contatto}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
              {deal ? 'Aggiorna' : 'Crea'} Trattativa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DealForm;