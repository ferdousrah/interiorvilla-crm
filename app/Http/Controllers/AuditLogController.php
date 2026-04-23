<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = AuditLog::orderByDesc('created_at');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('model_label', 'like', "%{$search}%")
                  ->orWhere('user_name', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%");
            });
        }
        if ($action = $request->get('action')) {
            $query->where('action', $action);
        }
        if ($model = $request->get('model')) {
            $query->where('model_type', 'like', "%{$model}%");
        }
        if ($userId = $request->get('user_id')) {
            $query->where('user_id', $userId);
        }

        $logs = $query->paginate(50)->withQueryString();

        return Inertia::render('Settings/AuditLog', [
            'logs'    => $logs,
            'filters' => $request->only('search', 'action', 'model', 'user_id'),
        ]);
    }
}
