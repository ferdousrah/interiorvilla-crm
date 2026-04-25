<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Services\CodeGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function __construct(private CodeGeneratorService $codeGenerator) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Client::class);

        $clients = Client::with(['projects' => fn($q) => $q->whereNotIn('status', ['completed', 'cancelled'])])
            ->when($request->search, fn($q, $s) =>
                $q->where(fn($q) =>
                    $q->where('name', 'like', "%$s%")
                        ->orWhere('phone', 'like', "%$s%")
                        ->orWhere('email', 'like', "%$s%")
                        ->orWhere('company_name', 'like', "%$s%")
                )
            )
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->when($request->area, fn($q, $a) => $q->where('area', $a))
            ->when($request->filled('is_active'), fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'filters' => $request->only(['search', 'type', 'area', 'is_active']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Client::class);
        return Inertia::render('Clients/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Client::class);

        $validated = $request->validate([
            'type' => 'nullable|in:individual,corporate',
            'name' => 'required|string|max:150',
            'company_name' => 'nullable|string|max:150',
            'email' => 'nullable|email|max:150',
            'phone' => 'required|string|max:20',
            'secondary_phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'area' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'notes' => 'nullable|string',
            'contacts' => 'nullable|array',
            'contacts.*.name' => 'required|string|max:150',
            'contacts.*.designation' => 'nullable|string|max:100',
            'contacts.*.email' => 'nullable|email|max:150',
            'contacts.*.phone' => 'required|string|max:20',
            'contacts.*.is_primary' => 'boolean',
        ]);

        $client = DB::transaction(function () use ($validated) {
            $code = $this->codeGenerator->generate('CL', 'clients');
            $client = Client::create(array_merge($validated, [
                'code' => $code,
                'type' => $validated['type'] ?? 'individual',
                'created_by' => auth()->id(),
            ]));

            if (!empty($validated['contacts'])) {
                foreach ($validated['contacts'] as $contact) {
                    $client->contacts()->create($contact);
                }
            }

            return $client;
        });

        return redirect()->route('clients.show', $client)->with('success', 'Client created successfully.');
    }

    public function show(Client $client): Response
    {
        $this->authorize('view', $client);

        $client->load([
            'contacts',
            'projects.siteEngineer',
            'invoices',
            'receipts',
            'leads.activities',
        ]);

        return Inertia::render('Clients/Show', [
            'client' => $client,
        ]);
    }

    public function edit(Client $client): Response
    {
        $this->authorize('update', $client);
        $client->load('contacts');
        return Inertia::render('Clients/Edit', ['client' => $client]);
    }

    public function update(Request $request, Client $client): RedirectResponse
    {
        $this->authorize('update', $client);

        $validated = $request->validate([
            'type' => 'nullable|in:individual,corporate',
            'name' => 'required|string|max:150',
            'company_name' => 'nullable|string|max:150',
            'email' => 'nullable|email|max:150',
            'phone' => 'required|string|max:20',
            'secondary_phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'area' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
            'contacts' => 'nullable|array',
            'contacts.*.id' => 'nullable|uuid',
            'contacts.*.name' => 'required|string|max:150',
            'contacts.*.designation' => 'nullable|string|max:100',
            'contacts.*.email' => 'nullable|email|max:150',
            'contacts.*.phone' => 'required|string|max:20',
            'contacts.*.is_primary' => 'boolean',
        ]);

        DB::transaction(function () use ($validated, $client) {
            $client->update($validated);

            if (isset($validated['contacts'])) {
                $existingIds = collect($validated['contacts'])->pluck('id')->filter()->values();
                $client->contacts()->whereNotIn('id', $existingIds)->delete();

                foreach ($validated['contacts'] as $contactData) {
                    if (!empty($contactData['id'])) {
                        $client->contacts()->where('id', $contactData['id'])->update($contactData);
                    } else {
                        $client->contacts()->create($contactData);
                    }
                }
            }
        });

        return redirect()->route('clients.show', $client)->with('success', 'Client updated successfully.');
    }

    public function destroy(Client $client): RedirectResponse
    {
        $this->authorize('delete', $client);
        $client->delete();
        return redirect()->route('clients.index')->with('success', 'Client deleted.');
    }
}
