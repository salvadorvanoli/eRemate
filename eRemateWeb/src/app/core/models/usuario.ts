import { Rol } from "./rol";

export interface UsuarioSimple {
    id: number;
    email: string;
    rol: Rol;
    nombre: string;
    apellido: string;
    telefono: string;
}

export interface UsuarioRegistrado {
    id: number;
    email: string;
    telefono: string;
    contrasenia: string;
    tipo: string;
}

export interface UsuarioRematador {
    id: number;
    email: string;
    contrasenia: string;
    telefono: string;
    tipo: string;
    nombre: string;
    apellido: string;
    numeroMatricula: string;
    direccionFiscal: string;
    imagen: string;
}

export interface UsuarioCasaDeRemates {
    id: number;
    email: string;
    contrasenia: string;
    telefono: string;
    tipo: string;
    direccionFiscal: string;
    identificacionFiscal: string;
    nombreLegal: string;
    domicilio: string;
}

export interface AccesoUsuario {
    email: string;
    contrasenia: string;
}