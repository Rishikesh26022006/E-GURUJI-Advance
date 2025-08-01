import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, Edit, Phone, Mail, Star, Gift, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useLoyaltyProgram } from "@/hooks/useLoyaltyProgram";
import EditCustomerProfileModal from "@/components/EditCustomerProfileModal";
import CustomerDashboardHeader from "@/components/CustomerDashboardHeader";
import PaymentModal from "@/components/PaymentModal";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";

interface Booking {
  id: string;
  service_id: number;
  fromdate: string;
  todate: string;
  status: string;
  location: string;
  address: string;
  phone: string;
  created_at: string;
  tentative_date: string;
  preferred_time: string;
  service_name: string;
  total_amount: number;
  payment_status: string;
  services: {
    name: string;
    price: number;
  };
}

export default function DashboardCustomer() {
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { loyaltyProgram } = useLoyaltyProgram();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data: bookingsData, error } = await supabase
        .from("bookings")
        .select(`
          *,
          services (
            name,
            price
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("Fetched bookings:", bookingsData);
      
      // Transform the data to match the Booking interface
      const transformedBookings: Booking[] = (bookingsData || []).map((booking: any) => ({
        ...booking,
        tentative_date: booking.fromdate, // Use fromdate as tentative_date
        service_name: booking.services?.name || 'Unknown Service', // Use service name or fallback
      }));
      
      setBookings(transformedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (updatedProfile: any) => {
    if (updateProfile) {
      const result = await updateProfile(updatedProfile);
      if (!result.error) {
        console.log("Profile updated successfully");
      }
    }
    setEditModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate("/", { replace: true });
    }
  };

  const handlePayNow = (booking: Booking) => {
    setSelectedBooking(booking);
    setPaymentModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
      case "booked":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatPrice = (price: number) => {
    return `₹${(price / 100).toLocaleString()}`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "platinum":
        return "bg-purple-100 text-purple-800";
      case "gold":
        return "bg-yellow-100 text-yellow-800";
      case "silver":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-orange-100 text-orange-800";
    }
  };

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-orange-800">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <CustomerDashboardHeader
            title="Customer Dashboard"
            subtitle="Welcome back! Manage your bookings and profile here."
            profile={profile}
            onEditProfile={() => setEditModalOpen(true)}
            onLogout={handleLogout}
          />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Section */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
                <CardHeader className="text-center pb-4">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profile?.profile_image_url || undefined} />
                      <AvatarFallback className="text-2xl font-bold bg-orange-100 text-orange-800">
                        {profile?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl text-orange-800">{profile?.name || 'User'}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1 text-orange-600">
                        <Mail className="w-4 h-4" />
                        {profile?.email}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile?.phone && (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <Phone className="w-4 h-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  
                  {profile?.address && (
                    <div className="flex items-start gap-2 text-sm text-orange-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{profile.address}</span>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-orange-200">
                    <Button 
                      onClick={() => setEditModalOpen(true)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Loyalty Program Card */}
              {loyaltyProgram && (
                <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      Loyalty Program
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-600">Current Tier</span>
                      <Badge className={getTierColor(loyaltyProgram.tier_level)}>
                        {loyaltyProgram.tier_level.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-600">Points Balance</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-orange-500" />
                        <span className="font-bold text-orange-800">{loyaltyProgram.points_balance}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-600">Total Earned</span>
                      <span className="font-medium text-orange-800">{loyaltyProgram.total_points_earned}</span>
                    </div>
                    
                    <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                      <Link to="/loyalty">
                        <Gift className="w-4 h-4 mr-2" />
                        View Rewards
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Bookings Section */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
                <CardHeader>
                  <CardTitle className="text-2xl text-orange-800">Your Bookings</CardTitle>
                  <CardDescription className="text-orange-600">
                    Track your pooja service bookings and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📅</div>
                      <h3 className="text-xl font-semibold text-orange-800 mb-2">No Bookings Yet</h3>
                      <p className="text-orange-600 mb-6">Start by booking your first pooja service</p>
                      <Button 
                        onClick={() => window.location.href = '/services'}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Browse Services
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <Card key={booking.id} className="border border-orange-200 hover:shadow-md transition-shadow bg-white/60">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-lg text-orange-800">
                                  {booking.service_name || booking.services?.name}
                                </h4>
                                <div className="flex items-center gap-4 mt-2 text-sm text-orange-600">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{booking.tentative_date ? new Date(booking.tentative_date).toLocaleDateString() : new Date(booking.fromdate).toLocaleDateString()}</span>
                                  </div>
                                  {booking.preferred_time && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      <span>{booking.preferred_time}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge className={getStatusColor(booking.status)}>
                                  {booking.status?.toUpperCase()}
                                </Badge>
                                <Badge className={getPaymentStatusColor(booking.payment_status)}>
                                  {booking.payment_status?.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm text-orange-600">
                              {booking.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{booking.location}</span>
                                </div>
                              )}
                              {booking.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  <span>{booking.phone}</span>
                                </div>
                              )}
                              {booking.services?.price && (
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-orange-800">Price: {formatPrice(booking.services.price)}</span>
                                </div>
                              )}
                            </div>

                            {/* Pay Now Button for Booked Status */}
                            {(booking.status === 'booked' || booking.status === 'confirmed') && booking.payment_status === 'pending' && (
                              <div className="mt-4 pt-4 border-t border-orange-200">
                                <Button
                                  onClick={() => handlePayNow(booking)}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Pay Now - {formatPrice(booking.services?.price || booking.total_amount || 0)}
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditCustomerProfileModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        profile={profile}
        onProfileUpdated={handleProfileUpdate}
      />

      {/* Payment Modal */}
      {selectedBooking && (
        <PaymentModal
          open={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedBooking(null);
            fetchBookings(); // Refresh bookings after payment
          }}
          booking={selectedBooking}
        />
      )}
    </div>
  );
}
