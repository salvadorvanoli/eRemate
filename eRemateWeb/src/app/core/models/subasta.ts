export interface Subasta {

    id: number; 
    casaDeRemates_id: number;
    rematador_id: number;
    mensajes: string;
    urlTransmision: string;
    tipoSubasta: string;
    estado: string;
    pujaHabilitada: boolean;
    fechaInicio: Date;
    fechaCierre: Date;
    ubicacion: string;

}