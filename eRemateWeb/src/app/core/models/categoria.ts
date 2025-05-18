import { Producto } from "./producto";

export interface Categoria {
    id: number;
    nombre: string;
    padre: CategoriaSimple;
    productos: Producto[];
}

export interface CategoriaSimple {
    id: number;
    nombre: string;
}

export interface CategoriaNodo {
    id: number;
    nombre: string;
    hijos: CategoriaNodo[];
    productos: number[];
}

export interface CategoriaCreate {
    nombre: string;
    padreId?: number;
}
