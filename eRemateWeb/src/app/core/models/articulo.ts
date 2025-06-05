import { CategoriaSimple } from './categoria';

export interface Articulo {
    id?: number;
    nombre: string;
    lote_id: number;
    imagenes: string[];
    estado: string;
    especificacionesTecnicas: string;
    categoria?: CategoriaSimple;
    categoria_id?: number;
}