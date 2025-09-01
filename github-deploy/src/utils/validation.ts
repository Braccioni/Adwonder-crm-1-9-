import { z } from 'zod';

export const clientSchema = z.object({
  nome_azienda: z.string().min(1, 'Nome azienda richiesto'),
  figura_preposta: z.string().min(1, 'Figura preposta richiesta'),
  contatti: z.string().min(1, 'Contatti richiesti'),
  indirizzo_mail: z.string().email('Email non valida'),
  valore_mensile: z.number().min(0, 'Valore deve essere positivo').optional(),
  valore_spot: z.number().min(0, 'Valore deve essere positivo').optional(),
});

export const dealSchema = z.object({
  client_id: z.string().min(1, 'Cliente richiesto'),
  oggetto_trattativa: z.string().min(1, 'Oggetto trattativa richiesto'),
  valore_stimato: z.number().min(0, 'Valore deve essere positivo'),
  data_apertura: z.string().min(1, 'Data apertura richiesta'),
  stato_trattativa: z.enum(['in_corso', 'vinta', 'persa'], {
    errorMap: () => ({ message: 'Stato trattativa non valido' })
  }),
  scadenza_prossimo_contatto: z.string().optional(),
  note: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
export type DealFormData = z.infer<typeof dealSchema>;