import { CategoriaSimple } from './categoria';

export interface Articulo {
    id?: number;
    nombre: string;
    lote_id: number;
    imagenes: string[];
    estado: string;
    especificacionesTecnicas: string;
    categoria?: CategoriaSimple; // ✅ Agregar categoría
    categoria_id?: number; // ✅ Agregar ID de categoría para envío
}