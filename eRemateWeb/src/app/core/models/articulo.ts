export interface Articulo {
    id?: number; 
    lote_id: number;
    nombre: string;
    imagenes: string[]; 
    estado?: string;
    especificacionesTecnicas: string; 
}