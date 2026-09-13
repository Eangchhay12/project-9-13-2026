<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalaryPayment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalaryPaymentController extends Controller
{
    public function due(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $date = CarbonImmutable::parse($request->query('date', now()->toDateString()))->toDateString();
        return response()->json(SalaryPayment::with('employee:id,name,email,gender,role,salary,qr_photo')
            ->whereDate('period_end', $date)->where('payment_status', '!=', 'Paid')->get());
    }

    public function store(Request $request, User $user): JsonResponse
    {
        $this->ensureAdmin($request);
        $periodEnd = CarbonImmutable::parse($user->pay_date ?: now()->toDateString());
        abort_unless($periodEnd->isToday(), 422, 'Payment is only available on the employee pay date.');
        $periodStart = $periodEnd->subDays(30);
        $workingDays = min(30, max(0, $periodStart->diffInDays(CarbonImmutable::today())));
        $dailyRate = ((float) $user->salary) / 30;
        $payment = SalaryPayment::firstOrCreate(
            ['user_id' => $user->id, 'period_start' => $periodStart->toDateString(), 'period_end' => $periodEnd->toDateString()],
            ['working_days' => $workingDays, 'absent_days' => null, 'daily_rate' => $dailyRate, 'earned_amount' => $dailyRate * $workingDays, 'payment_status' => 'Due']
        );
        return response()->json($payment->load('employee:id,name,email,gender,role,salary,qr_photo'), 201);
    }

    public function confirm(Request $request, SalaryPayment $payment): JsonResponse
    {
        $this->ensureAdmin($request);
        abort_unless($payment->payment_status !== 'Paid', 422, 'This payment is already completed.');
        $result = DB::transaction(function () use ($payment) {
            $payment->update(['payment_status' => 'Paid', 'paid_at' => now()]);
            $employee = $payment->employee;
            $nextStart = CarbonImmutable::parse($payment->period_end);
            $employee->update(['pay_date' => $nextStart->addDays(30)->toDateString(), 'payment_status' => 'Pending']);
            return $payment->fresh()->load('employee:id,name,email,gender,role,salary,qr_photo');
        });
        return response()->json($result);
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === 'Administrator', 403, 'Administrator access required.');
    }
}
