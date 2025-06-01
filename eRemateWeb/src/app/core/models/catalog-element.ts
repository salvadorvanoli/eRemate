export interface CatalogElement {
    id: number;
    imagen?: string;
    lotes?: number[];
    lote_id: number;
    subasta_id: number;
    etiqueta: string;
    texto1: string;
    texto2: string;
    texto3: string;
    fechaInicio: Date;
    fechaCierre: Date;
}

export interface ArticuloCatalogo {
    id: number;
    lote_id: number;
    nombre: string;
    imagenes: string[];
    especificacionesTecnicas: string;
    estado: string;
    categoria_id: number;
    fechaInicio: Date;
    fechaCierre: Date;
}

export interface SubastaCatalogo {
    id: number; 
    casaDeRemates_id: number;
    rematador_id: number;
    mensajes: string;
    urlTransmision: string;
    tipoSubasta: string;
    estado: string;
    fechaInicio: Date;
    fechaCierre: Date;
    ubicacion: string;
    loteActual_id?: number;
    lotes: number[];
}