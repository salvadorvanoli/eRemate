<?php

namespace App\Http\Controllers;
use App\Models\UsuarioRegistrado; 
use Illuminate\Http\Request;
use App\Services\UsuarioRegistrado\UsuarioRegistradoServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;

class UsuarioRegistradoController extends Controller
{
    protected $usuarioRegistradoService;

    public function __construct(UsuarioRegistradoServiceInterface $usuarioRegistradoService)
    {
        $this->usuarioRegistradoService = $usuarioRegistradoService;
    }

    // Obtener métodos de pago registrados
    public function getMetodosPago($id)
    {
        try {
            return response()->json($this->usuarioRegistradoService->obtenerMetodosPago($id));
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener los métodos de pago: ' . $e->getMessage()], 500);
        }
    }

    // Agregar un método de pago
    public function addMetodoPago(Request $request, $id)
    {
        try {
            $request->validate([
                'metodo_pago' => 'required|string'
            ]);
            $metodos = $this->usuarioRegistradoService->agregarMetodoPago($id, $request->metodo_pago);
            return response()->json($metodos);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Error de validación',
                'mensajes' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al agregar el método de pago: ' . $e->getMessage()], 500);
        }
    }

    // Obtener historial de compras
    public function getHistorialCompras($id)
    {
        try {
            return response()->json($this->usuarioRegistradoService->obtenerHistorialCompras($id));
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener el historial de compras: ' . $e->getMessage()], 500);
        }
    }
    
    // Agregar un lote a favoritos
    public function addLoteFavorito(Request $request, $usuarioId)
    {
        try {
            $request->validate([
                'lote_id' => 'required|integer|exists:lotes,id'
            ]);
            
            $resultado = $this->usuarioRegistradoService->agregarLoteFavorito($usuarioId, $request->lote_id);
            
            if (isset($resultado['error'])) {
                return response()->json(['error' => $resultado['error']], 422);
            }
            
            return response()->json(['mensaje' => 'Lote agregado a favoritos exitosamente']);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Error de validación',
                'mensajes' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al agregar lote a favoritos: ' . $e->getMessage()], 500);
        }
    }
    
    // Quitar un lote de favoritos
    public function removeLoteFavorito($usuarioId, $loteId)
    {
        try {
            $resultado = $this->usuarioRegistradoService->quitarLoteFavorito($usuarioId, $loteId);
            
            if (isset($resultado['error'])) {
                return response()->json(['error' => $resultado['error']], 422);
            }
            
            return response()->json(['mensaje' => 'Lote eliminado de favoritos exitosamente']);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al quitar lote de favoritos: ' . $e->getMessage()], 500);
        }
    }
    
    // Obtener lotes favoritos del usuario
    public function getLotesFavoritos($usuarioId)
    {
        try {
            $lotesFavoritos = $this->usuarioRegistradoService->obtenerLotesFavoritos($usuarioId);
            
            if (isset($lotesFavoritos['error'])) {
                return response()->json(['error' => $lotesFavoritos['error']], 500);
            }
            
            return response()->json($lotesFavoritos);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener lotes favoritos: ' . $e->getMessage()], 500);
        }
    }

    // Obtener lotes donde el usuario ha pujado
    public function getLotesConPujas($usuarioId)
    {
        try {
            $lotesConPujas = $this->usuarioRegistradoService->obtenerLotesConPujas($usuarioId);
            
            if (isset($lotesConPujas['error'])) {
                return response()->json(['error' => $lotesConPujas['error']], 500);
            }
            
            return response()->json($lotesConPujas);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener lotes con pujas: ' . $e->getMessage()], 500);
        }
    }

    // Nuevos métodos para favoritos con autenticación
    // Obtener lotes favoritos del usuario autenticado
    public function getLotesFavoritosAuth(Request $request)
    {
        try {
            $usuario = $request->user();
            
            if (!$usuario) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            $lotesFavoritos = $this->usuarioRegistradoService->obtenerLotesFavoritos($usuario->id);
            
            if (isset($lotesFavoritos['error'])) {
                return response()->json(['error' => $lotesFavoritos['error']], 500);
            }
            
            return response()->json($lotesFavoritos);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al obtener lotes favoritos: ' . $e->getMessage()], 500);
        }
    }
    
    // Agregar un lote a favoritos del usuario autenticado
    public function addLoteFavoritoAuth(Request $request)
    {
        try {
            $usuario = $request->user();
            
            if (!$usuario) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            $request->validate([
                'lote_id' => 'required|integer|exists:lotes,id'
            ]);
            
            $resultado = $this->usuarioRegistradoService->agregarLoteFavorito($usuario->id, $request->lote_id);
            
            if (isset($resultado['error'])) {
                return response()->json(['error' => $resultado['error']], 422);
            }
            
            return response()->json(['mensaje' => 'Lote agregado a favoritos exitosamente']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Error de validación',
                'mensajes' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al agregar lote a favoritos: ' . $e->getMessage()], 500);
        }
    }
    
    // Quitar un lote de favoritos del usuario autenticado
    public function removeLoteFavoritoAuth(Request $request, $loteId)
    {
        try {
            $usuario = $request->user();
            
            if (!$usuario) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            $resultado = $this->usuarioRegistradoService->quitarLoteFavorito($usuario->id, $loteId);
            
            if (isset($resultado['error'])) {
                return response()->json(['error' => $resultado['error']], 422);
            }
            
            return response()->json(['mensaje' => 'Lote eliminado de favoritos exitosamente']);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al quitar lote de favoritos: ' . $e->getMessage()], 500);
        }
    }
    
    public function update(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'nombre' => 'sometimes|string|max:255',
                'apellido' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|max:255',
                'telefono' => 'sometimes|string|max:20',
                'password' => 'sometimes|string|min:8',
                'metodos_pago' => 'sometimes|array'
            ]);

            $resultado = $this->usuarioRegistradoService->actualizarUsuarioRegistrado($id, $data);

            if (!$resultado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al actualizar usuario'
                ], 500);
            }

            $usuarioActualizado = UsuarioRegistrado::with('usuario')->find($id);

            return response()->json([
                'success' => true,
                'data' => $usuarioActualizado,
                'message' => 'Usuario actualizado correctamente'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors(),
                'message' => 'Error de validación'
            ], 422);
            
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
            
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar usuario: ' . $e->getMessage()
            ], 500);
        }
    }
}