import React from 'react';
import { Edit, Trash2, Calendar, Users, AlertCircle } from 'lucide-react';
import { Project, ProjectStatus, ProjectPriority } from '../../types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  getStatusColor: (status: ProjectStatus) => string;
  getPriorityColor: (priority: ProjectPriority) => string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  getStatusColor,
  getPriorityColor
}) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: it });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getProgressPercentage = () => {
    if (!project.budget_stimato || project.budget_stimato === 0) return 0;
    return Math.min((project.budget_utilizzato || 0) / project.budget_stimato * 100, 100);
  };

  const isOverdue = () => {
    const today = new Date();
    const endDate = new Date(project.data_fine_prevista);
    return today > endDate && !['completato', 'annullato'].includes(project.stato);
  };

  const totalTokensAssigned = project.collaboratori?.reduce((sum, c) => sum + c.gettoni_assegnati, 0) || 0;
  const totalTokensUsed = project.collaboratori?.reduce((sum, c) => sum + c.gettoni_utilizzati, 0) || 0;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.nome_progetto}</h3>
            <p className="text-sm text-gray-600">{project.client?.nome_azienda}</p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => onEdit(project)}
              className="text-blue-600 hover:text-blue-900 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(project.id)}
              className="text-red-600 hover:text-red-900 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex items-center space-x-2 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.stato)}`}>
            {project.stato.replace('_', ' ').toUpperCase()}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priorita)}`}>
            {project.priorita.toUpperCase()}
          </span>
          {isOverdue() && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              SCADUTO
            </span>
          )}
        </div>

        {/* Description */}
        {project.descrizione && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.descrizione}</p>
        )}

        {/* Dates */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Inizio: {formatDate(project.data_inizio)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Fine prevista: {formatDate(project.data_fine_prevista)}</span>
          </div>
          {project.data_fine_effettiva && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Fine effettiva: {formatDate(project.data_fine_effettiva)}</span>
            </div>
          )}
        </div>

        {/* Budget Progress */}
        {project.budget_stimato && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Budget</span>
              <span>{formatCurrency(project.budget_utilizzato || 0)} / {formatCurrency(project.budget_stimato)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  getProgressPercentage() > 90 ? 'bg-red-500' : 
                  getProgressPercentage() > 75 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Collaborators and Tokens */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{project.collaboratori?.length || 0} collaboratori</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs">
              Gettoni: {totalTokensUsed}/{totalTokensAssigned}
            </span>
          </div>
        </div>

        {/* Collaborators List */}
        {project.collaboratori && project.collaboratori.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Collaboratori</h4>
            <div className="space-y-2">
              {project.collaboratori.slice(0, 3).map((pc) => (
                <div key={pc.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700">
                    {pc.collaborator?.nome} {pc.collaborator?.cognome}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">{pc.ruolo_progetto}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {pc.gettoni_utilizzati}/{pc.gettoni_assegnati}
                    </span>
                  </div>
                </div>
              ))}
              {project.collaboratori.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{project.collaboratori.length - 3} altri collaboratori
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;