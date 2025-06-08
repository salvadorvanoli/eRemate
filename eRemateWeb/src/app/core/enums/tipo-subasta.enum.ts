export enum TipoSubasta {
  PRESENCIAL = 'PRESENCIAL',
  HIBRIDA = 'HIBRIDA',
  REMOTA = 'REMOTA'
}

export interface TipoOption {
  value: TipoSubasta;
  label: string;
}

export const TIPOS_SUBASTA: TipoOption[] = [
  { value: TipoSubasta.PRESENCIAL, label: 'Presencial' },
  { value: TipoSubasta.HIBRIDA, label: 'Híbrida' },
  { value: TipoSubasta.REMOTA, label: 'Remota' }
];
