from rest_framework import generics, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.utils import timezone
from ..models import Car, Booking
from ..serializers import CarListSerializer, CarDetailSerializer, CarWriteSerializer
from ..permissions import IsPartner


class CarListView(generics.ListAPIView):
    serializer_class = CarListSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'brand', 'model', 'location']
    ordering_fields = ['price_per_day', 'created_at', 'year']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Car.objects.filter(status='active', is_available=True).select_related('partner')
        location     = self.request.query_params.get('location')
        max_price    = self.request.query_params.get('max_price')
        min_price    = self.request.query_params.get('min_price')
        transmission = self.request.query_params.get('transmission')
        fuel_type    = self.request.query_params.get('fuel_type')
        seats        = self.request.query_params.get('seats')
        partner_id   = self.request.query_params.get('partner_id')
        min_year     = self.request.query_params.get('min_year')
        max_year     = self.request.query_params.get('max_year')
        brand        = self.request.query_params.get('brand')

        if location:     qs = qs.filter(location__icontains=location)
        if max_price:    qs = qs.filter(price_per_day__lte=max_price)
        if min_price:    qs = qs.filter(price_per_day__gte=min_price)
        if transmission: qs = qs.filter(transmission=transmission)
        if fuel_type:    qs = qs.filter(fuel_type=fuel_type)
        if seats:        qs = qs.filter(seats__gte=seats)
        if partner_id:   qs = qs.filter(partner_id=partner_id)
        if min_year:     qs = qs.filter(year__gte=min_year)
        if max_year:     qs = qs.filter(year__lte=max_year)
        if brand:        qs = qs.filter(brand__icontains=brand)
        return qs


class CarDetailView(generics.RetrieveAPIView):
    queryset = Car.objects.all().select_related('partner').prefetch_related('images')
    serializer_class = CarDetailSerializer
    permission_classes = [AllowAny]


class CarBookedDatesView(APIView):
    """
    Returns upcoming/active booked date ranges for a car.
    Used by the frontend to display availability on the calendar.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            car = Car.objects.get(pk=pk)
        except Car.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        today = timezone.now().date()
        bookings = Booking.objects.filter(
            car=car,
            booking_status__in=['pending_review', 'approved', 'active'],
            end_date__gte=today,
        ).values('start_date', 'end_date', 'booking_status')

        ranges = [
            {
                'start': str(b['start_date']),
                'end':   str(b['end_date']),
                'status': (
                    'confirmed' if b['booking_status'] in ['approved', 'active']
                    else 'pending'
                ),
            }
            for b in bookings
        ]
        return Response({'booked_ranges': ranges})


class PartnerCarListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsPartner]

    def get_serializer_class(self):
        return CarWriteSerializer if self.request.method == 'POST' else CarListSerializer

    def get_queryset(self):
        return Car.objects.filter(
            partner=self.request.user.partner
        ).prefetch_related('images')


class PartnerCarDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsPartner]

    def get_serializer_class(self):
        return CarWriteSerializer if self.request.method in ['PUT', 'PATCH'] else CarDetailSerializer

    def get_queryset(self):
        return Car.objects.filter(partner=self.request.user.partner)


class ToggleCarAvailabilityView(APIView):
    permission_classes = [IsPartner]

    def patch(self, request, pk):
        try:
            car = Car.objects.get(pk=pk, partner=request.user.partner)
        except Car.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        car.is_available = not car.is_available
        car.save()
        return Response({'is_available': car.is_available})