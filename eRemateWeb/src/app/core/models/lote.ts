export interface Lote {
    id?: number; 
    subasta_id: number;
    compra_id: number;
    ganador_id: number;
    nombre: string;
    descripcion: string;
    valorBase: number;
    pujaMinima: number;
    disponibilidad: string; 
    condicionesDeEntrega: string;
    es_ganador?: boolean;
    oferta?: number;
    imagenUrl?: string;
    articulos?: any[]; // Array de artículos con sus imágenes
}