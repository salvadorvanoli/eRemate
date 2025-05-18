export interface EmailRequest {
    to: string;
    from: string;
    subject: string;
    body: string;
}

export interface EmailResponse {
    id: number;
    nombre: string;
    email: string;
    mensaje: string;
}