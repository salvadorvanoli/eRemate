export enum EstadoSubasta {
  PENDIENTE_APROBACION = 'PENDIENTE_APROBACION',
  PENDIENTE = 'PENDIENTE',
  ACEPTADA = 'ACEPTADA',
  INICIADA = 'INICIADA',
  CERRADA = 'CERRADA',
  CANCELADA = 'CANCELADA'
}

export interface EstadoOption {
  value: EstadoSubasta;
  label: string;
}

export const ESTADOS_SUBASTA: EstadoOption[] = [
  { value: EstadoSubasta.PENDIENTE_APROBACION, label: 'Pendiente de Aprobación' },
  { value: EstadoSubasta.PENDIENTE, label: 'Pendiente' },
  { value: EstadoSubasta.ACEPTADA, label: 'Aceptada' },
  { value: EstadoSubasta.INICIADA, label: 'Iniciada' },
  { value: EstadoSubasta.CERRADA, label: 'Cerrada' },
  { value: EstadoSubasta.CANCELADA, label: 'Cancelada' }
];
