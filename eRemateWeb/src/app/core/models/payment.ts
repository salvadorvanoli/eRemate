export interface PaymentRequest {
  monto: number;
  metodo_entrega: string;
  usuario_registrado_id: number;
}

export interface PaymentResponse {
  success: boolean;
  data?: {
    payment_id: string;
    approval_url: string;
  };
  error?: string;
}

export interface PaymentExecution {
  payment_id: string;
  payer_id: string;
  usuario_registrado_id: number;
}

export interface PaymentResult {
  success: boolean;
  data?: {
    payment_id: string;
    factura: any;
    compra: any;
  };
  message?: string;
  error?: string;
}
