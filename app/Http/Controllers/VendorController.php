<?php
namespace App\Http\Controllers;
use App\Models\Vendor;
use App\Models\VendorCategory;
use App\Services\CodeGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
class VendorController extends Controller {
    public function __construct(private CodeGeneratorService $codeGenerator) {}
    public function index(Request $request) {
        $this->authorize('viewAny', Vendor::class);
        $vendors = Vendor::when($request->search, fn($q,$s)=>$q->where('name','like',"%$s%"))
            ->when($request->type, fn($q,$t)=>$q->where('type',$t))
            ->paginate(25)->withQueryString();
        return Inertia::render('Procurement/Vendors/Index', ['vendors'=>$vendors,'filters'=>$request->only(['search','type'])]);
    }
    public function create() { $this->authorize('create',Vendor::class); return Inertia::render('Procurement/Vendors/Create',['categories'=>$this->categoryList()]); }
    public function store(Request $request) {
        $this->authorize('create',Vendor::class);
        $v=$request->validate(['name'=>'required|string|max:150','type'=>'required|in:supplier,subcontractor,both','category'=>'nullable|string|max:100','contact_person'=>'nullable|string|max:150','phone'=>'required|string|max:20','email'=>'nullable|email','address'=>'nullable|string','bank_name'=>'nullable|string|max:150','bank_account'=>'nullable|string|max:50','bank_routing'=>'nullable|string|max:20','opening_balance'=>'nullable|numeric','notes'=>'nullable|string']);
        $code=$this->codeGenerator->generate('VN','vendors');
        $vendor=Vendor::create(array_merge($v,['code'=>$code,'created_by'=>auth()->id()]));
        return redirect()->route('procurement.vendors.show',$vendor)->with('success','Vendor created.');
    }
    public function show(Vendor $vendor) {
        $this->authorize('view',$vendor);
        $vendor->load(['purchaseOrders','payments']);
        return Inertia::render('Procurement/Vendors/Show',['vendor'=>$vendor]);
    }
    public function edit(Vendor $vendor) { $this->authorize('update',$vendor); return Inertia::render('Procurement/Vendors/Edit',['vendor'=>$vendor,'categories'=>$this->categoryList()]); }
    public function update(Request $request, Vendor $vendor) {
        $this->authorize('update',$vendor);
        $v=$request->validate(['name'=>'required|string|max:150','type'=>'required|in:supplier,subcontractor,both','category'=>'nullable|string|max:100','contact_person'=>'nullable|string|max:150','phone'=>'required|string|max:20','email'=>'nullable|email','address'=>'nullable|string','bank_name'=>'nullable|string|max:150','bank_account'=>'nullable|string|max:50','bank_routing'=>'nullable|string|max:20','is_active'=>'boolean','opening_balance'=>'nullable|numeric','notes'=>'nullable|string']);
        $vendor->update($v);
        return redirect()->route('procurement.vendors.show',$vendor)->with('success','Vendor updated.');
    }
    public function destroy(Vendor $vendor) { $this->authorize('delete',$vendor); $vendor->delete(); return redirect()->route('procurement.vendors.index')->with('success','Vendor deleted.'); }

    private function categoryList() {
        return VendorCategory::orderBy('sort_order')->orderBy('name')->get(['id','name']);
    }

    /** Quick-add a vendor category (from the vendor form's manage modal) */
    public function storeCategory(Request $request): JsonResponse {
        $this->authorize('create', Vendor::class);
        $v = $request->validate(['name'=>'required|string|max:100|unique:vendor_categories,name']);
        $cat = VendorCategory::create([
            'name'       => trim($v['name']),
            'sort_order' => (int) (VendorCategory::max('sort_order') ?? 0) + 1,
        ]);
        return response()->json($cat);
    }

    /** Rename a category. Cascades to vendors.category so existing rows stay in sync. */
    public function updateCategory(Request $request, VendorCategory $vendorCategory): JsonResponse {
        $this->authorize('create', Vendor::class);
        $v = $request->validate(['name'=>'required|string|max:100|unique:vendor_categories,name,'.$vendorCategory->id]);
        $newName = trim($v['name']);
        DB::transaction(function () use ($vendorCategory, $newName) {
            if ($newName !== $vendorCategory->name) {
                Vendor::where('category', $vendorCategory->name)->update(['category' => $newName]);
            }
            $vendorCategory->update(['name' => $newName]);
        });
        return response()->json($vendorCategory->fresh());
    }

    public function destroyCategory(VendorCategory $vendorCategory): JsonResponse {
        $this->authorize('create', Vendor::class);
        $inUse = Vendor::where('category', $vendorCategory->name)->count();
        if ($inUse > 0) {
            return response()->json([
                'message' => "Cannot delete: {$inUse} vendor(s) still use \"{$vendorCategory->name}\". Reassign them first.",
            ], 422);
        }
        $vendorCategory->delete();
        return response()->json(['ok' => true]);
    }
}
