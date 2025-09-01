import React from 'react';
import { Users, Briefcase, TrendingUp, TrendingDown, Calendar, Euro, Bell, AlertTriangle, Award, Star, RefreshCw } from 'lucide-react';
import StatsCard from './StatsCard';
import { useDashboardData } from '../../hooks/useDashboardData';
import { DashboardStats, Deal } from '../../types';

const Dashboard: React.FC = () => {
  const { stats, recentDeals, loading, error, refreshData } = useDashboardData();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vinta': return 'text-green-600 bg-green-100';
      case 'persa': return 'text-red-600 bg-red-100';
      case 'in_corso': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Panoramica delle performance commerciali</p>
          {error && (
            <p className="text-amber-600 text-sm mt-1 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1" />
              {error} - Visualizzazione dati di esempio
            </p>
          )}
        </div>
        <button
          onClick={refreshData}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aggiorna
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Clienti Totali"
          value={stats.total_clients}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Trattative Attive"
          value={stats.active_deals}
          icon={Briefcase}
          color="yellow"
        />
        <StatsCard
          title="Trattative Vinte"
          value={stats.won_deals}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Trattative Perse"
          value={stats.lost_deals}
          icon={TrendingDown}
          color="red"
        />
        <StatsCard
          title="Valore Pipeline"
          value={formatCurrency(stats.total_deal_value)}
          icon={Euro}
          color="purple"
        />
        <StatsCard
          title="Attività Settimana"
          value={stats.this_week_activities}
          icon={Calendar}
          color="purple"
        />
        <StatsCard
          title="Notifiche Pendenti"
          value={stats.pending_notifications}
          icon={Bell}
          color="yellow"
        />
        <StatsCard
          title="Contratti in Scadenza"
          value={stats.contracts_expiring_soon}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Best Clients and Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Clients */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-500" />
              Migliori Clienti
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {stats.best_client_by_revenue && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">🏆 Migliore per Fatturato</h3>
                <p className="text-green-700 font-semibold">{stats.best_client_by_revenue.nome_azienda}</p>
                <p className="text-green-600 text-sm">{formatCurrency(stats.best_client_by_revenue.total_revenue)}</p>
              </div>
            )}
            {stats.best_client_by_contract_duration && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">⏱️ Migliore per Durata Contratto</h3>
                <p className="text-blue-700 font-semibold">{stats.best_client_by_contract_duration.nome_azienda}</p>
                <p className="text-blue-600 text-sm">{stats.best_client_by_contract_duration.contract_duration_months} mesi</p>
              </div>
            )}
            {!stats.best_client_by_revenue && !stats.best_client_by_contract_duration && (
              <p className="text-gray-500 text-center py-4">Nessun dato disponibile</p>
            )}
          </div>
        </div>

        {/* Sales Performance */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Star className="w-5 h-5 mr-2 text-purple-500" />
              Performance di Vendita
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {stats.best_sales_performance ? (
              <>
                {stats.best_sales_performance.best_month.month && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-800 mb-2">📅 Mese Migliore</h3>
                    <p className="text-purple-700 font-semibold">
                      {new Date(stats.best_sales_performance.best_month.month + '-01').toLocaleDateString('it-IT', { year: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-purple-600 text-sm">
                      {stats.best_sales_performance.best_month.deals_count} trattative - {formatCurrency(stats.best_sales_performance.best_month.total_value)}
                    </p>
                  </div>
                )}
                {stats.best_sales_performance.best_day.date && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-medium text-orange-800 mb-2">🗓️ Giorno Migliore</h3>
                    <p className="text-orange-700 font-semibold">
                      {new Date(stats.best_sales_performance.best_day.date).toLocaleDateString('it-IT')}
                    </p>
                    <p className="text-orange-600 text-sm">{stats.best_sales_performance.best_day.deals_count} trattative chiuse</p>
                  </div>
                )}
                {stats.best_sales_performance.biggest_deal.oggetto_trattativa && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-2">💰 Vendita Migliore</h3>
                    <p className="text-yellow-700 font-semibold">{stats.best_sales_performance.biggest_deal.oggetto_trattativa}</p>
                    <p className="text-yellow-600 text-sm">
                      {formatCurrency(stats.best_sales_performance.biggest_deal.valore_stimato)} - {stats.best_sales_performance.biggest_deal.client_name}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center py-4">Nessun dato disponibile</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Deals */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Trattative Recenti</h2>
        </div>
        <div className="p-6">
          {recentDeals.length > 0 ? (
            <div className="space-y-4">
              {recentDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{deal.oggetto_trattativa}</h3>
                    <p className="text-sm text-gray-600">{deal.client?.nome_azienda}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-gray-900">{formatCurrency(deal.valore_stimato)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.stato_trattativa)}`}>
                      {deal.stato_trattativa.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Nessuna trattativa disponibile</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;