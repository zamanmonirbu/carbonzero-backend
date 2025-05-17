const Emissions = require("../models/EmissionsModel");
const Notification = require("../models/Notification.js");
const User = require("../models/User.js");
const { cloudinaryUpload } = require("../utils/cloudinaryUpload.js");
const mongoose = require("mongoose");


function organize(obj) {
  const result = {};
  for (let key in obj) {
    const keys = key.replace(/\[/g, ".").replace(/\]/g, "").split(".");
    keys.reduce((acc, k, i) => {
      if (i === keys.length - 1) {
        acc[k] = obj[key];
        return acc;
      }
      if (!acc[k]) {
        acc[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      }
      return acc[k];
    }, result);
  }
  return result;
}

// Color palette
const colors = [
  "#FF6633", "#FFB399", "#FF33FF", "#FFFF00", "#00B3E6", "#E6B8A3",
  "#4DAF4A", "#999999", "#80699B", "#DB7093", "#1A202C", "#34A85A",
  "#E5E5EA", "#8B9467", "#454F55",
];

// Assign color to array items
const assignColor = (items) => {
  return items.map((item, index) => ({
    ...item,
    color: colors[index % colors.length],
  }));
};

const createEmissions = async (req, res) => {
  const {user_id} = req.params;
  req.body.user_id = user_id;


  try {
    let emissionsData = organize(req.body);

    if (emissionsData.basic_information?.business_sector) {
      emissionsData.basic_information.business_sector = assignColor(
        emissionsData.basic_information.business_sector
      );
    }

    if (emissionsData.carbon_footprint) {
      if (emissionsData.carbon_footprint.energy_sources) {
        emissionsData.carbon_footprint.energy_sources = assignColor(
          emissionsData.carbon_footprint.energy_sources
        );
      }
      if (emissionsData.carbon_footprint.type_of_fuel_used_in_vehicles) {
        emissionsData.carbon_footprint.type_of_fuel_used_in_vehicles = assignColor(
          emissionsData.carbon_footprint.type_of_fuel_used_in_vehicles
        );
      }

      // Cast numeric values
      const cf = emissionsData.carbon_footprint;
      cf.total_electrical_consumption_kwh = Number(cf.total_electrical_consumption_kwh || 0);
      cf.percentage_of_energy_renewable = Number(cf.percentage_of_energy_renewable || 0);
      cf.number_of_company_owned_vehicles = Number(cf.number_of_company_owned_vehicles || 0);
      if (cf.average_distance_travelled_per_vehicle_annually?.distance) {
        cf.average_distance_travelled_per_vehicle_annually.distance = Number(cf.average_distance_travelled_per_vehicle_annually.distance);
      }
      if (cf.annual_business_flight_distance?.distance) {
        cf.annual_business_flight_distance.distance = Number(cf.annual_business_flight_distance.distance);
      }
      if (cf.annual_business_train_distance?.distance) {
        cf.annual_business_train_distance.distance = Number(cf.annual_business_train_distance.distance);
      }
    }

    if (emissionsData.basic_information?.number_of_employees) {
      emissionsData.basic_information.number_of_employees = Number(
        emissionsData.basic_information.number_of_employees
      );
    }

    if (emissionsData.finances) {
      emissionsData.finances.total_annual_turnover = Number(
        emissionsData.finances.total_annual_turnover || 0
      );
      emissionsData.finances.total_value_of_assets = Number(
        emissionsData.finances.total_value_of_assets || 0
      );
    }
    

    // ✅ Handle Cloudinary uploads
    if (req.files?.financial_statements) {
      const files = req.files.financial_statements;
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const uploadedFile = await cloudinaryUpload(
            file.path,
            file.filename,
            "financial_statements"
          );
          return uploadedFile.secure_url;
        })
      );

      if (!emissionsData.finances) emissionsData.finances = {};
      emissionsData.finances.financial_statements = uploadedFiles;
    }

    // ✅ Save emissions document
    const emissions = new Emissions(emissionsData);
    await emissions.save();

    
    const isEmissionSubmitted = await User.findOne({
      _id: user_id,
      isEmissionSubmitted: true,
    });



    // ✅ Mark user as submitted
    if (emissions && !isEmissionSubmitted) {
      await User.findOneAndUpdate(
        { _id: user_id },
        { $set: { isEmissionSubmitted: true } },
        { new: true }
      );
    }

    const user = await User.findOne({ _id: user_id });


    if (emissions) {
            const notification = new Notification({
              message: `The emissions form for ${user?.fullName} has been updated`,
              user: user_id,
            });
            await notification.save();
          }


    return res.status(201).json({
      status: true,
      message: "Emissions record created successfully",
      data: emissions,
    });
  } catch (error) {
    console.error("Emission submission error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};



const getMonthlyEmissionsByUserId = async (req, res) => {
  const { id } = req.params;

  try {
    const emissionsRecords = await Emissions.find({ user_id: id });

    if (!emissionsRecords || emissionsRecords.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No emissions records found for this user",
      });
    }

    const monthlyTotals = {};

    for (const record of emissionsRecords) {
      const factors = record.emission_factors || {};
      let totalCO2_kg = 0;

      // Electricity
      const totalKWh = record.carbon_footprint.total_electrical_consumption_kwh || 0;
      const energySources = record.carbon_footprint.energy_sources || [];
      for (const source of energySources) {
        const factor = factors.electricity?.[source.source] ?? 0.40;
        totalCO2_kg += totalKWh * (source.usage_percentage / 100) * factor;
      }

      // Vehicles
      const numVehicles = record.carbon_footprint.number_of_company_owned_vehicles || 0;
      const avgMiles = record.carbon_footprint.average_distance_travelled_per_vehicle_annually?.distance || 0;
      const totalMiles = numVehicles * avgMiles;
      const fuelTypes = record.carbon_footprint.type_of_fuel_used_in_vehicles || [];
      for (const fuel of fuelTypes) {
        const factor = factors.vehicles?.[fuel.fuel_type] ?? 0;
        totalCO2_kg += totalMiles * (fuel.usage_percentage / 100) * factor;
      }

      // Flights & Trains
      const flightMiles = record.carbon_footprint.annual_business_flight_distance?.distance || 0;
      const trainMiles = record.carbon_footprint.annual_business_train_distance?.distance || 0;
      const flightFactor = factors.businessTravel?.flight ?? 0.133;
      const trainFactor = factors.businessTravel?.train ?? 0.041;
      totalCO2_kg += (flightMiles * flightFactor) + (trainMiles * trainFactor);

      // Goods Transport
      const tons = record.supply_chain_logistics.volume_of_goods_transportation_tons || 0;
      const method = record.supply_chain_logistics.primary_transportation_method?.toLowerCase() || "truck";
      const distance = flightMiles + trainMiles;
      const goodsFactor = factors.goodsTransport?.[method] ?? 0.18;
      totalCO2_kg += tons * distance * goodsFactor;

      // Grouping Key (Month-Year)
      const createdAt = new Date(record.createdAt);
      const month = createdAt.toLocaleString('default', { month: 'long' });
      const year = createdAt.getFullYear();
      const key = `${month}-${year}`;

      // Add to Monthly Totals
      monthlyTotals[key] = (monthlyTotals[key] || 0) + totalCO2_kg;
    }

    // Format the result
    const result = Object.entries(monthlyTotals).map(([key, totalKg]) => {
      const [month, year] = key.split("-");
      return {
        month,
        year: parseInt(year),
        totalCO2_tonnes: +(totalKg / 100).toFixed(2),
      };
    });

    // Optional: sort by year/month
    result.sort((a, b) => new Date(`${a.month} 1, ${a.year}`) - new Date(`${b.month} 1, ${b.year}`));

    return res.status(200).json({
      status: true,
      message: "Monthly emissions aggregated successfully",
      data: result,
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};





const getEmissionsByUserId = async (req, res) => {
  const { id } = req.params;

  try {
    const emissions = await Emissions.findOne({ user_id: id }).sort({ createdAt: -1 });
    if (!emissions) {
      return res.status(404).json({
        status: false,
        message: "No emissions records found for this user",
      });
    }

    const factors = emissions.emission_factors || {};

    let totalCO2_kg = 0;

    // Electricity
    const totalKWh = emissions.carbon_footprint.total_electrical_consumption_kwh || 0;
    const energySources = emissions.carbon_footprint.energy_sources || [];

    let electricityCO2 = 0;
    for (const source of energySources) {
      const factor = factors.electricity?.[source.source] ?? 0.40; // fallback
      const contribution = totalKWh * (source.usage_percentage / 100) * factor;
      electricityCO2 += contribution;
    }
    totalCO2_kg += electricityCO2;

    // Vehicles
    const numVehicles = emissions.carbon_footprint.number_of_company_owned_vehicles || 0;
    const avgMiles = emissions.carbon_footprint.average_distance_travelled_per_vehicle_annually?.distance || 0;
    const totalMiles = numVehicles * avgMiles;

    const fuelTypes = emissions.carbon_footprint.type_of_fuel_used_in_vehicles || [];

    let vehicleCO2 = 0;
    for (const fuel of fuelTypes) {
      const fuelType = fuel.fuel_type;
      const factor = factors.vehicles?.[fuelType] ?? 0;
      const milesForFuel = totalMiles * (fuel.usage_percentage / 100);
      vehicleCO2 += milesForFuel * factor;
    }
    totalCO2_kg += vehicleCO2;

    // Flights & Trains
    const flightMiles = emissions.carbon_footprint.annual_business_flight_distance?.distance || 0;
    const trainMiles = emissions.carbon_footprint.annual_business_train_distance?.distance || 0;

    const flightFactor = factors.businessTravel?.flight ?? 0.133;
    const trainFactor = factors.businessTravel?.train ?? 0.041;

    const travelCO2 = (flightMiles * flightFactor) + (trainMiles * trainFactor);
    totalCO2_kg += travelCO2;

    // Goods Transport
    const tons = emissions.supply_chain_logistics.volume_of_goods_transportation_tons || 0;
    const method = emissions.supply_chain_logistics.primary_transportation_method?.toLowerCase() || "truck";
    const distance = flightMiles+trainMiles;

    const goodsFactor = factors.goodsTransport?.[method] ?? 0.18;
    const goodsCO2 = tons * distance * goodsFactor;
    totalCO2_kg += goodsCO2;

    const totalCO2_tonnes = +(totalCO2_kg / 1000).toFixed(2);

    return res.status(200).json({
      status: true,
      message: "Emissions records fetched and calculated successfully",
      data: {
        ...emissions.toObject(),
        calculated_emissions: {
          totalCO2_kg: ((+totalCO2_kg)/100).toFixed(2),
          totalCO2_tonnes: ((totalCO2_tonnes)/100).toFixed(2),
          breakdown: {
            electricityCO2_kg: ((+electricityCO2)/100).toFixed(2),
            vehicleCO2_kg: ((+vehicleCO2)/100).toFixed(2),
            travelCO2_kg: ((+travelCO2)/100).toFixed(2),
            goodsCO2_kg: ((+goodsCO2)/100).toFixed(2),
          }
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};






const getLatestCarbonEmissionsPerYear = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      status: false,
      message: "Invalid user ID",
    });
  }

  try {
    const emissionsData = await Emissions.aggregate([
      {
        $match: { user_id: new mongoose.Types.ObjectId(userId) },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: { $year: "$createdAt" },
          totalCarbonEmissions: { $first: "$basic_information.total_carbon_emissions" },
        },
      },
      {
        $sort: { _id: 1 }, // sort by year ascending
      },
    ]);

    if (!emissionsData.length) {
      return res.status(404).json({
        status: false,
        message: "No emissions data found for this user",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Latest carbon emissions per year fetched successfully",
      data: emissionsData.map((item) => ({
        year: item._id,
        totalCarbonEmissions: item.totalCarbonEmissions,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};



// @desc:  Get all emissions records
// @route: GET /api/v1/emissions
const getAllEmissions = async (req, res) => {
  try {
    console.log("dsfs");
    
    const emissions = await Emissions.find({});
    return res.status(200).json({
      status: true,
      message: "Emissions records fetched successfully",
      data: emissions,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};

// @desc:  Get a single emissions record by ID
// @route: GET /api/v1/emissions/:id
const getEmissionsById = async (req, res) => {
  try {
    const emissions = await Emissions.findById(req.params.id);

    if (!emissions) {
      return res.status(404).json({
        status: false,
        message: "Emissions record not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Emissions record fetched successfully",
      data: emissions,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};




// @desc:  Delete an emissions record by ID
// @route: DELETE /api/v1/emissions/:id
const deleteEmissions = async (req, res) => {
  try {
    const emissions = await Emissions.findByIdAndDelete(req.params.id);

    if (!emissions) {
      return res.status(404).json({
        status: false,
        message: "Emissions record not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Emissions record deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};

module.exports = {
  createEmissions,
  getAllEmissions,
  getEmissionsById,
  getEmissionsByUserId,
  getLatestCarbonEmissionsPerYear,
  getMonthlyEmissionsByUserId,
  // updateEmissions,
  deleteEmissions,
};
