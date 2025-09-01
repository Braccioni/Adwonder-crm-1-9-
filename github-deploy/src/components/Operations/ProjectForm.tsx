import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Project, ProjectStatus, ProjectPriority, Client } from '../../types';
import { clientService } from '../../services/clientService';
import { useAuth } from '../../contexts/AuthContext';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'client' | 'collaboratori'>) => void;
  onClose: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSubmit, onClose }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    nome_progetto: '',
    descrizione: '',
    client_id: '',
    stato: 'pianificazione' as ProjectStatus,
    priorita: 'media' as ProjectPriority,
    data_inizio: '',
    data_fine_prevista: '',
    data_fine_effettiva: '',
    budget_stimato: '',
    budget_utilizzato: '',
    note: '',
    user_id: user?.id || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadClients();
    if (project) {
      setFormData({
        nome_progetto: project.nome_progetto,
        descrizione: project.descrizione || '',
        client_id: project.client_id,
        stato: project.stato,
        priorita: project.priorita,
        data_inizio: project.data_inizio.split('T')[0],
        data_fine_prevista: project.data_fine_prevista.split('T')[0],
        data_fine_effettiva: project.data_fine_effettiva ? project.data_fine_effettiva.split('T')[0] : '',
        budget_stimato: project.budget_stimato?.toString() || '',
        budget_utilizzato: project.budget_utilizzato?.toString() || '',
        note: project.note || '',
        user_id: project.user_id
      });
    }
  }, [project]);

  const loadClients = async () => {
    try {
      const clientsData = await clientService.getAll();
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome_progetto.trim()) {
      newErrors.nome_progetto = 'Il nome del progetto è obbligatorio';
    }

    if (!formData.client_id) {
      newErrors.client_id = 'Seleziona un cliente';
    }

    if (!formData.data_inizio) {
      newErrors.data_inizio = 'La data di inizio è obbligatoria';
    }

    if (!formData.data_fine_prevista) {
      newErrors.data_fine_prevista = 'La data di fine prevista è obbligatoria';
    }

    if (formData.data_inizio && formData.data_fine_prevista) {
      const startDate = new Date(formData.data_inizio);
      const endDate = new Date(formData.data_fine_prevista);
      if (startDate >= endDate) {
        newErrors.data_fine_prevista = 'La data di fine deve essere successiva alla data di inizio';
      }
    }

    if (formData.data_fine_effettiva && formData.data_inizio) {
      const startDate = new Date(formData.data_inizio);
      const actualEndDate = new Date(formData.data_fine_effettiva);
      if (actualEndDate < startDate) {
        newErrors.data_fine_effettiva = 'La data di fine effettiva non può essere precedente alla data di inizio';
      }
    }

    if (formData.budget_stimato && parseFloat(formData.budget_stimato) < 0) {
      newErrors.budget_stimato = 'Il budget stimato deve essere positivo';
    }

    if (formData.budget_utilizzato && parseFloat(formData.budget_utilizzato) < 0) {
      newErrors.budget_utilizzato = 'Il budget utilizzato deve essere positivo';
    }

    if (formData.budget_stimato && formData.budget_utilizzato) {
      const stimato = parseFloat(formData.budget_stimato);
      const utilizzato = parseFloat(formData.budget_utilizzato);
      if (utilizzato > stimato) {
        newErrors.budget_utilizzato = 'Il budget utilizzato non può superare quello stimato';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const projectData = {
      nome_progetto: formData.nome_progetto.trim(),
      descrizione: formData.descrizione.trim() || undefined,
      client_id: formData.client_id,
      stato: formData.stato,
      priorita: formData.priorita,
      data_inizio: new Date(formData.data_inizio).toISOString(),
      data_fine_prevista: new Date(formData.data_fine_prevista).toISOString(),
      data_fine_effettiva: formData.data_fine_effettiva ? new Date(formData.data_fine_effettiva).toISOString() : undefined,
      budget_stimato: formData.budget_stimato ? parseFloat(formData.budget_stimato) : undefined,
      budget_utilizzato: formData.budget_utilizzato ? parseFloat(formData.budget_utilizzato) : undefined,
      note: formData.note.trim() || undefined,
      user_id: formData.user_id
    };

    onSubmit(projectData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {project ? 'Modifica Progetto' : 'Nuovo Progetto'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome Progetto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Progetto *
            </label>
            <input
              type="text"
              name="nome_progetto"
              value={formData.nome_progetto}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.nome_progetto ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Inserisci il nome del progetto"
            />
            {errors.nome_progetto && (
              <p className="mt-1 text-sm text-red-600">{errors.nome_progetto}</p>
            )}
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <select
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.client_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleziona un cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nome_azienda}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
            )}
          </div>

          {/* Stato e Priorità */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stato
              </label>
              <select
                name="stato"
                value={formData.stato}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pianificazione">Pianificazione</option>
                <option value="in_corso">In Corso</option>
                <option value="completato">Completato</option>
                <option value="sospeso">Sospeso</option>
                <option value="annullato">Annullato</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorità
              </label>
              <select
                name="priorita"
                value={formData.priorita}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="bassa">Bassa</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Critica</option>
              </select>
            </div>
          </div>

          {/* Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Inizio *
              </label>
              <input
                type="date"
                name="data_inizio"
                value={formData.data_inizio}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.data_inizio ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.data_inizio && (
                <p className="mt-1 text-sm text-red-600">{errors.data_inizio}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fine Prevista *
              </label>
              <input
                type="date"
                name="data_fine_prevista"
                value={formData.data_fine_prevista}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.data_fine_prevista ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.data_fine_prevista && (
                <p className="mt-1 text-sm text-red-600">{errors.data_fine_prevista}</p>
              )}
            </div>
          </div>

          {/* Data Fine Effettiva */}
          {(formData.stato === 'completato' || formData.data_fine_effettiva) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fine Effettiva
              </label>
              <input
                type="date"
                name="data_fine_effettiva"
                value={formData.data_fine_effettiva}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.data_fine_effettiva ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.data_fine_effettiva && (
                <p className="mt-1 text-sm text-red-600">{errors.data_fine_effettiva}</p>
              )}
            </div>
          )}

          {/* Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Stimato (€)
              </label>
              <input
                type="number"
                name="budget_stimato"
                value={formData.budget_stimato}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.budget_stimato ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.budget_stimato && (
                <p className="mt-1 text-sm text-red-600">{errors.budget_stimato}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Utilizzato (€)
              </label>
              <input
                type="number"
                name="budget_utilizzato"
                value={formData.budget_utilizzato}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.budget_utilizzato ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.budget_utilizzato && (
                <p className="mt-1 text-sm text-red-600">{errors.budget_utilizzato}</p>
              )}
            </div>
          </div>

          {/* Descrizione */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione
            </label>
            <textarea
              name="descrizione"
              value={formData.descrizione}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descrizione del progetto..."
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Note aggiuntive..."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
            >
              {project ? 'Aggiorna' : 'Crea'} Progetto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;