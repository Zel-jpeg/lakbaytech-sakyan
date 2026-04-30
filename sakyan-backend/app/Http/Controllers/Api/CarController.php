<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\SupabaseAuth;
use App\Models\Car;
use App\Models\CarImage;
use App\Models\Partner;
use Illuminate\Http\Request;

class CarController extends Controller
{
    /**
     * GET /api/cars
     * Public — list active available cars with optional filters.
     */
    public function index(Request $request)
    {
        $query = Car::with(['primaryImage', 'partner:id,business_name'])
            ->where('status', 'active')
            ->where('is_available', true);

        if ($request->location) {
            $query->where('location', 'ilike', '%' . $request->location . '%');
        }
        if ($request->max_price) {
            $query->where('price_per_day', '<=', $request->max_price);
        }
        if ($request->min_price) {
            $query->where('price_per_day', '>=', $request->min_price);
        }
        if ($request->transmission) {
            $query->where('transmission', $request->transmission);
        }
        if ($request->fuel_type) {
            $query->where('fuel_type', $request->fuel_type);
        }
        if ($request->seats) {
            $query->where('seats', '>=', $request->seats);
        }

        $cars = $query->orderBy('created_at', 'desc')->paginate(12);

        return response()->json(['message' => 'Success', 'data' => $cars]);
    }

    /**
     * GET /api/cars/{id}
     * Public — single car detail with all images.
     */
    public function show(string $id)
    {
        $car = Car::with(['images', 'partner:id,business_name,contact_phone,business_address'])
            ->findOrFail($id);

        return response()->json(['message' => 'Success', 'data' => $car]);
    }

    /**
     * POST /api/cars
     * Partner — add a new car.
     */
    public function store(Request $request)
    {
        $user    = SupabaseAuth::user($request);
        $partner = Partner::where('user_id', $user->id)
            ->where('status', 'approved')
            ->firstOrFail();

        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'brand'         => 'required|string|max:100',
            'model'         => 'required|string|max:100',
            'year'          => 'required|integer|min:2000|max:2030',
            'plate_number'  => 'required|string|max:20|unique:cars',
            'transmission'  => 'required|in:manual,automatic',
            'fuel_type'     => 'required|in:gasoline,diesel,electric,hybrid',
            'seats'         => 'required|integer|min:2|max:15',
            'color'         => 'nullable|string|max:50',
            'price_per_day' => 'required|numeric|min:1',
            'location'      => 'required|string|max:255',
            'description'   => 'nullable|string',
            'features'      => 'nullable|array',
            'images'        => 'nullable|array',        // array of image URLs (from Supabase Storage)
            'images.*'      => 'url',
        ]);

        $car = Car::create([
            ...$data,
            'partner_id'  => $partner->id,
            'status'      => 'active',
            'is_available'=> true,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // Save images
        if (!empty($data['images'])) {
            foreach ($data['images'] as $index => $url) {
                CarImage::create([
                    'car_id'     => $car->id,
                    'image_url'  => $url,
                    'is_primary' => $index === 0,
                    'created_at' => now(),
                ]);
            }
        }

        return response()->json([
            'message' => 'Car listed successfully',
            'data'    => $car->load('images'),
        ], 201);
    }

    /**
     * PUT /api/cars/{id}
     * Partner — update own car.
     */
    public function update(Request $request, string $id)
    {
        $user = SupabaseAuth::user($request);
        $car  = $this->getOwnCar($user, $id);

        $data = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'brand'         => 'sometimes|string',
            'model'         => 'sometimes|string',
            'year'          => 'sometimes|integer',
            'transmission'  => 'sometimes|in:manual,automatic',
            'fuel_type'     => 'sometimes|in:gasoline,diesel,electric,hybrid',
            'seats'         => 'sometimes|integer',
            'color'         => 'sometimes|string',
            'price_per_day' => 'sometimes|numeric|min:1',
            'location'      => 'sometimes|string',
            'description'   => 'sometimes|string',
            'features'      => 'sometimes|array',
        ]);

        $data['updated_at'] = now();
        $car->update($data);

        return response()->json(['message' => 'Car updated', 'data' => $car->fresh('images')]);
    }

    /**
     * PATCH /api/cars/{id}/toggle
     * Partner — toggle availability.
     */
    public function toggle(Request $request, string $id)
    {
        $user = SupabaseAuth::user($request);
        $car  = $this->getOwnCar($user, $id);

        $car->update([
            'is_available' => !$car->is_available,
            'updated_at'   => now(),
        ]);

        return response()->json([
            'message'      => 'Availability toggled',
            'is_available' => $car->is_available,
        ]);
    }

    /**
     * DELETE /api/cars/{id}
     * Partner — delete own car.
     */
    public function destroy(Request $request, string $id)
    {
        $user = SupabaseAuth::user($request);
        $car  = $this->getOwnCar($user, $id);
        $car->delete();

        return response()->json(['message' => 'Car deleted successfully']);
    }

    /**
     * GET /api/partner/cars
     * Partner — list own cars.
     */
    public function myCars(Request $request)
    {
        $user    = SupabaseAuth::user($request);
        $partner = Partner::where('user_id', $user->id)->firstOrFail();

        $cars = Car::with('primaryImage')
            ->where('partner_id', $partner->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['message' => 'Success', 'data' => $cars]);
    }

    /** Helper: find a car belonging to the current partner */
    private function getOwnCar($user, string $carId): Car
    {
        $partner = Partner::where('user_id', $user->id)->firstOrFail();
        $car     = Car::where('id', $carId)->where('partner_id', $partner->id)->firstOrFail();
        return $car;
    }
}
