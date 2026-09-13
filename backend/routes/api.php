<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SalaryPaymentController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::apiResource('users', UserController::class);
    Route::post('/users/{user}/qr-photo', [UserController::class, 'updateQr']);
    Route::get('/salary/payments/due', [SalaryPaymentController::class, 'due']);
    Route::post('/users/{user}/salary-payments', [SalaryPaymentController::class, 'store']);
    Route::post('/salary-payments/{payment}/confirm', [SalaryPaymentController::class, 'confirm']);
    Route::apiResource('products', ProductController::class);
});
