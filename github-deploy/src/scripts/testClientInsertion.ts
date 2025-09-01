import { clientService } from '../services/clientService';
import { Client } from '../types';

// Cliente di test inventato
const testClientData: Omit<Client, 'id' | 'created_at' | 'updated_at'> = {
  nome_azienda: 'TechSolutions Italia SpA',
  figura_preposta: 'Marco Rossi',
  contatti: '02-12345678',
  indirizzo_mail: 'marco.rossi@techsolutions.it',
  data_invio_proposta: '2025-01-24',
  proposta_presentata: 'Sviluppo piattaforma e-commerce personalizzata con integrazione CRM',
  tipologia_proposta: 'sviluppo',
  frequenza: 'una-tantum',
  valore_mensile: 0,
  valore_spot: 15000,
  stato_trattativa: 'in_corso',
  data_fine: undefined,
  giorni_gestazione: 15,
  durata: '3 mesi',
  fine_lavori: undefined,
  estensione: undefined,
  // Campi contratto
  data_inizio_contratto: '2025-02-01',
  data_scadenza_contratto: '2025-05-01',
  durata_contratto_mesi: 3,
  rinnovo_automatico: false,
  notifiche_attive: true,
  user_id: '' // Verrà sovrascritto dal servizio
};

export async function testClientInsertion() {
  try {
    console.log('🚀 Inizio test inserimento cliente...');
    console.log('📋 Dati cliente:', testClientData);
    
    // Test 1: Creazione cliente
    console.log('\n1️⃣ Creazione nuovo cliente...');
    const newClient = await clientService.create(testClientData);
    console.log('✅ Cliente creato con successo!');
    console.log('🆔 ID cliente:', newClient.id);
    console.log('📊 Dati completi:', newClient);
    
    // Test 2: Recupero cliente creato
    console.log('\n2️⃣ Verifica recupero cliente...');
    const retrievedClient = await clientService.getById(newClient.id);
    console.log('✅ Cliente recuperato con successo!');
    console.log('📋 Nome azienda:', retrievedClient?.nome_azienda);
    
    // Test 3: Aggiornamento cliente
    console.log('\n3️⃣ Test aggiornamento cliente...');
    const updatedData = {
      ...newClient,
      stato_trattativa: 'vinta' as const,
      giorni_gestazione: 20
    };
    const updatedClient = await clientService.update(newClient.id, updatedData);
    console.log('✅ Cliente aggiornato con successo!');
    console.log('📈 Nuovo stato:', updatedClient.stato_trattativa);
    
    // Test 4: Lista tutti i clienti
    console.log('\n4️⃣ Verifica lista clienti...');
    const allClients = await clientService.getAll();
    console.log('✅ Lista clienti recuperata!');
    console.log('📊 Numero totale clienti:', allClients.length);
    
    console.log('\n🎉 TUTTI I TEST COMPLETATI CON SUCCESSO!');
    return newClient;
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error);
    throw error;
  }
}

// Esegui il test se il file viene eseguito direttamente
if (require.main === module) {
  testClientInsertion()
    .then(() => {
      console.log('\n✅ Test completato con successo!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test fallito:', error);
      process.exit(1);
    });
}