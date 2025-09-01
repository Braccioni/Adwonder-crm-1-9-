import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, FileText, TrendingUp, Euro, Users } from 'lucide-react';
import { dealService } from '../../services/dealService';
import { clientService } from '../../services/clientService';
import { activityService } from '../../services/activityService';
import { Deal, Client, Activity } from '../../types';

const Reports: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dealsData, clientsData, activitiesData] = await Promise.all([
        dealService.getAll(),
        clientService.getAll(),
        activityService.getAll()
      ]);
      setDeals(dealsData);
      setClients(clientsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tipizzare la funzione di export
  const exportToCSV = <T extends Record<string, unknown>>(data: T[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="bg-gray-200 h-8 w-48 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 h-64 rounded-lg"></div>
            <div className="bg-gray-200 h-64 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const dealsByStatus = [
    { name: 'In Corso', value: deals.filter(d => d.stato_trattativa === 'in_corso').length, color: '#3B82F6' },
    { name: 'Vinte', value: deals.filter(d => d.stato_trattativa === 'vinta').length, color: '#10B981' },
    { name: 'Perse', value: deals.filter(d => d.stato_trattativa === 'persa').length, color: '#EF4444' }
  ];

  const clientsByStatus = [
    { name: 'In Corso', value: clients.filter(c => c.stato_trattativa === 'in_corso').length },
    { name: 'Vinta', value: clients.filter(c => c.stato_trattativa === 'vinta').length },
    { name: 'Persa', value: clients.filter(c => c.stato_trattativa === 'persa').length },
    { name: 'Sospesa', value: clients.filter(c => c.stato_trattativa === 'sospesa').length }
  ];

  const valueByMonth = deals.reduce((acc, deal) => {
    const month = new Date(deal.data_apertura).toLocaleString('it-IT', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + deal.valore_stimato;
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = Object.entries(valueByMonth).map(([month, value]) => ({ month, value }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  // Financial data calculations
  const wonDeals = deals.filter(d => d.stato_trattativa === 'vinta');
  const activeClients = clients.filter(c => c.stato_trattativa === 'vinta');
  
  // Total revenue from won deals
  const totalRevenue = wonDeals.reduce((sum, deal) => sum + deal.valore_stimato, 0);
  
  // Revenue by client (only active clients with won deals)
  const revenueByClient = activeClients.map(client => {
    const clientDeals = wonDeals.filter(deal => deal.client_id === client.id);
    const revenue = clientDeals.reduce((sum, deal) => sum + deal.valore_stimato, 0);
    return {
      client: client.nome_azienda,
      revenue,
      deals: clientDeals.length
    };
  }).filter(item => item.revenue > 0).sort((a, b) => b.revenue - a.revenue);
  
  // Quarterly revenue
  const currentYear = new Date().getFullYear();
  const quarterlyRevenue = wonDeals.reduce((acc, deal) => {
    const dealDate = new Date(deal.data_apertura);
    if (dealDate.getFullYear() === currentYear) {
      const quarter = Math.floor(dealDate.getMonth() / 3) + 1;
      const key = `Q${quarter} ${currentYear}`;
      acc[key] = (acc[key] || 0) + deal.valore_stimato;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const quarterlyData = Object.entries(quarterlyRevenue).map(([quarter, revenue]) => ({
    quarter,
    revenue
  }));
  
  // Current month revenue
  const currentMonth = new Date().getMonth();
  const currentMonthRevenue = wonDeals
    .filter(deal => {
      const dealDate = new Date(deal.data_apertura);
      return dealDate.getFullYear() === currentYear && dealDate.getMonth() === currentMonth;
    })
    .reduce((sum, deal) => sum + deal.valore_stimato, 0);
  
  // Monthly revenue trend (last 6 months)
  const monthlyRevenueTrend = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const monthRevenue = wonDeals
      .filter(deal => {
        const dealDate = new Date(deal.data_apertura);
        return dealDate.getFullYear() === year && dealDate.getMonth() === month;
      })
      .reduce((sum, deal) => sum + deal.valore_stimato, 0);
    
    monthlyRevenueTrend.push({
      month: date.toLocaleString('it-IT', { month: 'short', year: 'numeric' }),
      revenue: monthRevenue
    });
  }

  const exportClients = () => {
    const clientData = clients.map(client => ({
      'Nome Azienda': client.nome_azienda,
      'Figura Preposta': client.figura_preposta,
      'Email': client.indirizzo_mail,
      'Contatti': client.contatti,
      'Stato Trattativa': client.stato_trattativa,
      'Tipologia Proposta': client.tipologia_proposta || 'N/A',
      'Valore Mensile': client.valore_mensile || 0,
      'Data Creazione': new Date(client.created_at).toLocaleDateString('it-IT')
    }));
    exportToCSV(clientData, 'clienti');
  };

  const exportDeals = () => {
    const dealData = deals.map(deal => ({
      'Oggetto': deal.oggetto_trattativa,
      'Cliente': deal.client?.nome_azienda || '',
      'Valore': deal.valore_stimato,
      'Stato': deal.stato_trattativa,
      'Data Apertura': new Date(deal.data_apertura).toLocaleDateString('it-IT'),
      'Prossimo Contatto': deal.scadenza_prossimo_contatto ? new Date(deal.scadenza_prossimo_contatto).toLocaleDateString('it-IT') : ''
    }));
    exportToCSV(dealData, 'trattative');
  };

  const exportActivities = () => {
    const activityData = activities.map(activity => ({
      'Tipo': activity.tipo_attivita,
      'Data': new Date(activity.data_ora).toLocaleDateString('it-IT'),
      'Ora': new Date(activity.data_ora).toLocaleTimeString('it-IT'),
      'Esito': activity.esito,
      'Cliente': activity.client?.nome_azienda || '',
      'Trattativa': activity.deal?.oggetto_trattativa || '',
      'Note': activity.note || ''
    }));
    exportToCSV(activityData, 'attivita');
  };

  const exportFinancialData = () => {
    const financialData = revenueByClient.map(item => ({
      'Cliente': item.client,
      'Fatturato': item.revenue,
      'Trattative Vinte': item.deals,
      'Fatturato Medio': item.deals > 0 ? item.revenue / item.deals : 0
    }));
    exportToCSV(financialData, 'reportistica-fatturato');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report</h1>
          <p className="text-gray-600 mt-1">Analisi delle performance commerciali</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportClients}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Esporta Clienti</span>
          </button>
          <button
            onClick={exportDeals}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Esporta Trattative</span>
          </button>
          <button
            onClick={exportActivities}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Esporta Attività</span>
          </button>
          <button
            onClick={exportFinancialData}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Esporta Fatturato</span>
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Status Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trattative per Stato</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dealsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dealsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Client Status Bar Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Clienti per Stato</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clientsByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Value Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Valore Trattative per Mese</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasso di Conversione</p>
              <p className="text-2xl font-bold text-gray-900">
                {deals.length > 0 ? Math.round((deals.filter(d => d.stato_trattativa === 'vinta').length / deals.length) * 100) : 0}%
              </p>
            </div>
            <FileText className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valore Medio Trattativa</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(deals.length > 0 ? deals.reduce((sum, deal) => sum + deal.valore_stimato, 0) / deals.length : 0)}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attività Questo Mese</p>
              <p className="text-2xl font-bold text-gray-900">
                {activities.filter(a => new Date(a.data_ora).getMonth() === new Date().getMonth()).length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Financial Reports Section */}
      <div className="mt-8">
        <div className="flex items-center mb-6">
          <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Reportistica Fatturato</h2>
          <p className="text-gray-600 ml-4">Analisi finanziaria clienti attivi</p>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Fatturato Totale</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <Euro className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Fatturato Mese Corrente</p>
                <p className="text-2xl font-bold">{formatCurrency(currentMonthRevenue)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Clienti Attivi</p>
                <p className="text-2xl font-bold">{activeClients.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Fatturato Medio</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0)}
                </p>
              </div>
              <FileText className="w-8 h-8 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Financial Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Quarterly Revenue */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fatturato per Trimestre {currentYear}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={quarterlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="revenue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Revenue Trend */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Fatturato Mensile</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Client */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fatturato per Cliente Attivo</h3>
          {revenueByClient.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueByClient.slice(0, 10)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis type="category" dataKey="client" width={150} />
                  <Tooltip 
                    formatter={(value) => [
                      formatCurrency(Number(value)), 
                      'Fatturato'
                    ]}
                    labelFormatter={(label) => `Cliente: ${label}`}
                  />
                  <Bar dataKey="revenue" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
              
              {/* Client Revenue Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fatturato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trattative Vinte
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fatturato Medio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {revenueByClient.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.client}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {formatCurrency(item.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.deals}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.deals > 0 ? item.revenue / item.deals : 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Euro className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nessun fatturato da clienti attivi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;