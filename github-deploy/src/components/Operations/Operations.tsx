import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Briefcase, Clock, AlertCircle } from 'lucide-react';
import { Project, Collaborator, ProjectStatus, ProjectPriority } from '../../types';
import { projectService } from '../../services/projectService';
import { collaboratorService } from '../../services/collaboratorService';
import { useAuth } from '../../contexts/AuthContext';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';
import CollaboratorList from './CollaboratorList';
import CollaboratorForm from './CollaboratorForm';

const Operations: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'collaborators'>('projects');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showCollaboratorForm, setShowCollaboratorForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'all'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, collaboratorsData] = await Promise.all([
        projectService.getAll(),
        collaboratorService.getAll()
      ]);
      setProjects(projectsData);
      setCollaborators(collaboratorsData);
    } catch (error) {
      console.error('Error loading operations data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSubmit = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'client' | 'collaboratori'>) => {
    try {
      if (editingProject) {
        await projectService.update(editingProject.id, projectData);
      } else {
        await projectService.create(projectData);
      }
      await loadData();
      setShowProjectForm(false);
      setEditingProject(undefined);
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleCollaboratorSubmit = async (collaboratorData: Omit<Collaborator, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      if (editingCollaborator) {
        await collaboratorService.update(editingCollaborator.id, collaboratorData);
      } else {
        await collaboratorService.create({ ...collaboratorData, user_id: user?.id || '' });
      }
      await loadData();
      setShowCollaboratorForm(false);
      setEditingCollaborator(undefined);
    } catch (error) {
      console.error('Error saving collaborator:', error);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };

  const handleEditCollaborator = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator);
    setShowCollaboratorForm(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo progetto?')) {
      try {
        await projectService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleDeleteCollaborator = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo collaboratore?')) {
      try {
        await collaboratorService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting collaborator:', error);
      }
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.nome_progetto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client?.nome_azienda?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.stato === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priorita === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'pianificazione': return 'bg-blue-100 text-blue-800';
      case 'in_corso': return 'bg-yellow-100 text-yellow-800';
      case 'completato': return 'bg-green-100 text-green-800';
      case 'sospeso': return 'bg-gray-100 text-gray-800';
      case 'annullato': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: ProjectPriority) => {
    switch (priority) {
      case 'bassa': return 'bg-green-100 text-green-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'alta': return 'bg-orange-100 text-orange-800';
      case 'critica': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeProjects = projects.filter(p => ['pianificazione', 'in_corso'].includes(p.stato));
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget_stimato || 0), 0);
  const usedBudget = projects.reduce((sum, p) => sum + (p.budget_utilizzato || 0), 0);
  const totalTokens = collaborators.reduce((sum, c) => sum + c.gettoni_disponibili, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operatività</h1>
          <p className="text-gray-600 mt-1">Gestisci progetti attivi e collaboratori</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Progetti Attivi</p>
              <p className="text-2xl font-bold text-gray-900">{activeProjects.length}</p>
            </div>
            <Briefcase className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collaboratori</p>
              <p className="text-2xl font-bold text-gray-900">{collaborators.length}</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Budget Totale</p>
              <p className="text-2xl font-bold text-gray-900">€{totalBudget.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Utilizzato: €{usedBudget.toLocaleString()}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gettoni Totali</p>
              <p className="text-2xl font-bold text-gray-900">{totalTokens}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'projects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Briefcase className="w-4 h-4 inline mr-2" />
            Progetti
          </button>
          <button
            onClick={() => setActiveTab('collaborators')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'collaborators'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Collaboratori
          </button>
        </nav>
      </div>

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Projects Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cerca progetti..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tutti gli stati</option>
              <option value="pianificazione">Pianificazione</option>
              <option value="in_corso">In Corso</option>
              <option value="completato">Completato</option>
              <option value="sospeso">Sospeso</option>
              <option value="annullato">Annullato</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as ProjectPriority | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tutte le priorità</option>
              <option value="bassa">Bassa</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Critica</option>
            </select>
            
            <button
              onClick={() => setShowProjectForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Progetto</span>
            </button>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
              />
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun progetto trovato</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Inizia creando il tuo primo progetto'}
              </p>
              {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Crea primo progetto
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Collaborators Tab */}
      {activeTab === 'collaborators' && (
        <CollaboratorList
          collaborators={collaborators}
          onEdit={handleEditCollaborator}
          onDelete={handleDeleteCollaborator}
          onAddNew={() => setShowCollaboratorForm(true)}
        />
      )}

      {/* Forms */}
      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onSubmit={handleProjectSubmit}
          onClose={() => {
            setShowProjectForm(false);
            setEditingProject(undefined);
          }}
        />
      )}

      {showCollaboratorForm && (
        <CollaboratorForm
          collaborator={editingCollaborator}
          onSave={handleCollaboratorSubmit}
          onCancel={() => {
            setShowCollaboratorForm(false);
            setEditingCollaborator(undefined);
          }}
        />
      )}
    </div>
  );
};

export default Operations;