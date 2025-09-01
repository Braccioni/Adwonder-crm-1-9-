import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Mail, Phone, Clock, Euro } from 'lucide-react';
import { Collaborator, CollaboratorRole } from '../../types';

interface CollaboratorListProps {
  collaborators: Collaborator[];
  onEdit: (collaborator: Collaborator) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

const CollaboratorList: React.FC<CollaboratorListProps> = ({
  collaborators,
  onEdit,
  onDelete,
  onAddNew
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<CollaboratorRole | 'all'>('all');

  const filteredCollaborators = collaborators.filter(collaborator => {
    const matchesSearch = 
      collaborator.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collaborator.cognome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collaborator.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || collaborator.ruolo_principale === roleFilter;
    
    return matchesSearch && matchesRole;
  });

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

  const getRoleColor = (role: CollaboratorRole) => {
    const roleColors: Record<CollaboratorRole, string> = {
      project_manager: 'bg-purple-100 text-purple-800',
      developer: 'bg-blue-100 text-blue-800',
      designer: 'bg-pink-100 text-pink-800',
      analyst: 'bg-green-100 text-green-800',
      consultant: 'bg-yellow-100 text-yellow-800',
      grafico: 'bg-orange-100 text-orange-800',
      amazon_specialist: 'bg-amber-100 text-amber-800',
      linkedin_specialist: 'bg-cyan-100 text-cyan-800',
      advertiser: 'bg-red-100 text-red-800',
      altro: 'bg-gray-100 text-gray-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca collaboratori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
        </div>
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as CollaboratorRole | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Tutti i ruoli</option>
          <option value="project_manager">Project Manager</option>
          <option value="developer">Sviluppatore</option>
          <option value="designer">Designer</option>
          <option value="analyst">Analista</option>
          <option value="consultant">Consulente</option>
          <option value="grafico">Grafico</option>
          <option value="amazon_specialist">Amazon Specialist</option>
          <option value="linkedin_specialist">LinkedIn Specialist</option>
          <option value="advertiser">Advertiser</option>
          <option value="altro">Altro</option>
        </select>
        
        <button
          onClick={onAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuovo Collaboratore</span>
        </button>
      </div>

      {/* Collaborators Grid */}
      {filteredCollaborators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollaborators.map((collaborator) => (
            <div key={collaborator.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {collaborator.nome} {collaborator.cognome}
                    </h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${getRoleColor(collaborator.ruolo_principale)}`}>
                      {getRoleLabel(collaborator.ruolo_principale)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onEdit(collaborator)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(collaborator.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="truncate">{collaborator.email}</span>
                  </div>
                  {collaborator.telefono && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{collaborator.telefono}</span>
                    </div>
                  )}
                </div>

                {/* Tokens and Rate */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Gettoni disponibili</span>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      {collaborator.gettoni_disponibili}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Euro className="w-4 h-4 mr-2" />
                      <span>
                        {collaborator.tipo_compenso === 'gettone' ? 'Compenso/gettone' : 'Compenso fisso'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {collaborator.tipo_compenso === 'gettone' && collaborator.compenso_per_gettone
                        ? formatCurrency(collaborator.compenso_per_gettone)
                        : collaborator.tipo_compenso === 'fisso' && collaborator.compenso_fisso
                        ? formatCurrency(collaborator.compenso_fisso)
                        : 'Non definito'}
                    </span>
                  </div>
                </div>

                {/* Token Status */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Stato gettoni</span>
                    <span className={`px-2 py-1 rounded ${
                      collaborator.gettoni_disponibili > 20 ? 'bg-green-100 text-green-800' :
                      collaborator.gettoni_disponibili > 10 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {collaborator.gettoni_disponibili > 20 ? 'Ottimo' :
                       collaborator.gettoni_disponibili > 10 ? 'Medio' : 'Basso'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900">Nessun collaboratore trovato</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || roleFilter !== 'all'
              ? 'Prova a modificare i filtri di ricerca'
              : 'Inizia aggiungendo il tuo primo collaboratore'}
          </p>
          {!searchTerm && roleFilter === 'all' && (
            <button
              onClick={onAddNew}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Aggiungi primo collaboratore
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CollaboratorList;