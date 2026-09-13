<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function index(): JsonResponse { return response()->json(User::query()->latest()->paginate(20)); }
    public function store(Request $request): JsonResponse { $data = $request->validate(['name' => 'required|string|max:120', 'email' => 'required|email|unique:users', 'password' => 'required|string|min:8', 'gender' => 'required|string|max:20', 'role' => 'required|string|max:40', 'salary' => 'required|numeric|min:0', 'photo' => 'nullable|string', 'joined_at' => 'required|date', 'pay_date' => 'required|date', 'payment_status' => 'nullable|in:Pending,Paid']); return response()->json(User::create($data), 201); }
    public function show(User $user): JsonResponse { return response()->json($user); }
    public function updateQr(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()?->role === 'Administrator', 403, 'Administrator access required.');
        $request->validate(['qr_photo' => 'required|image|mimes:png,jpg,jpeg,webp|max:2048']);
        if ($user->qr_photo && ! str_starts_with($user->qr_photo, 'data:')) Storage::disk('public')->delete($user->qr_photo);
        $path = $request->file('qr_photo')->store('qr-codes', 'public');
        $user->update(['qr_photo' => $path]);
        return response()->json(['qr_photo' => Storage::disk('public')->url($path), 'user' => $user->fresh()]);
    }
    public function update(Request $request, User $user): JsonResponse { $data = $request->validate(['name' => 'sometimes|required|string|max:120', 'email' => 'sometimes|required|email|unique:users,email,'.$user->id, 'gender' => 'sometimes|required|string|max:20', 'role' => 'sometimes|required|string|max:40', 'salary' => 'sometimes|required|numeric|min:0', 'photo' => 'nullable|string', 'joined_at' => 'sometimes|required|date', 'pay_date' => 'sometimes|required|date', 'payment_status' => 'sometimes|required|in:Pending,Paid', 'status' => 'sometimes|required|string|max:30']); $user->update($data); return response()->json($user->fresh()); }
    public function destroy(User $user): JsonResponse { $user->delete(); return response()->json(null, 204); }
}
