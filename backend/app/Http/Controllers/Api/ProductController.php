<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(): JsonResponse { return response()->json(Product::query()->latest()->paginate(20)); }
    public function store(Request $request): JsonResponse { return response()->json(Product::create($request->validate(['name' => 'required|string|max:160', 'description' => 'nullable|string', 'price' => 'required|numeric|min:0', 'status' => 'required|string'])), 201); }
    public function show(Product $product): JsonResponse { return response()->json($product); }
    public function update(Request $request, Product $product): JsonResponse { $product->update($request->validate(['name' => 'sometimes|required|string|max:160', 'description' => 'nullable|string', 'price' => 'sometimes|required|numeric|min:0', 'status' => 'sometimes|required|string'])); return response()->json($product->fresh()); }
    public function destroy(Product $product): JsonResponse { $product->delete(); return response()->json(null, 204); }
}
