import { clientService } from '../services/clientService';
import { Client } from '../types';

// Dati del cliente Just Fashion srl
const justFashionData: Omit<Client, 'id' | 'created_at' | 'updated_at'> = {
  nome_azienda: 'Just Fashion srl',
  figura_preposta: 'Cristina',
  contatti: '3888518888',
  indirizzo_mail: 'cristinajustfashion@gmail.com',
  data_invio_proposta: '2025-01-24', // Data di oggi come data invio proposta
  proposta_presentata: 'Servizio di consulenza LinkedIn per miglioramento presenza digitale e lead generation',
  tipologia_proposta: 'consulenza',
  frequenza: 'mensile',
  valore_mensile: 2000,
  valore_spot: 0,
  stato_trattativa: 'vinta',
  data_fine: undefined,
  giorni_gestazione: 0,
  durata: '6 mesi',
  fine_lavori: undefined,
  estensione: undefined,
  // Campi contratto
  data_inizio_contratto: '2025-07-24',
  data_scadenza_contratto: '2026-01-24',
  durata_contratto_mesi: 6,
  rinnovo_automatico: false,
  notifiche_attive: true,
  user_id: '' // Verrà sovrascritto dal servizio
};

export async function addJustFashionClient() {
  try {
    console.log('Creazione cliente Just Fashion srl...');
    const newClient = await clientService.create(justFashionData);
    console.log('Cliente creato con successo:', newClient);
    return newClient;
  } catch (error) {
    console.error('Errore durante la creazione del cliente:', error);
    throw error;
  }
}

// Esegui la funzione se il file viene eseguito direttamente
if (require.main === module) {
  addJustFashionClient()
    .then(() => {
      console.log('Operazione completata con successo!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Operazione fallita:', error);
      process.exit(1);
    });
}