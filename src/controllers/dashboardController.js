const mongoose = require("mongoose");
const Emissions = require("../models/EmissionsModel");
const User = mongoose.model("User");
const Payment= require("../models/Payment");

const responseFormatter = (status, message, data) => ({
    status,
    message,
    data
});



// Get Revenue Growth 
exports.getPaymentGrowth = async (_, res) => {
    try {
        // 1. First verify we have any payments at all
        const totalPayments = await Payment.countDocuments();
        console.log("[Debug] Total payments in DB:", totalPayments);

        if (totalPayments === 0) {
            return res.json({
                status: true,
                message: "No payment data available",
                data: {
                    periods: {
                        twelveMonths: 0,
                        sixMonths: 0,
                        thirtyDays: 0,
                        sevenDays: 0
                    },
                    chartData: generateEmptyChartData()
                }
            });
        }

        // 2. Get actual date range from payments and ensure they're Date objects
        const dateRange = await Payment.aggregate([
            {
                $group: {
                    _id: null,
                    minDate: { $min: "$createdAt" },
                    maxDate: { $max: "$createdAt" }
                }
            }
        ]);
        
        // Convert string dates to Date objects if needed
        const newestDate = dateRange[0]?.maxDate 
            ? new Date(dateRange[0].maxDate)
            : new Date();
        const oldestDate = dateRange[0]?.minDate 
            ? new Date(dateRange[0].minDate)
            : new Date();
        
        console.log("[Debug] Payment date range:", {
            minDate: oldestDate,
            maxDate: newestDate
        });

        // 3. Calculate date ranges using proper Date objects
        const twelveMonthsAgo = new Date(newestDate);
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        
        const sixMonthsAgo = new Date(newestDate);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const thirtyDaysAgo = new Date(newestDate);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const sevenDaysAgo = new Date(newestDate);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        console.log("[Debug] Adjusted date ranges:", {
            newestDate,
            oldestDate,
            twelveMonthsAgo,
            sixMonthsAgo,
            thirtyDaysAgo,
            sevenDaysAgo
        });

        // 4. Run aggregations with proper date handling
        const aggregationPipeline = (startDate) => [
            { 
                $match: { 
                    createdAt: { 
                        $gte: startDate,
                        $lte: newestDate
                    } 
                } 
            },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ];

        const [twelveMonthsAmount, sixMonthsAmount, thirtyDaysAmount, sevenDaysAmount] = await Promise.all([
            Payment.aggregate(aggregationPipeline(twelveMonthsAgo)),
            Payment.aggregate(aggregationPipeline(sixMonthsAgo)),
            Payment.aggregate(aggregationPipeline(thirtyDaysAgo)),
            Payment.aggregate(aggregationPipeline(sevenDaysAgo))
        ]);

        console.log("[Debug] Aggregation results:", {
            twelveMonthsAmount,
            sixMonthsAmount,
            thirtyDaysAmount,
            sevenDaysAmount
        });

        // 5. Get monthly breakdown with proper date handling
        const monthlyData = await Payment.aggregate([
            { 
                $match: { 
                    createdAt: { 
                        $gte: twelveMonthsAgo,
                        $lte: newestDate
                    } 
                } 
            },
            { 
                $addFields: {
                    createdAtDate: {
                        $cond: {
                            if: { $eq: [{ $type: "$createdAt" }, "string"] },
                            then: { $toDate: "$createdAt" },
                            else: "$createdAt"
                        }
                    }
                }
            },
            { 
                $group: {
                    _id: {
                        year: { $year: "$createdAtDate" },
                        month: { $month: "$createdAtDate" }
                    },
                    total: { $sum: "$amount" }
                } 
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        console.log("[Debug] Monthly aggregation data:", monthlyData);

        // 6. Generate chart data
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const chartData = [];
        
        let currentDate = new Date(twelveMonthsAgo);
        const endDate = new Date(newestDate);
        
        while (currentDate <= endDate) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const monthData = monthlyData.find(d => 
                d._id.year === year && d._id.month === month
            );
            
            chartData.push({
                month: `${months[currentDate.getMonth()]} ${year}`,
                total: monthData?.total || 0
            });
            
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        // 7. Send response
        res.json({
            status: true,
            message: "Payment growth data fetched successfully",
            data: {
                periods: {
                    twelveMonths: twelveMonthsAmount[0]?.total || 0,
                    sixMonths: sixMonthsAmount[0]?.total || 0,
                    thirtyDays: thirtyDaysAmount[0]?.total || 0,
                    sevenDays: sevenDaysAmount[0]?.total || 0
                },
                chartData: chartData.slice(-12) // Only show last 12 months
            }
        });

    } catch (error) {
        console.error("[Error] in getPaymentGrowth:", {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            status: false,
            message: "Error fetching payment data",
            error: error.message
        });
    }
};



















exports.getTotalRevenue = async (_, res) => {
    try {
        const result = await Payment.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const totalRevenue = result.length > 0 ? result[0].total : 0;

        res.json(responseFormatter(true, "Total revenue fetched successfully", { totalRevenue }));
    } catch (error) {
        res.status(500).json(responseFormatter(false, "Error fetching total revenue", error.message));
    }
};


exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find().sort({ paymentDate: -1 });
        res.status(200).json(responseFormatter(true, "Payments fetched successfully", payments));
    } catch (error) {
        res.status(500).json(responseFormatter(false, "Error fetching payments", error.message));
    }
}

exports.updatePaymentStatus = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json(responseFormatter(false, "Payment not found"));
        }
        payment.isPaid = req.body.isPaid;
        const updatedPayment = await payment.save();
        res.status(200).json(responseFormatter(true, "Payment status updated successfully", updatedPayment));
    } catch (error) {
        res.status(500).json(responseFormatter(false, "Error updating payment status", error.message));
    }
}

exports.deletePayment = async (req, res) => {
    try {
        const deletedPayment = await Payment.findByIdAndDelete(req.params.id);
        if (!deletedPayment) {
            return res.status(404).json(responseFormatter(false, "Payment not found"));
        }
        res.status(200).json(responseFormatter(true, "Payment deleted successfully"));
    } catch (error) {
        res.status(500).json(responseFormatter(false, "Error deleting payment", error.message));
    }
}


exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json(responseFormatter(false, "Payment not found"));
        }
        res.status(200).json(responseFormatter(true, "Payment fetched successfully", payment));
    } catch (error) {
        res.status(500).json(responseFormatter(false, "Error fetching payment", error.message));
    }
}

// Get Total Customers
exports.getTotalCustomers = async (_, res) => {
    try {
        const totalCustomers = await User.countDocuments({ role: "user" });

        res.json(responseFormatter(true, "Total customers fetched successfully", { totalCustomers }));
    } catch (error) {
        res.status(500).json(responseFormatter(false, "Error fetching total customers", error.message));
    }
};


exports.getPaymentsTwelveMonth = async (req, res) => {
    try {
        const result = await Payment.aggregate([
            {
              $match: {
                createdAt: {
                  $gte: new Date(new Date().getFullYear(), 0, 1),
                  $lte: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999),
                },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "email",
                foreignField: "email",
                as: "user",
              },
            },
            {
              $unwind: {
                path: "$user",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $group: {
                _id: { $month: "$createdAt" }, 
                totalPayment: { $sum: "$amount" },
                totalUser: {
                  $sum: { $cond: [{ $ne: ["$user", null] }, 1, 0] },
                },
              },
            },
            { $sort: { "_id": 1 } },
          ]);
          
  
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
      // Create default structure with 0s
      const defaultData = months.map((month, index) => ({
        month,
        user: 0,
        revenue: 0,
      }));
  
      // Merge actual data into default
      result.forEach((item) => {
        const idx = item._id - 1; // MongoDB months are 1-indexed
        if (defaultData[idx]) {
          defaultData[idx].user = item.totalUser;
          defaultData[idx].revenue = item.totalPayment;
        }
      });
  
      return res.status(200).json({
        status: true,
        message: "Payment by month fetched successfully",
        data: defaultData,
      });
    } catch (err) {
        console.log(err)
      return res.status(500).json({
        message: "Server error",
        error: err.message,
      });
    }
  };


// Get Total Active Subscriptions
exports.getTotalSubscriptions = async (_, res) => {
    try {
        const totalSubscriptions = await User.countDocuments({
            hasActiveSubscription: true,
            subscriptionExpireDate: { $gt: new Date() }
        });

        res.json(responseFormatter(true, "Total active subscriptions fetched successfully", { totalSubscriptions }));
    } catch (error) {
        res.status(500).json(responseFormatter(false, "Error fetching active subscriptions", error.message));
    }
};
// Get User Growth Route
exports.getUserGrowth = async (req, res) => {
    try {
        const result = await User.aggregate([
            {
                $match: { role: "User" }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);

        // Convert result to { name: 'Month Year', value: x } format
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formatted = result.map(item => ({
            name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
            value: item.count
        }));

        return res.status(200).json({
            status: true,
            message: "User Growth fetched successfully",
            data: formatted
        });
    }

    catch (err) {
        return res.status(500).json({ message: "Server error", error: err.message });
    }
}
exports.getRevenueGrowth = async (req, res) => {
    try {
        const { year } = req.query; // Get year from query string

        // Validate year
        if (!year || isNaN(year)) {
            return res.status(400).json({
                status: false,
                message: "Please provide a valid year in the query string (e.g., ?year=2024)",
            });
        }

        const numericYear = parseInt(year);

        // Define start and end of year
        const startOfYear = new Date(`${numericYear}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${numericYear}-12-31T23:59:59.999Z`);

        const result = await Payment.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfYear, $lte: endOfYear }
                }
            },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" } },
                    total: { $sum: "$amount" }
                }
            },
            {
                $sort: { "_id.month": 1 }
            }
        ]);

        // Format output
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formatted = result.map(item => ({
            name: `${monthNames[item._id.month - 1]} ${year}`,
            value: item.total
        }));

        return res.status(200).json({
            status: true,
            message: `Revenue Growth for ${year} fetched successfully`,
            data: formatted
        });

    } catch (err) {
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};






function generateEmptyChartData() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
        const date = new Date(now);
        date.setMonth(date.getMonth() - (11 - i));
        return {
            month: `${months[date.getMonth()]} ${date.getFullYear()}`,
            total: 0
        };
    });
}


// Helper function for empty state
function generateEmptyChartData() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
        const date = new Date(now);
        date.setMonth(date.getMonth() - (11 - i));
        return {
            month: `${months[date.getMonth()]} ${date.getFullYear()}`,
            total: 0
        };
    });
}


exports.getTotalRevenue = async (_, res) => {
    try {
        const result = await Payment.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const totalRevenue = result.length > 0 ? result[0].total : 0;

        res.json(responseFormatter(true, "Total revenue fetched successfully", { totalRevenue }));
    } catch (error) {
        res.status(500).json(responseFormatter(false, "Error fetching total revenue", error.message));
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        // Calculate Total Revenue
        const totalRevenue = await Payment.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: { $toDouble: "$amount" } },
                },
            },
        ]);

        // Calculate Total Customers
        const totalCustomers = await User.countDocuments({ role: "User" });

        // Calculate Total Subscriptions
        const totalSubscriptions = await Payment.countDocuments({});

        // Prepare the response
        const stats = {
            totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].totalAmount : 0,
            totalCustomers,
            totalSubscriptions,
        };

        res.status(200).json(responseFormatter(true, "Dashboard stats fetched successfully", stats));
    } catch (error) {
        console.error(error);
        res.status(500).json(responseFormatter(false, "Error fetching dashboard stats", error.message));
    }
};


// Get Total Revenue
exports.getTotalRevenue = async (_, res) => {
    try {
        const result = await Payment.aggregate([
            {
                $match: {
                    status: "Active"
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" },
                    entryFeeRevenue: {
                        $sum: {
                            $cond: [{ $eq: ["$subscriptionType", "Entry_fee"] }, "$amount", 0]
                        }
                    },
                    subscriptionRevenue: {
                        $sum: {
                            $cond: [{ $eq: ["$subscriptionType", "Subscription_fee"] }, "$amount", 0]
                        }
                    },
                    consultationRevenue: {
                        $sum: {
                            $cond: [{ $eq: ["$subscriptionType", "Consultation"] }, "$amount", 0]
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const responseData = result.length > 0 ? result[0] : {
            totalRevenue: 0,
            entryFeeRevenue: 0,
            subscriptionRevenue: 0,
            consultationRevenue: 0,
            count: 0
        };

        res.json({
            status: true,
            message: "Revenue data fetched successfully",
            data: {
                totalRevenue: responseData.totalRevenue,
                breakdown: {
                    entryFee: responseData.entryFeeRevenue,
                    subscriptions: responseData.subscriptionRevenue,
                    consultations: responseData.consultationRevenue
                },
                totalPayments: responseData.count
            }
        });
    } catch (error) {
        console.error("Error fetching revenue data:", error);
        res.status(500).json({
            status: false,
            message: "Error fetching revenue data",
            error: error.message
        });
    }
};

// Get carbon footprint data and calculate percentages
exports.getCarbonFootprint = async (req, res) => {
    try {
        // Find all emissions data (or adjust query as needed)
        const emissionsData = await Emissions.find({});

        if (!emissionsData || emissionsData.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No emissions data found",
                data: []
            });
        }

        // Process all records or just the first one (adjust as needed)
        const result = emissionsData.map(data => {
            const carbonFootprint = data.carbon_footprint;

            // Calculate renewable percentage
            let renewablePercent = carbonFootprint.percentage_of_energy_renewable ||
                carbonFootprint.energy_sources.reduce((sum, source) => {
                    const renewableSources = ["Solar", "Wind", "Hydroelectricity", "Geothermal", "Biomass"];
                    return renewableSources.includes(source.source) ? sum + source.usage_percentage : sum;
                }, 0);

            return {
                company: data.basic_information.company_operating_name,
                carbonFootprint: {
                    totalConsumption: carbonFootprint.total_electrical_consumption_kwh,
                    energySources: carbonFootprint.energy_sources,
                    renewablePercentage: renewablePercent,
                    nonRenewablePercentage: 100 - renewablePercent,
                    vehicles: {
                        count: carbonFootprint.number_of_company_owned_vehicles,
                        fuelTypes: carbonFootprint.type_of_fuel_used_in_vehicles
                    },
                    travelData: {
                        flights: carbonFootprint.annual_business_flight_distance,
                        trains: carbonFootprint.annual_business_train_distance
                    }
                }
            };
        });

        res.status(200).json({
            status: true,
            message: "Carbon footprint data retrieved successfully",
            results: result.length,
            data: result
        });

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({
            status: false,
            message: "Failed to fetch carbon footprint data",
            error: err.message
        });
    }
};




// Helper calculation functions
function calculateTransportPercentage(carbonFootprint) {
    // Example calculation based on vehicles and travel data
    const vehicleImpact = carbonFootprint.number_of_company_owned_vehicles * 2; // Weight factor
    const flightImpact = carbonFootprint.annual_business_flight_distance.distance / 1000;
    const totalTransportImpact = vehicleImpact + flightImpact;

    // Convert to percentage (simplified - adjust with your actual formula)
    return Math.min(Math.round(totalTransportImpact / 50), 50);
}

function calculateManufacturingPercentage(basicInfo) {
    // Check if manufacturing is in business sectors
    const manufacturingSector = basicInfo.business_sector.find(
        sector => sector.sector === "Manufacturing"
    );
    return manufacturingSector ? manufacturingSector.carbon_emission_percentage : 10;
}

function calculateElectricityPercentage(carbonFootprint) {
    // Non-renewable portion of electricity
    const nonRenewable = 100 - (carbonFootprint.percentage_of_energy_renewable ||
        carbonFootprint.energy_sources.reduce((sum, source) => {
            const renewableSources = ["Solar", "Wind", "Hydroelectricity", "Geothermal", "Biomass"];
            return renewableSources.includes(source.source) ? sum + source.usage_percentage : sum;
        }, 0));

    return Math.round(nonRenewable / 2); // Adjust with your formula
}





// <<<<<<<<<<<<<<<<<<<<<<<<<<<SUBCRIPTION>>>>>>>>>>>>>>>>>>>>>>>>>>>>

exports.checkSubscription = async (req, res) => {

    const { id } = req.params

    try {
        const payment = await Payment.findById({ id })

        if (!payment) {
            return res.status(404).json({ message: "Payment record not found" });
        }

        const now = new Date();

        const isExpired = now > payment.availabilityTime;

        return res.status(200).json({
            status: true,
            expired: isExpired,
            expiresAt: payment.availabilityTime
        });
    }

    catch (error) {
        return res.status(500).json(responseFormatter(false, "Error checking subscriptions", error.message));
    }
}

// Get All Subscriptions
exports.getSubscriptions = async (_, res) => {
    try {
        const subscriptions = await Payment.find().sort({ date: -1 });
        return res.status(200).json(responseFormatter(true, "Subscriptions fetched successfully", subscriptions));
    } catch (error) {
        return res.status(500).json(responseFormatter(false, "Error fetching subscriptions", error.message));
    }
};
// Get Subscription by ID
exports.getSubscriptionById = async (req, res) => {
    try {
        const subscription = await Payment.find({user:req.params.id}).sort({ date: -1 });
        if (!subscription) {
            return res.status(404).json(responseFormatter(false, "Subscription not found"));
        }
        res.status(200).json(responseFormatter(true, "Subscription fetched successfully", subscription));
    } catch (error) {
        console.error("Error fetching subscription:", error);
        res.status(500).json(responseFormatter(false, "Internal server error", error.message));
    }
}

// Update Subscriptions
exports.updateSubscription = async (req, res) => {
    const { id } = req.params;
    const { packageId, subscriptionType, amount, date, features } = req.body;

    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(responseFormatter(false, "Invalid subscription ID"));
        }

        // Validate input fields
        if (!packageId || !subscriptionType || !amount || !date || !features || !Array.isArray(features) || features.length === 0) {
            return res.status(400).json(responseFormatter(false, "Missing required fields"));
        }

        // Validate date
        const parsedDate = new Date(date);
        if (isNaN(parsedDate)) {
            return res.status(400).json(responseFormatter(false, "Invalid date format"));
        }

        // Check uniqueness of packageId
        const existingSubscription = await Subscription.findOne({ packageId }).lean();
        if (existingSubscription && existingSubscription._id.toString() !== id) {
            return res.status(400).json(responseFormatter(false, "Package ID already exists"));
        }

        // Update subscription
        const updatedSubscription = await Subscription.findByIdAndUpdate(
            id,
            {
                packageId,
                subscriptionType,
                amount,
                date: parsedDate,
                features: features.map(f => f.trim())
            },
            { new: true }
        );

        if (!updatedSubscription) {
            return res.status(404).json(responseFormatter(false, "Subscription not found"));
        }

        return res.status(200).json(responseFormatter(true, "Subscription updated successfully", updatedSubscription));

    } catch (error) {
        return res.status(500).json(responseFormatter(false, "Error updating subscription", error.message));
    }
};

// Delete Subscription
exports.deleteSubscription = async (req, res) => {
    try {
        const deletedSubscription = await Subscription.findByIdAndDelete(req.params.id);
        if (!deletedSubscription) {
            return res.status(404).json(responseFormatter(false, "Subscription not found"));
        }

        res.status(200).json(responseFormatter(true, "Subscription deleted successfully"));
    } catch (error) {
        console.error("Error deleting subscription:", error)
    }
};






















////


