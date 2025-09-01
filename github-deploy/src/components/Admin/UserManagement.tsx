import React, { useState, useEffect } from 'react';
import { Users, Check, X, UserCheck, UserX } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// Definizione locale del tipo User per questo componente
interface User {
  id: string;
  email: string;
  nome: string;
  cognome?: string;
  ruolo: 'owner' | 'admin' | 'user';
  approved: boolean;
  last_login?: string;
  created_at: string;
}

// Aggiungi questa interfaccia
interface UserWithStatus extends User {
  status: 'pending' | 'approved';
}

type FilterTab = 'all' | 'pending' | 'approved';

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (currentUser?.user_metadata?.ruolo === 'owner') {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      const usersWithStatus = data.map(user => ({
        ...user,
        status: user.approved ? 'approved' : 'pending' as 'pending' | 'approved'
      }));

      setUsers(usersWithStatus);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserApproval = async (userId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ approved })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user approval:', error);
        return;
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, approved, status: approved ? 'approved' : 'pending' as 'approved' | 'pending' }
          : user
      ));
    } catch (error) {
      console.error('Error updating user approval:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    return user.status === filter;
  });

  const getStatusBadge = (status: string, approved: boolean) => {
    if (status === 'approved' || approved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <UserCheck className="w-3 h-3 mr-1" />
          Approvato
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <UserX className="w-3 h-3 mr-1" />
        In attesa
      </span>
    );
  };

  const getRoleBadge = (ruolo: string) => {
    const colors = {
      owner: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      commerciale: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[ruolo as keyof typeof colors] || colors.commerciale}`}>
        {ruolo.charAt(0).toUpperCase() + ruolo.slice(1)}
      </span>
    );
  };

  if (currentUser?.user_metadata?.ruolo !== 'owner') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <UserX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Accesso non autorizzato. Solo gli owner possono gestire gli utenti.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestione Utenti</h1>
            <p className="text-gray-600">Approva o gestisci gli account degli utenti</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'Tutti', count: users.length },
            { key: 'pending', label: 'In attesa', count: users.filter(u => !u.approved).length },
            { key: 'approved', label: 'Approvati', count: users.filter(u => u.approved).length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as FilterTab)} // Sostituire any con FilterTab
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Users table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredUsers.map((user) => (
            <li key={user.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.nome} {user.cognome}
                      </p>
                      {getRoleBadge(user.ruolo)}
                      {getStatusBadge(user.status, user.approved)}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    <p className="text-xs text-gray-400">
                      Registrato il {new Date(user.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
                
                {user.ruolo !== 'owner' && (
                  <div className="flex items-center space-x-2">
                    {!user.approved ? (
                      <button
                        onClick={() => updateUserApproval(user.id, true)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Approva
                      </button>
                    ) : (
                      <button
                        onClick={() => updateUserApproval(user.id, false)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Revoca
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessun utente trovato per il filtro selezionato.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;