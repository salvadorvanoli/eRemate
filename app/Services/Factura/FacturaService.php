<?php

namespace App\Services\Factura;

use App\Models\Factura;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class FacturaService implements FacturaServiceInterface
{
    public function obtenerTodas()
    {
        return Factura::all();
    }

    public function buscarPorId($id)
    {
        return Factura::findOrFail($id);
    }

    public function crear(array $datos)
    {
        return Factura::create($datos);
    }

    public function eliminar($id)
    {
        $factura = $this->buscarPorId($id);
        $factura->delete();
    }

    public function obtenerPorUsuario($usuarioId)
    {
        return Factura::whereIn('id', function($query) use ($usuarioId) {
            $query->select('factura_id')
                  ->from('compras')
                  ->where('usuarioRegistrado_id', $usuarioId);
        })->get();
    }

    public function generarPdf($facturaId)
    {
        $factura = Factura::with('compra.usuarioRegistrado.id')->findOrFail($facturaId);
        $pdf = Pdf::loadView('factura_pdf', ['factura' => $factura]);
        return $pdf->download('factura_'.$factura->id.'.pdf');
    }
}