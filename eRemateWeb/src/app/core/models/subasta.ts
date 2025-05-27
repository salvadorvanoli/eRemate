export interface Subasta {
    id: number;
    urlTransmision: string;
    tipoSubasta: string;
    fechaInicio: Date;
    fechaCierre: Date;
    ubicacion: string;
    loteActual_id?: number;
    //imagenUrl?: string;
}