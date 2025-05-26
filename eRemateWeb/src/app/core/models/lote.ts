export interface Lote {
    id: number;
    subasta_id: number;
    valorBase: number;
    //imagenUrl?: string;
    pujaMinima: number;
    disponibilidad: string;
    condicionesDeEntrga: string;
    oferta: number;
}