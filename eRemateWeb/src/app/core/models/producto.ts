import { CategoriaSimple } from './categoria';

export interface Producto {
    id: number;
    nombre: string;
    precio: number;
    imagenes: string[];
    descripcion: string;
}

export interface Articulo {
    id: number;
    lote_id: number;
    nombre: string;
    imagenes: string[];
    especificacionesTecnicas: any[];
    estado: string;
    categoria_id?: number;
    categoria?: CategoriaSimple;
    created_at?: string;
    updated_at?: string;
}