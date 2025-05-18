export interface PublicacionSimple {
    id: number;
    titulo: string;
    contenido: string;
    fechaCreacion: Date;
}

export interface AgregarPublicacion {
    titulo: string;
    contenido: string;
    fechaCreacion: Date;
    comentarios: any[];
}