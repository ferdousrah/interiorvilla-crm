<?php
namespace App\Http\Controllers;
use App\Models\Vendor;
use App\Services\CodeGeneratorService;
use Illuminate\Http\Request;
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
    public function create() { $this->authorize('create',Vendor::class); return Inertia::render('Procurement/Vendors/Create'); }
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
    public function edit(Vendor $vendor) { $this->authorize('update',$vendor); return Inertia::render('Procurement/Vendors/Edit',['vendor'=>$vendor]); }
    public function update(Request $request, Vendor $vendor) {
        $this->authorize('update',$vendor);
        $v=$request->validate(['name'=>'required|string|max:150','type'=>'required|in:supplier,subcontractor,both','category'=>'nullable|string|max:100','contact_person'=>'nullable|string|max:150','phone'=>'required|string|max:20','email'=>'nullable|email','address'=>'nullable|string','bank_name'=>'nullable|string|max:150','bank_account'=>'nullable|string|max:50','bank_routing'=>'nullable|string|max:20','is_active'=>'boolean','opening_balance'=>'nullable|numeric','notes'=>'nullable|string']);
        $vendor->update($v);
        return redirect()->route('procurement.vendors.show',$vendor)->with('success','Vendor updated.');
    }
    public function destroy(Vendor $vendor) { $this->authorize('delete',$vendor); $vendor->delete(); return redirect()->route('procurement.vendors.index')->with('success','Vendor deleted.'); }
}
