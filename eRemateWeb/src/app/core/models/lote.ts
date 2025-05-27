export interface Lote {
    id: number;
    subasta_id: number;
    nombre: string;
    descripcion: string;
    valorBase: number;
    //imagenUrl?: string;
    pujaMinima: number;
    disponibilidad: string;
    condicionesDeEntrega: string;
    oferta: number;
}