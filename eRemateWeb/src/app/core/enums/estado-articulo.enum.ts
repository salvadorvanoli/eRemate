export enum EstadoArticulo {
  NUEVO = 'NUEVO',
  MUY_BUENO = 'MUY_BUENO',
  BUENO = 'BUENO',
  ACEPTABLE = 'ACEPTABLE',
  REACONDICIONADO = 'REACONDICIONADO',
  DEFECTUOSO = 'DEFECTUOSO'
}

export interface EstadoOption {
  value: string;
  label: string;
}

export const ESTADOS_ARTICULO: EstadoOption[] = [
  { value: EstadoArticulo.NUEVO, label: 'Nuevo' },
  { value: EstadoArticulo.MUY_BUENO, label: 'Muy Bueno' },
  { value: EstadoArticulo.BUENO, label: 'Bueno' },
  { value: EstadoArticulo.ACEPTABLE, label: 'Aceptable' },
  { value: EstadoArticulo.REACONDICIONADO, label: 'Reacondicionado' },
  { value: EstadoArticulo.DEFECTUOSO, label: 'Defectuoso' }
];
