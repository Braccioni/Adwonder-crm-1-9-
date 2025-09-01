import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Client, StatoTrattativa, TipologiaProposta, Frequenza } from '../../types';
import { clientSchema } from '../../utils/validation';
import { z } from 'zod';

interface ClientFormProps {
  client?: Client;
  onSubmit: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ client, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    nome_azienda: '',
    figura_preposta: '',
    contatti: '',
    data_invio_proposta: '',
    indirizzo_mail: '',
    proposta_presentata: '',
    tipologia_proposta: '' as TipologiaProposta | '',
    frequenza: '' as Frequenza | '',
    valore_mensile: 0,
    valore_spot: 0,
    stato_trattativa: 'in_corso' as StatoTrattativa,
    data_fine: '',
    giorni_gestazione: 0,
    durata: '',
    fine_lavori: '',
    estensione: '',
    // Contract expiration fields
    data_inizio_contratto: '',
    data_scadenza_contratto: '',
    durata_contratto_mesi: 0,
    rinnovo_automatico: false,
    notifiche_attive: true
  });

  useEffect(() => {
    if (client) {
      setFormData({
        nome_azienda: client.nome_azienda,
        figura_preposta: client.figura_preposta,
        contatti: client.contatti,
        data_invio_proposta: client.data_invio_proposta || '',
        indirizzo_mail: client.indirizzo_mail,
        proposta_presentata: client.proposta_presentata || '',
        tipologia_proposta: client.tipologia_proposta || '',
        frequenza: client.frequenza || '',
        valore_mensile: client.valore_mensile || 0,
        valore_spot: client.valore_spot || 0,
        stato_trattativa: client.stato_trattativa,
        data_fine: client.data_fine || '',
        giorni_gestazione: client.giorni_gestazione || 0,
        durata: client.durata || '',
        fine_lavori: client.fine_lavori || '',
        estensione: client.estensione || '',
        // Contract expiration fields
        data_inizio_contratto: client.data_inizio_contratto || '',
        data_scadenza_contratto: client.data_scadenza_contratto || '',
        durata_contratto_mesi: client.durata_contratto_mesi || 0,
        rinnovo_automatico: client.rinnovo_automatico || false,
        notifiche_attive: client.notifiche_attive !== undefined ? client.notifiche_attive : true
      });
    }
  }, [client]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      // Validate required fields with Zod
      const validationData = {
        nome_azienda: formData.nome_azienda,
        figura_preposta: formData.figura_preposta,
        contatti: formData.contatti,
        indirizzo_mail: formData.indirizzo_mail,
        valore_mensile: formData.valore_mensile || undefined,
        valore_spot: formData.valore_spot || undefined,
      };
      
      clientSchema.parse(validationData);
      
      onSubmit({
        ...formData,
        tipologia_proposta: formData.tipologia_proposta || undefined,
        frequenza: formData.frequenza || undefined,
        valore_mensile: formData.valore_mensile || undefined,
        valore_spot: formData.valore_spot || undefined,
        data_invio_proposta: formData.data_invio_proposta || undefined,
        proposta_presentata: formData.proposta_presentata || undefined,
        data_fine: formData.data_fine || undefined,
        giorni_gestazione: formData.giorni_gestazione || undefined,
        durata: formData.durata || undefined,
        fine_lavori: formData.fine_lavori || undefined,
        estensione: formData.estensione || undefined
      } as Omit<Client, 'id' | 'created_at' | 'updated_at'>);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  const { name, value, type } = e.target;
  const checked = (e.target as HTMLInputElement).checked;
  setFormData(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? 0 : Number(value)) : value
  }));
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {client ? 'Modifica Cliente' : 'Nuovo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome Azienda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Azienda *
              </label>
              <input
                type="text"
                name="nome_azienda"
                value={formData.nome_azienda}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nome_azienda ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.nome_azienda && (
                <p className="mt-1 text-sm text-red-600">{errors.nome_azienda}</p>
              )}
            </div>

            {/* Figura Preposta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Figura Preposta *
              </label>
              <input
                type="text"
                name="figura_preposta"
                value={formData.figura_preposta}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Contatti */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contatti *
              </label>
              <input
                type="text"
                name="contatti"
                value={formData.contatti}
                onChange={handleChange}
                placeholder="Telefono, cellulare, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Indirizzo Mail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indirizzo Mail *
              </label>
              <input
                type="email"
                name="indirizzo_mail"
                value={formData.indirizzo_mail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Data Invio Proposta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Invio Proposta
              </label>
              <input
                type="date"
                name="data_invio_proposta"
                value={formData.data_invio_proposta}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tipologia Proposta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipologia Proposta
              </label>
              <select
                name="tipologia_proposta"
                value={formData.tipologia_proposta}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona tipologia</option>
                <option value="advertising">Advertising</option>
                <option value="mail_marketing">Mail Marketing</option>
                <option value="social_media">Social Media</option>
                <option value="nuovo_sito">Nuovo Sito</option>
                <option value="restyling_sito">Restyling Sito</option>
                <option value="adv_lead_generation_b2b">Adv Lead Generation B2B</option>
                <option value="adv_mma">Adv + MMA</option>
                <option value="adv_mma_landing_page">ADV + MMA + Landing Page</option>
                <option value="adv_mma_sito">ADV + MMA + Sito</option>
                <option value="all_inclusive">All Inclusive</option>
                <option value="linkedin">LinkedIn</option>
                <option value="amazon">Amazon</option>
              </select>
            </div>

            {/* Frequenza */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequenza
              </label>
              <select
                name="frequenza"
                value={formData.frequenza}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona frequenza</option>
                <option value="una_tantum">Una tantum</option>
                <option value="mensile">Mensile</option>
                <option value="trimestrale">Trimestrale</option>
                <option value="semestrale">Semestrale</option>
                <option value="annuale">Annuale</option>
              </select>
            </div>

            {/* Valore Mensile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valore Mensile (€)
              </label>
              <input
                type="number"
                name="valore_mensile"
                value={formData.valore_mensile}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Valore Spot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valore Spot (€)
              </label>
              <input
                type="number"
                name="valore_spot"
                value={formData.valore_spot}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Stato Trattativa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stato Trattativa *
              </label>
              <select
                name="stato_trattativa"
                value={formData.stato_trattativa}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="in_corso">In Corso</option>
                <option value="vinta">Vinta</option>
                <option value="persa">Persa</option>
                <option value="sospesa">Sospesa</option>
              </select>
            </div>

            {/* Data Fine */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fine
              </label>
              <input
                type="date"
                name="data_fine"
                value={formData.data_fine}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Giorni Gestazione */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giorni Gestazione
              </label>
              <input
                type="number"
                name="giorni_gestazione"
                value={formData.giorni_gestazione}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Durata */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durata
              </label>
              <input
                type="text"
                name="durata"
                value={formData.durata}
                onChange={handleChange}
                placeholder="es. 6 mesi, 1 anno"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fine Lavori */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fine Lavori
              </label>
              <input
                type="text"
                name="fine_lavori"
                value={formData.fine_lavori}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Estensione */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estensione
              </label>
              <input
                type="text"
                name="estensione"
                value={formData.estensione}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Contract Management Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Gestione Contratto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Data Inizio Contratto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inizio Contratto
                </label>
                <input
                  type="date"
                  name="data_inizio_contratto"
                  value={formData.data_inizio_contratto}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Data Scadenza Contratto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Scadenza Contratto *
                </label>
                <input
                  type="date"
                  name="data_scadenza_contratto"
                  value={formData.data_scadenza_contratto}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Durata Contratto (mesi) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durata Contratto (mesi)
                </label>
                <input
                  type="number"
                  name="durata_contratto_mesi"
                  value={formData.durata_contratto_mesi}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Rinnovo Automatico */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rinnovo_automatico"
                  name="rinnovo_automatico"
                  checked={formData.rinnovo_automatico}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rinnovo_automatico" className="ml-2 block text-sm text-gray-700">
                  Rinnovo Automatico
                </label>
              </div>

              {/* Notifiche Attive */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifiche_attive"
                  name="notifiche_attive"
                  checked={formData.notifiche_attive}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notifiche_attive" className="ml-2 block text-sm text-gray-700">
                  Notifiche Scadenza Attive
                </label>
              </div>
            </div>

            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Notifiche automatiche:</strong> Riceverai avvisi 45, 30 e 15 giorni prima della scadenza del contratto se le notifiche sono attive.
              </p>
            </div>
          </div>

          {/* Proposta Presentata */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proposta Presentata
            </label>
            <textarea
              name="proposta_presentata"
              value={formData.proposta_presentata}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descrizione della proposta presentata..."
            />
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {client ? 'Aggiorna' : 'Crea'} Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;