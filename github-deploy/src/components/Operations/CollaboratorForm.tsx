import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Euro, Clock } from 'lucide-react';
import { Collaborator, CollaboratorRole, TipoCompenso } from '../../types';

interface CollaboratorFormProps {
  collaborator?: Collaborator;
  onSave: (collaborator: Omit<Collaborator, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CollaboratorForm: React.FC<CollaboratorFormProps> = ({
  collaborator,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    ruolo_principale: 'developer' as CollaboratorRole,
    tipo_compenso: 'gettone' as TipoCompenso,
    compenso_per_gettone: 0,
    compenso_fisso: 0,
    gettoni_disponibili: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (collaborator) {
      setFormData({
        nome: collaborator.nome,
        cognome: collaborator.cognome,
        email: collaborator.email,
        telefono: collaborator.telefono || '',
        ruolo_principale: collaborator.ruolo_principale,
        tipo_compenso: collaborator.tipo_compenso,
        compenso_per_gettone: collaborator.compenso_per_gettone || 0,
        compenso_fisso: collaborator.compenso_fisso || 0,
        gettoni_disponibili: collaborator.gettoni_disponibili
      });
    }
  }, [collaborator]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Il nome è obbligatorio';
    }

    if (!formData.cognome.trim()) {
      newErrors.cognome = 'Il cognome è obbligatorio';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email è obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Inserisci un\'email valida';
    }

    if (formData.gettoni_disponibili < 0) {
      newErrors.gettoni_disponibili = 'I gettoni non possono essere negativi';
    }

    if (formData.tipo_compenso === 'gettone' && formData.compenso_per_gettone <= 0) {
      newErrors.compenso_per_gettone = 'Il compenso per gettone deve essere maggiore di zero';
    }

    if (formData.tipo_compenso === 'fisso' && formData.compenso_fisso <= 0) {
      newErrors.compenso_fisso = 'Il compenso fisso deve essere maggiore di zero';
    }

    if (formData.telefono && !/^[+]?[0-9\s-()]+$/.test(formData.telefono)) {
      newErrors.telefono = 'Inserisci un numero di telefono valido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        nome: formData.nome,
        cognome: formData.cognome,
        email: formData.email,
        telefono: formData.telefono || undefined,
        ruolo_principale: formData.ruolo_principale,
        tipo_compenso: formData.tipo_compenso,
        compenso_per_gettone: formData.tipo_compenso === 'gettone' ? formData.compenso_per_gettone : undefined,
        compenso_fisso: formData.tipo_compenso === 'fisso' ? formData.compenso_fisso : undefined,
        gettoni_disponibili: formData.gettoni_disponibili
      });
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getRoleLabel = (role: CollaboratorRole) => {
    const roleLabels: Record<CollaboratorRole, string> = {
      project_manager: 'Project Manager',
      developer: 'Sviluppatore',
      designer: 'Designer',
      analyst: 'Analista',
      consultant: 'Consulente',
      grafico: 'Grafico',
      amazon_specialist: 'Amazon Specialist',
      linkedin_specialist: 'LinkedIn Specialist',
      advertiser: 'Advertiser',
      altro: 'Altro'
    };
    return roleLabels[role] || role;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {collaborator ? 'Modifica Collaboratore' : 'Nuovo Collaboratore'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Nome *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nome ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Inserisci il nome"
              />
              {errors.nome && (
                <p className="mt-1 text-sm text-red-600">{errors.nome}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Cognome *
              </label>
              <input
                type="text"
                value={formData.cognome}
                onChange={(e) => handleInputChange('cognome', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.cognome ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Inserisci il cognome"
              />
              {errors.cognome && (
                <p className="mt-1 text-sm text-red-600">{errors.cognome}</p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="email@esempio.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Telefono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.telefono ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+39 123 456 7890"
              />
              {errors.telefono && (
                <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
              )}
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ruolo Principale *
            </label>
            <select
              value={formData.ruolo_principale}
              onChange={(e) => handleInputChange('ruolo_principale', e.target.value as CollaboratorRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="project_manager">{getRoleLabel('project_manager')}</option>
              <option value="developer">{getRoleLabel('developer')}</option>
              <option value="designer">{getRoleLabel('designer')}</option>
              <option value="analyst">{getRoleLabel('analyst')}</option>
              <option value="consultant">{getRoleLabel('consultant')}</option>
              <option value="grafico">{getRoleLabel('grafico')}</option>
              <option value="amazon_specialist">{getRoleLabel('amazon_specialist')}</option>
              <option value="linkedin_specialist">{getRoleLabel('linkedin_specialist')}</option>
              <option value="advertiser">{getRoleLabel('advertiser')}</option>
              <option value="altro">{getRoleLabel('altro')}</option>
            </select>
          </div>

          {/* Compensation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo di Compenso *
            </label>
            <select
              value={formData.tipo_compenso}
              onChange={(e) => handleInputChange('tipo_compenso', e.target.value as TipoCompenso)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="gettone">Compenso per Gettone</option>
              <option value="fisso">Compenso Fisso</option>
            </select>
          </div>

          {/* Compensation and Tokens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Gettoni Disponibili *
              </label>
              <input
                type="number"
                min="0"
                value={formData.gettoni_disponibili}
                onChange={(e) => handleInputChange('gettoni_disponibili', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.gettoni_disponibili ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.gettoni_disponibili && (
                <p className="mt-1 text-sm text-red-600">{errors.gettoni_disponibili}</p>
              )}
            </div>

            {formData.tipo_compenso === 'gettone' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Euro className="w-4 h-4 inline mr-1" />
                  Compenso per Gettone (€) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.compenso_per_gettone}
                  onChange={(e) => handleInputChange('compenso_per_gettone', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.compenso_per_gettone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.compenso_per_gettone && (
                  <p className="mt-1 text-sm text-red-600">{errors.compenso_per_gettone}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Euro className="w-4 h-4 inline mr-1" />
                  Compenso Fisso (€) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.compenso_fisso}
                  onChange={(e) => handleInputChange('compenso_fisso', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.compenso_fisso ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.compenso_fisso && (
                  <p className="mt-1 text-sm text-red-600">{errors.compenso_fisso}</p>
                )}
              </div>
            )}
          </div>



          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Salvataggio...' : 'Salva'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollaboratorForm;