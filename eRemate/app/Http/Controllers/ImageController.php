<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ImageController extends Controller
{
    /**
     * Subir una imagen
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // Max 5MB
            'folder' => 'nullable|string|max:50', // Carpeta opcional
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $image = $request->file('image');
            $folder = $request->input('folder', 'general'); // Carpeta por defecto: general
            
            // Generar nombre único para la imagen
            $filename = time() . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
            
            // Guardar la imagen en storage/app/public/images/{folder}
            $path = $image->storeAs("images/{$folder}", $filename, 'public');
            
            // URL completa de la imagen
            $imageUrl = url("api/images/serve/{$folder}/{$filename}");
            
            return response()->json([
                'success' => true,
                'message' => 'Imagen subida exitosamente',
                'data' => [
                    'filename' => $filename,
                    'folder' => $folder,
                    'path' => $path,
                    'url' => $imageUrl,
                    'size' => $image->getSize(),
                    'original_name' => $image->getClientOriginalName()
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al subir la imagen',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Servir una imagen
     *
     * @param string $folder
     * @param string $filename
     * @return Response
     */
    public function serve($folder, $filename)
    {
        try {
            $path = "images/{$folder}/{$filename}";
            
            // Verificar si el archivo existe
            if (!Storage::disk('public')->exists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Imagen no encontrada'
                ], 404);
            }
            
            // Obtener el archivo
            $file = Storage::disk('public')->get($path);
            $mimeType = Storage::disk('public')->mimeType($path);
              // Configurar headers para el cache
            $headers = [
                'Content-Type' => $mimeType,
                'Cache-Control' => 'public, max-age=31536000', // Cache por 1 año
                'Expires' => gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT',
            ];
            
            return new Response($file, 200, $headers);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la imagen',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar imágenes de una carpeta
     *
     * @param Request $request
     * @param string $folder
     * @return \Illuminate\Http\JsonResponse
     */
    public function list(Request $request, $folder = 'general')
    {
        try {
            $folderPath = "images/{$folder}";
            
            // Verificar si la carpeta existe
            if (!Storage::disk('public')->exists($folderPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Carpeta no encontrada'
                ], 404);
            }
            
            // Obtener todos los archivos de la carpeta
            $files = Storage::disk('public')->files($folderPath);
            
            $images = [];
            foreach ($files as $file) {
                $filename = basename($file);
                $images[] = [
                    'filename' => $filename,
                    'folder' => $folder,
                    'path' => $file,
                    'url' => url("api/images/serve/{$folder}/{$filename}"),
                    'size' => Storage::disk('public')->size($file),
                    'last_modified' => Storage::disk('public')->lastModified($file)
                ];
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Imágenes obtenidas exitosamente',
                'data' => $images,
                'total' => count($images)
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al listar las imágenes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar una imagen
     *
     * @param string $folder
     * @param string $filename
     * @return \Illuminate\Http\JsonResponse
     */
    public function delete($folder, $filename)
    {
        try {
            $path = "images/{$folder}/{$filename}";
            
            // Verificar si el archivo existe
            if (!Storage::disk('public')->exists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Imagen no encontrada'
                ], 404);
            }
            
            // Eliminar el archivo
            Storage::disk('public')->delete($path);
            
            return response()->json([
                'success' => true,
                'message' => 'Imagen eliminada exitosamente'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la imagen',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
