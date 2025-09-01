import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Mail, Calendar } from 'lucide-react';
import { Activity } from '../../types';
import { activityService } from '../../services/activityService';
import ActivityForm from './ActivityForm';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const ActivityList: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  useEffect(() => {
    loadActivities();
  }, []);

  const filterActivities = useCallback(() => {
    let filtered = activities;

    if (searchTerm) {
      filtered = filtered.filter(activity =>
        (activity.note && activity.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
        activity.client?.nome_azienda.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.tipo_attivita === typeFilter);
    }

    if (outcomeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.esito === outcomeFilter);
    }

    setFilteredActivities(filtered);
  }, [activities, searchTerm, typeFilter, outcomeFilter]);

  useEffect(() => {
    filterActivities();
  }, [filterActivities]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await activityService.getAll();
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (activityData: Omit<Activity, 'id' | 'created_at' | 'client' | 'deal'>) => {
    try {
      if (editingActivity) {
        await activityService.update(editingActivity.id, activityData);
      } else {
        await activityService.create(activityData);
      }
      await loadActivities();
      setShowForm(false);
      setEditingActivity(undefined);
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa attività?')) {
      try {
        await activityService.delete(id);
        await loadActivities();
      } catch (error) {
        console.error('Error deleting activity:', error);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'meeting': return Calendar;
      default: return Calendar;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'positiva': return 'bg-green-100 text-green-800';
      case 'da_richiamare': return 'bg-yellow-100 text-yellow-800';
      case 'nessuna_risposta': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: it });
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
          <h1 className="text-2xl font-bold text-gray-900">Attività</h1>
          <p className="text-gray-600 mt-1">Traccia tutte le tue attività commerciali</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuova Attività</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca attività..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tutti i tipi</option>
            <option value="call">Chiamata</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
          </select>
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tutti gli esiti</option>
            <option value="positiva">Positiva</option>
            <option value="da_richiamare">Da Richiamare</option>
            <option value="nessuna_risposta">Nessuna Risposta</option>
          </select>
          <div className="text-sm text-gray-600 flex items-center">
            {filteredActivities.length} di {activities.length} attività
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredActivities.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredActivities.map((activity) => {
              const TypeIcon = getTypeIcon(activity.tipo_attivita);
              return (
                <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <TypeIcon className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-sm font-medium text-gray-900 capitalize">
                            {activity.tipo_attivita}
                          </h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOutcomeColor(activity.esito)}`}>
                            {activity.esito.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDateTime(activity.data_ora)}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          {activity.client && (
                            <p className="text-sm text-gray-600">
                              Cliente: <span className="font-medium">{activity.client.nome_azienda}</span>
                            </p>
                          )}
                          {activity.deal && (
                            <p className="text-sm text-gray-600">
                              Trattativa: <span className="font-medium">{activity.deal.oggetto_trattativa}</span>
                            </p>
                          )}
                          {activity.note && (
                            <p className="text-sm text-gray-700 mt-2">{activity.note}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(activity)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna attività trovata</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || typeFilter !== 'all' || outcomeFilter !== 'all'
                ? 'Prova a modificare i filtri di ricerca'
                : 'Inizia aggiungendo una nuova attività'}
            </p>
          </div>
        )}
      </div>

      {showForm && (
        <ActivityForm
          activity={editingActivity}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingActivity(undefined);
          }}
        />
      )}
    </div>
  );
};

export default ActivityList;